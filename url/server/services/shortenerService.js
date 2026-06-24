const Url = require('../models/urlModel');
const axios = require('axios');

// Helper to generate a random short code
function generateShortCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Helper to check URL validity
function isValidUrl(urlString) {
  try {
    new URL(urlString);
    return true;
  } catch (e) {
    return false;
  }
}

// Helper to scrape title of a webpage using axios (user requested axios!)
async function fetchPageTitle(urlString) {
  try {
    if (!isValidUrl(urlString)) return 'Unknown Title';

    const response = await axios.get(urlString, {
      timeout: 3000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    const html = response.data;
    if (typeof html !== 'string') return new URL(urlString).hostname;

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    
    if (titleMatch && titleMatch[1]) {
      // Decode basic HTML entities
      return titleMatch[1].trim()
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    }
    
    return new URL(urlString).hostname;
  } catch (error) {
    try {
      return new URL(urlString).hostname;
    } catch (_) {
      return 'Unknown Title';
    }
  }
}

/**
 * Service to manage URL shortening using MongoDB
 */
const ShortenerService = {
  // Get all shortened links (newest first)
  async getAll() {
    return await Url.find().sort({ createdAt: -1 });
  },

  // Find a link by its short code
  async findByCode(code) {
    return await Url.findOne({ code });
  },

  // Create a shortened link
  async create(originalUrl, customCode) {
    let formattedUrl = originalUrl.trim();
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = 'http://' + formattedUrl;
    }

    if (!isValidUrl(formattedUrl)) {
      throw new Error('Invalid URL format');
    }

    let code = customCode ? customCode.trim() : '';

    if (code) {
      if (!/^[a-zA-Z0-9_-]{3,15}$/.test(code)) {
        throw new Error('Custom code must be 3-15 alphanumeric characters, dashes, or underscores');
      }
      
      const exists = await Url.findOne({ code: { $regex: new RegExp(`^${code}$`, 'i') } });
      if (exists) {
        throw new Error('Custom short code is already taken');
      }
    } else {
      let attempts = 0;
      do {
        code = generateShortCode();
        attempts++;
      } while (await Url.findOne({ code }) && attempts < 10);
      
      if (attempts >= 10) {
        throw new Error('Failed to generate a unique short code. Please try again.');
      }
    }

    // Fetch page title
    const title = await fetchPageTitle(formattedUrl);

    const newLink = new Url({
      code,
      originalUrl: formattedUrl,
      title
    });

    await newLink.save();
    return newLink;
  },

  // Increment clicks counter for a code
  async incrementClicks(code) {
    return await Url.findOneAndUpdate(
      { code },
      { $inc: { clicks: 1 } },
      { new: true }
    );
  },

  // Delete a shortened link
  async delete(code) {
    const result = await Url.deleteOne({ code });
    return result.deletedCount > 0;
  }
};

module.exports = ShortenerService;
