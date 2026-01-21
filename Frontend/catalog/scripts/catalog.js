const API = 'http://localhost:3001/products';
const catalog = document.getElementById('catalog');

async function loadCatalog() {
  try {
    const res = await fetch(API);
    const products = await res.json();

    catalog.innerHTML = '';

    products.forEach(p => {
      const card = document.createElement('div');
      card.className = 'product-card';

      card.innerHTML = `
        <h3>${p.name}</h3>
        <p>${p.description}</p>
        <p><strong>€${Number(p.price).toFixed(2)}</strong></p>
        <button onclick="openProduct(${p.id})">Ver Produto</button>
      `;

      catalog.appendChild(card);
    });
  } catch (err) {
    catalog.innerHTML = '<p>Erro ao carregar os produtos.</p>';
    console.error(err);
  }
}

function openProduct(id) {
  window.location.href = `productPage.html?id=${id}`;
}

loadCatalog();


function openProduct(id) {
  window.location.href = `productPage.html?id=${id}`;
}

loadCatalog();
