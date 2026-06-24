const ShortenerService = require('../services/shortenerService');

const UrlController = {
  // Get all URLs
  async getAllUrls(req, res) {
    try {
      const urls = await ShortenerService.getAll();
      return res.status(200).json({
        success: true,
        data: urls
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve URLs: ' + error.message
      });
    }
  },

  // Create a short URL
  async createUrl(req, res) {
    try {
      const { originalUrl, customCode } = req.body;

      if (!originalUrl) {
        return res.status(400).json({
          success: false,
          message: 'Original URL is required'
        });
      }

      const newLink = await ShortenerService.create(originalUrl, customCode);
      return res.status(201).json({
        success: true,
        data: newLink
      });
    } catch (error) {
      const status = error.message.includes('Invalid') || error.message.includes('already taken') || error.message.includes('must be') ? 400 : 500;
      return res.status(status).json({
        success: false,
        message: error.message
      });
    }
  },

  // Delete a short URL
  async deleteUrl(req, res) {
    try {
      const { code } = req.params;
      const success = await ShortenerService.delete(code);

      if (!success) {
        return res.status(404).json({
          success: false,
          message: 'Short URL code not found'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Short URL deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to delete URL: ' + error.message
      });
    }
  }
};

module.exports = UrlController;
