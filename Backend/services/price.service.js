function calculateFinalPrice(base, margin, tax) {
  if (base < 0) {
    throw new Error("Preço base inválido");
  }

  const priceWithMargin = base * (1 + margin / 100);
  const finalPrice = priceWithMargin * (1 + tax / 100);

  return Number(finalPrice.toFixed(2));
}

module.exports = {
  calculateFinalPrice
};
