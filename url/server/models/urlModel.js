const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },
  originalUrl: {
    type: String,
    required: true,
    trim: true
  },
  title: {
    type: String,
    default: 'Unknown Title',
    trim: true
  },
  clicks: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Url', urlSchema);
