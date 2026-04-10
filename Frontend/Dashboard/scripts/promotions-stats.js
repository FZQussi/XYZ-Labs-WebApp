// Frontend/Dashboard/scripts/promotions-stats.js
// Atualiza os stats da aba de promoções e garante que carregam ao mudar de aba
(() => {
  // Atualizar stats no topo da aba quando os dados chegam
  function updatePromoStats(promos) {
    const countEl   = document.getElementById('promoCount');
    const avgEl     = document.getElementById('promoAvgDiscount');
    const maxEl     = document.getElementById('promoMaxDiscount');

    if (!countEl) return;

    const active = promos.filter(p => {
      const now  = new Date();
      const end  = p.promotion_end ? new Date(p.promotion_end) : null;
      return !end || end >= now;
    });

    countEl.textContent = active.length;

    if (active.length > 0) {
      const discounts = active.map(p => p.discount_percent);
      const avg = Math.round(discounts.reduce((a, b) => a + b, 0) / discounts.length);
      const max = Math.max(...discounts);
      avgEl.textContent = `${avg}%`;
      maxEl.textContent = `${max}%`;
    } else {
      avgEl.textContent = '—';
      maxEl.textContent = '—';
    }
  }

  // Override do reloadPromotions para também atualizar stats
  const _original = window.reloadPromotions;
  window.reloadPromotions = async function() {
    if (_original) await _original();
    // Buscar dados novamente para os stats (já estarão no DOM via renderPromotions)
    // Alternativa mais simples: pedir novamente à API
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/products/promotions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        updatePromoStats(data);
      }
    } catch (_) { /* silencioso */ }
  };

  // Botão refresh
  document.getElementById('refreshPromotionsBtn')?.addEventListener('click', () => {
    window.reloadPromotions?.();
  });

  console.log('✅ promotions-stats.js carregado');
})();