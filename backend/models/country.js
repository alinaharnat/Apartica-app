const mongoose = require('mongoose');

const CountrySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  }
});

module.exports = mongoose.model('Country', CountrySchema);
