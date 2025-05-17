const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const houseRuleOptionSchema = new Schema({
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'HouseRuleCategory',
    required: true,
  },
  value: {
    type: String,
    required: true,
    trim: true,
  }
}, { timestamps: true });

module.exports = mongoose.model('HouseRuleOption', houseRuleOptionSchema);
