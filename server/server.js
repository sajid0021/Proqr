const express = require('express');
const cors    = require('cors');
const QRCode  = require('qrcode');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const db      = require('./db');

const app  = express();
const PORT = 5000;

// ── Middleware ─────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Static: serve uploaded files ───────────────────────────────────
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOADS_DIR));

// ── Multer: disk storage with unique filenames ─────────────────────
const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  filename: (req, file, cb) => {
    const uid = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
    cb(null, uid + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/', 'audio/', 'video/', 'application/pdf'];
    allowed.some(t => file.mimetype.startsWith(t))
      ? cb(null, true)
      : cb(new Error(`File type "${file.mimetype}" is not supported`));
  },
});

// ── POST /api/upload ───────────────────────────────────────────────
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    url:          `http://localhost:${PORT}/uploads/${req.file.filename}`,
    originalName: req.file.originalname,
    size:         req.file.size,
    mimetype:     req.file.mimetype,
  });
});

// ── GET /r/:id (Dynamic Redirect) ──────────────────────────────────
app.get('/r/:id', (req, res) => {
  const qr = db.getQR(req.params.id);
  if (!qr) {
    return res.status(404).send(`
      <div style="font-family: sans-serif; text-align: center; padding: 50px;">
        <h1 style="color: #ef4444;">404 - QR Code Not Found</h1>
        <p>This QR code might have been deleted or is expired.</p>
        <a href="http://localhost:5173" style="color: #6366f1; text-decoration: none; font-weight: bold;">Create your own at ProQR Studio</a>
      </div>
    `);
  }

  // Log scan asynchronously
  db.logScan(req.params.id, req);

  // Redirect to target URL
  res.redirect(qr.targetUrl);
});

// ── POST /api/dynamic/create (Create Dynamic QR) ───────────────────
app.post('/api/dynamic/create', (req, res) => {
  try {
    const { targetUrl, type, name, options } = req.body;
    if (!targetUrl) return res.status(400).json({ error: 'Target URL is required' });

    const newQR = db.createQR({ targetUrl, type, name, options });
    const redirectUrl = `http://localhost:${PORT}/r/${newQR.id}`;

    res.json({
      ...newQR,
      redirectUrl
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create dynamic QR code' });
  }
});

// ── GET /api/dynamic/list (List Dynamic QRs) ───────────────────────
app.get('/api/dynamic/list', (req, res) => {
  try {
    const qrs = db.listQRs().map(q => ({
      ...q,
      redirectUrl: `http://localhost:${PORT}/r/${q.id}`
    }));
    res.json(qrs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve dynamic QR codes' });
  }
});

// ── PUT /api/dynamic/:id (Update Dynamic Target) ───────────────────
app.put('/api/dynamic/:id', (req, res) => {
  try {
    const { targetUrl } = req.body;
    if (!targetUrl) return res.status(400).json({ error: 'Target URL is required' });

    const updated = db.updateQR(req.params.id, targetUrl);
    if (!updated) return res.status(404).json({ error: 'QR Code not found' });

    res.json({
      ...updated,
      redirectUrl: `http://localhost:${PORT}/r/${updated.id}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update dynamic QR code' });
  }
});

// ── DELETE /api/dynamic/:id (Delete Dynamic QR) ───────────────────
app.delete('/api/dynamic/:id', (req, res) => {
  try {
    const success = db.deleteQR(req.params.id);
    if (!success) return res.status(404).json({ error: 'QR Code not found' });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete QR code' });
  }
});

// ── GET /api/dynamic/:id/analytics (Get Analytics) ────────────────
app.get('/api/dynamic/:id/analytics', (req, res) => {
  try {
    const analytics = db.getAnalytics(req.params.id);
    if (!analytics) return res.status(404).json({ error: 'QR Code not found' });
    
    // Add redirectUrl to QR object
    analytics.qr.redirectUrl = `http://localhost:${PORT}/r/${analytics.qr.id}`;
    res.json(analytics);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve analytics' });
  }
});

// ── POST /api/generate (Static QR Generation) ──────────────────────
app.post('/api/generate', async (req, res) => {
  try {
    const { text, options } = req.body;
    if (!text) return res.status(400).json({ error: 'Text / URL is required' });

    const qrOptions = {
      errorCorrectionLevel: options?.errorCorrectionLevel || 'H',
      margin: options?.margin   ?? 2,
      width:  options?.width    || 400,
      color: {
        dark:  options?.colorDark  || '#000000',
        light: options?.colorLight || '#ffffff',
      },
    };

    const dataUrl = await QRCode.toDataURL(text, qrOptions);
    res.json({ qrCode: dataUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// ── Global error handler ───────────────────────────────────────────
app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message });
});

app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
