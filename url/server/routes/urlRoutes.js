const express = require('express');
const router = express.Router();
const UrlController = require('../controllers/urlController');

// Route configurations
router.get('/', UrlController.getAllUrls);
router.post('/', UrlController.createUrl);
router.delete('/:code', UrlController.deleteUrl);

module.exports = router;
