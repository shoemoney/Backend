const user = require('../models/user.model');
const jwt = require('jsonwebtoken');

exports.checkUser = function (req, res) {
    user.findOne({ username: req.body.username }, function (err, element) {
        if (element) {
            element.comparePassword(req.body.password, function (err, isMatch) {
                if (err) throw err;
                if (isMatch) {
                    let username = req.body.username;
                    jwt.sign({ username }, 'secretkey', { expiresIn: '10min' }, (err, token) => {
                        element = element.toObject();
                        delete element.password;
                        res.json(
                            { token, user: element }
                        )
                    })
                } else {
                    res.sendStatus(401);
                }
            });
        }
        else {
            res.sendStatus(401);
        }
    })
};

exports.verifyToken = function (req, res, next) {
    const bearerHeader = req.headers['authorization']
    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(' ')[1];
        req.token = bearerToken;
        jwt.verify(req.token, 'secretkey', (err, data) => {
            if (err) {
                res.sendStatus(403);
            } else {
                next()
            }
        })
    } else {
        res.sendStatus(403);
    }
}