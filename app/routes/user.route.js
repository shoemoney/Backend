const express = require('express');
const router = express.Router();
const user_controller = require('../db/controllers/user.controller');
const auth = require('../db/controllers/auth.controller')

router.get('/', user_controller.getAll);
router.post('/create', auth.verifyToken, user_controller.create);
router.get('/:id', user_controller.details);
router.put('/:id/update', user_controller.update);
router.delete('/:id/delete', user_controller.delete);

module.exports = router;