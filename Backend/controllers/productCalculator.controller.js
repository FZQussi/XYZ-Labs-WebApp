const priceService = require('../services/price.service');

exports.calculatePrice = (req, res) => {
  try {
    const { base, margin, tax } = req.body;

    const finalPrice = priceService.calculateFinalPrice(base, margin, tax);

    return res.json({ finalPrice });

  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
};

