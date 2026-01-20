const viewer = document.getElementById('productModel');
const colorPicker = document.getElementById('colorPicker');

let selectedColor = null; // cor selecionada
let modelLoaded = false;

// =============================
// CARREGAR PRODUTO
// =============================
async function loadProduct() {
  const res = await fetch(`${API_PRODUCTS}/${productId}`);
  const product = await res.json();

  viewer.src = `models/${product.model_file}`;

  document.getElementById('productName').textContent = product.name;
  document.getElementById('productDescription').textContent = product.description;
  document.getElementById('productPrice').textContent = Number(product.price).toFixed(2);
}

// =============================
// CARREGAR CORES
// =============================
async function loadColors() {
  const res = await fetch(API_COLORS);
  const colors = await res.json();

  colorPicker.innerHTML = '';

  colors.forEach(color => {
    const btn = document.createElement('div');
    btn.className = 'color-btn';
    btn.style.background = color.hex;
    btn.title = color.name;

    btn.onclick = () => {
      selectedColor = color;   // guarda a cor selecionada
      applyColor();
    };

    colorPicker.appendChild(btn);
  });
}

// =============================
// APLICAR COR AO MODELO
// =============================
function applyColor() {
  if (!modelLoaded || !selectedColor) return;

  const rgb = hexToRgb(selectedColor.hex);

  viewer.model.materials.forEach(mat => {
    mat.pbrMetallicRoughness.setBaseColorFactor([
      rgb.r / 255,
      rgb.g / 255,
      rgb.b / 255,
      1
    ]);
  });

  document.getElementById('productColor').textContent = selectedColor.name;
}

// =============================
// HELPER HEX -> RGB
// =============================
function hexToRgb(hex) {
  hex = hex.replace('#','');
  return {
    r: parseInt(hex.substring(0,2),16),
    g: parseInt(hex.substring(2,4),16),
    b: parseInt(hex.substring(4,6),16)
  };
}

// =============================
// ESPERA O MODELO CARREGAR
// =============================
viewer.addEventListener('load', () => {
  modelLoaded = true;
  applyColor(); // aplica a cor se já houver selecionada
});

// Inicializa
loadProduct();
loadColors();
