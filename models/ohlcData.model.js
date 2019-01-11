const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ohlcvSchema = new Schema(
    {
        open: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        close: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        high: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        low: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        timestamp: { type: Date, required: true },
    }
)
ohlcvSchema.methods.diff = function diff() {
    return Math.floor(this.close - this.open);
}
ohlcvSchema.methods.avg = function avg() {
    return Math.floor((this.low + this.high) / 2);
}

module.exports = mongoose.model('ohlcData', ohlcvSchema);