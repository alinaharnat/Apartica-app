const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const citySchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  imageUrl: {
    type: String,
  },
  countryId: {
    type: Schema.Types.ObjectId,
    ref: 'Country',
    required: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('City', citySchema);