const mongoose = require('mongoose');

const ActivitySchema = new mongoose.Schema({
  name: String,
  maxSeats: Number,
  bookedSeats: { type: Number, default: 0 }
});

module.exports = mongoose.model('Activity', ActivitySchema);