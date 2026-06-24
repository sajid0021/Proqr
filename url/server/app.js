const express = require('express');
const cors = require('cors');
const urlRoutes = require('./routes/urlRoutes');
const ShortenerService = require('./services/shortenerService');

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/urls', urlRoutes);

// Redirection handler (GET /:code) - Made async to support MongoDB queries!
app.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;
    const link = await ShortenerService.findByCode(code);

    if (!link) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Link Not Found</title>
          <style>
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              background-color: #f8fafc;
              color: #1e293b;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              text-align: center;
            }
            .container {
              background: rgba(255, 255, 255, 0.7);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(255, 255, 255, 0.5);
              padding: 2.5rem;
              border-radius: 16px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
              max-width: 400px;
            }
            h1 {
              color: #6366f1;
              margin-top: 0;
              font-size: 2rem;
            }
            p {
              color: #64748b;
              font-size: 1.1rem;
              line-height: 1.5;
            }
            .btn {
              display: inline-block;
              margin-top: 1.5rem;
              background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
              color: white;
              padding: 0.75rem 1.5rem;
              text-decoration: none;
              border-radius: 8px;
              font-weight: 600;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>404: Link Not Found</h1>
            <p>The shortened URL you are looking for doesn't exist, has expired, or was deleted.</p>
            <a href="http://localhost:5173" class="btn">Go to Dashboard</a>
          </div>
        </body>
        </html>
      `);
    }

    // Increment click count in the background
    await ShortenerService.incrementClicks(code);

    // Redirect to the original destination
    return res.redirect(302, link.originalUrl);
  } catch (error) {
    console.error('Redirection error:', error);
    return res.status(500).send('An error occurred during redirect.');
  }
});

module.exports = app;
