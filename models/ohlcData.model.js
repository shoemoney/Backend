const mongoose = require('mongoose');
const Schema = mongoose.Schema;

let ohlcvSchema = new Schema(
    {
        open: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        close: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        high: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        low: { type: Number, required: true, get: v => Math.floor(v), set: v => Math.floor(v) },
        timestamp: { type: Date, required: true, unique: true },
    }
)
ohlcvSchema.methods.diff = function diff() {
    return Math.floor(this.close - this.open);
}
ohlcvSchema.methods.avg = function avg() {
    return Math.floor((this.low + this.high) / 2);
}

module.exports.ohlcData1d = mongoose.model('ohlcData1d', ohlcvSchema);
module.exports.ohlcData1h = mongoose.model('ohlcData1h', ohlcvSchema);
module.exports.ohlcData5m = mongoose.model('ohlcData5m', ohlcvSchema);
module.exports.ohlcData1m = mongoose.model('ohlcData1m', ohlcvSchema);