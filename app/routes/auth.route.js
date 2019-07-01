const express = require('express');
const router = express.Router();

const auth_controller = require('../db/controllers/auth.controller');

router.post('/', auth_controller.checkUser);

module.exports = router;