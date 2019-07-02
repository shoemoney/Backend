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
                        res.json(
                            { token }
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