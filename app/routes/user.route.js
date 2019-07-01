const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const user_controller = require('../db/controllers/user.controller');

router.get('/', user_controller.getAll);
router.post('/create', verifyToken, user_controller.create);
router.get('/:id', user_controller.details);
router.put('/:id/update', user_controller.update);
router.delete('/:id/delete', user_controller.delete);

function verifyToken(req, res, next) {
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

module.exports = router;