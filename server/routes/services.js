const router = require('express').Router();
const Service = require('../models/Service');

router.get('/', async (req, res) => {
  res.json(await Service.find({ active: true }).sort('createdAt'));
});

module.exports = router;
