const ohlc = require('../models/ohlcData.model');
const ohlcData = ohlc.ohlcData1d; 

exports.getAll = function (req, res) {
    ohlcData.find(function (err, element) {
        if (err) return next(err);
        res.send(element);
    })
};

exports.details = function (req, res) {
    ohlcData.findById(req.params.id, function (err, element) {
        if (err) return next(err);
        res.send(element);
    })
};

exports.update = function (req, res) {
    ohlcData.findByIdAndUpdate(req.params.id, { $set: req.body }, function (err, product) {
        if (err) return next(err);
        res.send('Data udpated.');
    });
};

exports.delete = function (req, res) {
    ohlcData.findByIdAndRemove(req.params.id, function (err) {
        if (err) return next(err);
        res.send('Deleted successfully!');
    })
};

exports.create = function (req, res) {
    let data = new ohlcData(
        {
            open: req.body.open,
            close: req.body.close,
            high: req.body.high,
            low: req.body.low,
            timestamp: req.body.timestamp,
        }
    );
    data.save(data, function (err) {
        if (err) {
            return next(err);
        }
        res.send('Product Created successfully')
    })
};