// Frontend/Dashboard/scripts/ProductCalculator.js
document.getElementById('calculatePriceBtn').addEventListener('click', async () => {

  const base = parseFloat(document.getElementById('calcBasePrice').value) || 0;
  const margin = parseFloat(document.getElementById('calcMargin').value) || 0;
  const tax = parseFloat(document.getElementById('calcTax').value) || 0;

  try {
    const response = await fetch('/api/dashboard/calculate-price', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // ⚠️ importante se usares cookies
      body: JSON.stringify({ base, margin, tax })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro ao calcular');
    }

    document.getElementById('calcFinalPrice').textContent = data.finalPrice.toFixed(2);

  } catch (error) {
    console.error(error);
    alert('Erro ao calcular preço');
  }
});
