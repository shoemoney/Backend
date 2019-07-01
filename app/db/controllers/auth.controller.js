const user = require('../models/user.model');
const jwt = require('jsonwebtoken');

exports.checkUser = function (req, res) {
    user.find({username: req.body.username} , function (err, element) {
        if (element.length) {
            let username = element.username;
            jwt.sign({username},'secretkey', {expiresIn: '10min'},(err, token) => {
                res.json(
                    {token}
                )
            })
        }
        else {
            res.sendStatus(401);
        }
    })
};