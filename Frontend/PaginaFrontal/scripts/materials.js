// materials.js
document.addEventListener('DOMContentLoaded', () => {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const materialCards = document.querySelectorAll('.material-card');

  // Filtrar materiais
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const category = btn.dataset.category;

      // Atualizar botões ativos
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      // Filtrar cards
      materialCards.forEach(card => {
        if (category === 'all' || card.dataset.category === category) {
          card.style.display = 'block';
        } else {
          card.style.display = 'none';
        }
      });
    });
  });

  // Botões de seleção
  document.querySelectorAll('.btn-material-select').forEach(btn => {
    btn.addEventListener('click', () => {
      const materialName = btn.closest('.material-card').querySelector('h3').textContent;
      
      if (confirm(`Deseja utilizar ${materialName} no seu projeto?\n\nVai ser redirecionado para a página de contacto.`)) {
        window.location.href = 'contact.html';
      }
    });
  });
});