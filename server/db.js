const fs = require('fs');
const path = require('path');

const DB_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Initialize database file if it doesn't exist
function initDB() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ qrs: [], scans: [] }, null, 2));
  }
}

// Read database
function readDB() {
  initDB();
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (err) {
    console.error('Error reading database file, returning empty state:', err);
    return { qrs: [], scans: [] };
  }
}

// Write database
function writeDB(data) {
  initDB();
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error writing to database file:', err);
  }
}

// Parse User Agent into Device, Browser, OS
function parseUserAgent(uaString) {
  const ua = (uaString || '').toLowerCase();
  
  // OS detection
  let os = 'Unknown';
  if (ua.includes('windows')) os = 'Windows';
  else if (ua.includes('macintosh') || ua.includes('mac os x')) os = 'macOS';
  else if (ua.includes('iphone')) os = 'iOS (iPhone)';
  else if (ua.includes('ipad')) os = 'iOS (iPad)';
  else if (ua.includes('android')) os = 'Android';
  else if (ua.includes('linux')) os = 'Linux';

  // Device detection
  let device = 'Desktop';
  if (ua.includes('ipad') || (ua.includes('macintosh') && 'ontouchend' in global)) {
    device = 'Tablet';
  } else if (ua.includes('mobi') || ua.includes('iphone') || ua.includes('android')) {
    device = 'Mobile';
  }

  // Browser detection
  let browser = 'Other';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome/') || ua.includes('crios/')) browser = 'Chrome';
  else if (ua.includes('firefox/') || ua.includes('fxios/')) browser = 'Firefox';
  else if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('chromium')) browser = 'Safari';
  else if (ua.includes('opera/') || ua.includes('opr/')) browser = 'Opera';
  else if (ua.includes('trident/') || ua.includes('msie ')) browser = 'IE';

  return { os, device, browser };
}

// Generate a random 6-character alphanumeric ID
function generateId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const db = {
  // Create a new dynamic QR code
  createQR({ targetUrl, type, name, options }) {
    const data = readDB();
    
    // Ensure unique ID
    let id = generateId();
    while (data.qrs.some(q => q.id === id)) {
      id = generateId();
    }

    const newQR = {
      id,
      targetUrl,
      type: type || 'url',
      name: name || `Dynamic QR - ${id}`,
      options: options || {},
      createdAt: new Date().toISOString()
    };

    data.qrs.push(newQR);
    writeDB(data);
    return newQR;
  },

  // Get QR by ID
  getQR(id) {
    const data = readDB();
    return data.qrs.find(q => q.id === id) || null;
  },

  // Update QR target URL
  updateQR(id, targetUrl) {
    const data = readDB();
    const qrIndex = data.qrs.findIndex(q => q.id === id);
    if (qrIndex === -1) return null;

    data.qrs[qrIndex].targetUrl = targetUrl;
    data.qrs[qrIndex].updatedAt = new Date().toISOString();
    writeDB(data);
    return data.qrs[qrIndex];
  },

  // Delete QR
  deleteQR(id) {
    const data = readDB();
    data.qrs = data.qrs.filter(q => q.id !== id);
    data.scans = data.scans.filter(s => s.qrId !== id);
    writeDB(data);
    return true;
  },

  // List all QRs
  listQRs() {
    const data = readDB();
    // Sort by createdAt descending
    return [...data.qrs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  },

  // Log scan event
  logScan(qrId, req) {
    const data = readDB();
    const qrExists = data.qrs.some(q => q.id === qrId);
    if (!qrExists) return false;

    const uaString = req.headers['user-agent'] || '';
    const { os, device, browser } = parseUserAgent(uaString);
    
    // Resolve client IP (supporting reverse proxies)
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '127.0.0.1';

    const scanEvent = {
      qrId,
      timestamp: new Date().toISOString(),
      ip,
      device,
      browser,
      os,
      referer: req.headers['referer'] || 'Direct'
    };

    data.scans.push(scanEvent);
    writeDB(data);
    return true;
  },

  // Get Analytics details for a specific QR
  getAnalytics(qrId) {
    const data = readDB();
    const qr = data.qrs.find(q => q.id === qrId);
    if (!qr) return null;

    const qrScans = data.scans.filter(s => s.qrId === qrId);
    
    // Aggregations
    const devices = {};
    const browsers = {};
    const oss = {};
    const timeline = {}; // grouped by date

    qrScans.forEach(scan => {
      // Devices
      devices[scan.device] = (devices[scan.device] || 0) + 1;
      
      // Browsers
      browsers[scan.browser] = (browsers[scan.browser] || 0) + 1;

      // OS
      oss[scan.os] = (oss[scan.os] || 0) + 1;

      // Timeline (YYYY-MM-DD)
      const dateStr = scan.timestamp.split('T')[0];
      timeline[dateStr] = (timeline[dateStr] || 0) + 1;
    });

    // Recent Scans (last 15)
    const recentScans = [...qrScans]
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 15);

    return {
      qr,
      totalScans: qrScans.length,
      deviceBreakdown: devices,
      browserBreakdown: browsers,
      osBreakdown: oss,
      timeline,
      recentScans
    };
  }
};

module.exports = db;
