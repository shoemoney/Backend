const user = require('../models/user.model');

exports.getAll = function (req, res, next) {
    user.find(function (err, element) {
        if (err) return next(err);
        res.send(element);
    })
};

exports.details = function (req, res, next) {
    user.findById(req.params.id, function (err, element) {
        if (err) return next(err);
        res.send(element);
    })
};

exports.update = function (req, res, next) {
    user.findByIdAndUpdate(req.params.id, { $set: req.body }, function (err, element) {
        if (err) return next(err);
        res.send('Data udpated.');
    });
};

exports.delete = function (req, res, next) {
    user.findByIdAndRemove(req.params.id, function (err) {
        if (err) return next(err);
        res.send('Deleted successfully!');
    })
};

exports.create = function (req, res, next) {
    let data = new user(
        {
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
        }
    );
    data.save(data, function (err) {
        if (err) {
            return next(err);
        }
        res.send('User Created successfully')
    })
};