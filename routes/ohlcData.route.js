const express = require('express');
const router = express.Router();

const ohlcData_controller = require('../controllers/ohlcData.controller');

router.get('/', ohlcData_controller.getAll);
router.post('/create', ohlcData_controller.create);
router.get('/:id', ohlcData_controller.details);
router.put('/:id/update', ohlcData_controller.update);
router.delete('/:id/delete', ohlcData_controller.delete);

module.exports = router;