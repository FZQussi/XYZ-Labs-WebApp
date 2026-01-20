const params = new URLSearchParams(window.location.search);
const productId = params.get('id');

const API_PRODUCTS = 'http://localhost:3001/products';
const API_COLORS = 'http://localhost:3001/colors';

const viewer = document.getElementById('productModel');
const colorOptions = document.getElementById('colorOptions');

async function loadProduct() {
  const res = await fetch(`${API_PRODUCTS}/${productId}`);
  const product = await res.json();

  viewer.src = `models/product-${product.id}.glb`;

  document.getElementById('productName').textContent = product.name;
  document.getElementById('productPrice').textContent =
    Number(product.price).toFixed(2);
}

async function loadColors() {
  const res = await fetch(API_COLORS);
  const colors = await res.json();

  colors.forEach(c => {
    const btn = document.createElement('button');
    btn.style.background = c.hex;
    btn.onclick = () => applyColor(c.hex, c.name);
    colorOptions.appendChild(btn);
  });
}

function applyColor(hex, name) {
  const rgb = hexToRgb(hex);

  viewer.model.materials.forEach(mat => {
    mat.pbrMetallicRoughness.setBaseColorFactor([
      rgb.r / 255,
      rgb.g / 255,
      rgb.b / 255,
      1
    ]);
  });

  document.getElementById('productColor').textContent = name;
}

function hexToRgb(hex) {
  hex = hex.replace('#','');
  return {
    r: parseInt(hex.substr(0,2),16),
    g: parseInt(hex.substr(2,2),16),
    b: parseInt(hex.substr(4,2),16)
  };
}

loadProduct();
loadColors();
