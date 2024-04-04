const express = require('express');
const Appcontroller = require('../controllers/AppController');

const router = express.Router();

router.get('/status', Appcontroller.getStatus);

router.get('/stats', Appcontroller.getStats);

module.exports = router;
