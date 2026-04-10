/**
 * ========================================
 * PRODUCT DETAILS - COM SELETORES 3D
 * ========================================
 * Inclui seletores de material e cor no modal 3D
 */

const API_BASE = '';

// ==========================================
// ESTADO GLOBAL
// ==========================================
const State = {
  currentProduct: null,
  currentSlideIndex: 0,
  productImages: [],
  autoRotateEnabled: true,
  // Novo estado para customização 3D
  options: null,
  selectedMaterial: null,
  selectedColor: null,
  availableColors: []
};

// ==========================================
// INICIALIZAÇÃO
// ==========================================
class ProductDetailsApp {
  constructor() {
    this.init();
  }

  init() {
    document.addEventListener('DOMContentLoaded', async () => {
      // Carregar options.json primeiro
      await this.loadOptions();
      
      const productId = this.getProductIdFromUrl();
      
      if (!productId) {
        this.handleMissingProductId();
        return;
      }

      this.loadProduct(productId);
      this.loadRelatedProducts(productId);
      this.setupEventListeners();
    });
  }

  async loadOptions() {
    try {
      const response = await fetch('/data/options.json');
      State.options = await response.json();
      console.log('✓ Options carregadas:', State.options);
    } catch (error) {
      console.error('Erro ao carregar options.json:', error);
    }
  }

  getProductIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  handleMissingProductId() {
    console.error('Nenhum ID de produto encontrado na URL');
    alert('Produto não encontrado!');
    window.location.href = 'products.html';
  }

  async loadProduct(productId) {
    try {
      const response = await fetch(`${API_BASE}/products/${productId}`);
      
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: Produto não encontrado`);
      }

      State.currentProduct = await response.json();
      console.log('Produto carregado:', State.currentProduct);

      ProductRenderer.render();
      GalleryManager.setup();

    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      alert('Erro ao carregar produto. Por favor, tente novamente.');
    }
  }

  async loadRelatedProducts(currentProductId) {
  try {
    const response = await fetch(`${API_BASE}/products`);
    const allProducts = await response.json();

    const current = allProducts.find(p => p.id == currentProductId);

    if (!current) {
      console.warn('Produto atual não encontrado');
      RelatedProductsRenderer.render([]);
      return;
    }

    const otherProducts = allProducts.filter(p => p.id != currentProductId);

    const currentCategoryId = current.primary_category?.id;
    // Recolher IDs das filter tags do produto atual para comparação
    const currentTagIds = new Set((current.filter_tags || []).map(ft => ft.tag_id));
    const currentNameWords = (current.name || '')
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 2);

    const scoredProducts = otherProducts.map(product => {
      let score = 0;

      // Categoria principal em comum — peso maior
      if (product.primary_category?.id && product.primary_category.id === currentCategoryId) {
        score += 3;
      }

      // Filter tags em comum — 1 ponto por cada tag partilhada
      const productTagIds = (product.filter_tags || []).map(ft => ft.tag_id);
      const sharedTags = productTagIds.filter(id => currentTagIds.has(id));
      score += sharedTags.length;

      // Nome parecido
      const productName = (product.name || '').toLowerCase();
      if (currentNameWords.some(word => productName.includes(word))) score += 1;

      // Pequeno random para variar
      score += Math.random() * 0.5;

      return { product, score };
    });

    // ordenar por score
    scoredProducts.sort((a, b) => b.score - a.score);

    const relatedProducts = scoredProducts
      .slice(0, 12)
      .map(item => item.product);

    RelatedProductsRenderer.render(relatedProducts);

  } catch (error) {
    console.error('Erro ao carregar produtos relacionados:', error);
    RelatedProductsRenderer.renderError();
  }
}


  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  setupEventListeners() {
    SliderControls.setup();
    QuantityControls.setup();
    CartButton.setup();
    Modal3D.setup();
    KeyboardControls.setup();
    TouchControls.setup();
  }
}

// ==========================================
// RENDERIZAÇÃO DO PRODUTO
// ==========================================
class ProductRenderer {
  static render() {
    if (!State.currentProduct) {
      console.error('Nenhum produto para renderizar');
      return;
    }

    this.renderBreadcrumb();
    this.renderBasicInfo();
    this.renderTags();
    this.renderStock();
    this.renderSpecifications();
    this.render3DModel();
    this.updatePageTitle();
  }

  static renderBreadcrumb() {
    const breadcrumb = document.getElementById('breadcrumbProduct');
    if (breadcrumb) {
      breadcrumb.textContent = State.currentProduct.name;
    }
  }

  static renderBasicInfo() {
    const nameEl  = document.getElementById('productName');
    const descEl  = document.getElementById('productDescription');
    const product = State.currentProduct;

    if (nameEl) nameEl.textContent = product.name;
    if (descEl) descEl.innerHTML = product.description || 'Sem descrição disponível';

    // Secção de preço — suporte a promoção
    const priceSectionEl = document.querySelector('.product-price-section');
    if (priceSectionEl) {
      const discounted = product.is_on_promotion && product.discount_percent
        ? (product.price_discounted
            ? Number(product.price_discounted)
            : +(Number(product.price) * (1 - product.discount_percent / 100)).toFixed(2))
        : null;

      if (discounted) {
        priceSectionEl.innerHTML = `
          <div class="price-main price-promo-block">
            <div class="price-original-row">
              <span class="currency" style="text-decoration:line-through;color:#9ca3af;">€</span>
              <span class="price-value price-value--old" style="text-decoration:line-through;color:#9ca3af;">
                ${Number(product.price).toFixed(2)}
              </span>
              <span class="promo-percent-badge">-${product.discount_percent}%</span>
            </div>
            <div class="price-discounted-row">
              <span class="currency" style="color:#dc2626;">€</span>
              <span class="price-value" id="productPrice" style="color:#dc2626;">
                ${discounted.toFixed(2)}
              </span>
            </div>
          </div>
          <p class="price-note">IVA incluído</p>`;
      } else {
        priceSectionEl.innerHTML = `
          <div class="price-main">
            <span class="currency">€</span>
            <span class="price-value" id="productPrice">${Number(product.price).toFixed(2)}</span>
          </div>
          <p class="price-note">IVA incluído</p>`;
      }
    }
  }

  static renderTags() {
    const tagsContainer = document.getElementById('productTags');
    if (!tagsContainer) return;

    tagsContainer.innerHTML = '';
    const product = State.currentProduct;

    // Injetar estilos de promoção (uma só vez)
    if (!document.getElementById('promo-detail-styles')) {
      const s = document.createElement('style');
      s.id = 'promo-detail-styles';
      s.textContent = `
        .product-tag.promo {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 4px 12px;
          background: #dc2626; color: #fff;
          border: 2px solid #dc2626;
          font-size: 12px; font-weight: bold;
          letter-spacing: 0.5px;
        }
        .promo-percent-badge {
          display: inline-block;
          padding: 2px 8px;
          background: #dc2626; color: #fff;
          font-size: 13px; font-weight: bold;
          margin-left: 8px;
          vertical-align: middle;
        }
        .price-promo-block { flex-direction: column; gap: 2px; }
        .price-original-row { display: flex; align-items: center; gap: 2px; }
        .price-discounted-row { display: flex; align-items: center; gap: 2px; }
        /* Cards relacionados e homepage */
        .homepage-promo-badge {
          position: absolute; top: 8px; left: 8px;
          background: #dc2626; color: #fff;
          font-size: 10px; font-weight: bold;
          padding: 3px 8px; letter-spacing: 0.3px;
          pointer-events: none; z-index: 2;
        }
        .homepage-product-image { position: relative; }
        .homepage-price-group { display: flex; flex-direction: column; gap: 1px; }
        .homepage-price-old {
          text-decoration: line-through;
          color: #9ca3af !important; font-size: 12px !important;
        }
        .homepage-price-new { color: #dc2626 !important; font-weight: bold; }
      `;
      document.head.appendChild(s);
    }

    // Tag de promoção (primeiro)
    if (product.is_on_promotion && product.discount_percent) {
      const promoTag = document.createElement('span');
      promoTag.className = 'product-tag promo';
      promoTag.textContent = `🏷️ ${product.promotion_label || 'PROMOÇÃO'} — -${product.discount_percent}%`;
      tagsContainer.appendChild(promoTag);
    }

    // Categoria principal
    if (product.primary_category) {
      const tag = document.createElement('span');
      tag.className = 'product-tag primary';
      tag.textContent = product.primary_category.name;
      tagsContainer.appendChild(tag);
    }

    // Filter tags (novo sistema) — agrupadas por filtro
    const filterTags = product.filter_tags || [];
    filterTags.forEach(ft => {
      const tag = document.createElement('span');
      tag.className = 'product-tag filter';
      tag.title = ft.filter_name;
      tag.textContent = ft.tag_name;
      tagsContainer.appendChild(tag);
    });
  }

  static renderStock() {
    const inStock = !!State.currentProduct.stock;
    const stockEl = document.getElementById('productStock');
    const addBtn = document.getElementById('addToCartBtn');

    if (stockEl) {
      stockEl.textContent = inStock ? 'Disponível' : 'Esgotado';
      stockEl.style.color = inStock ? 'green' : 'red';
      stockEl.classList.toggle('out-of-stock', !inStock);
    }

    if (addBtn) {
      addBtn.disabled = !inStock;
    }
  }

  static renderSpecifications() {
    const specCategory = document.getElementById('specCategory');
    const specStock    = document.getElementById('specStock');

    if (specCategory) {
      const primary = State.currentProduct.primary_category;
      specCategory.textContent = primary ? primary.name : 'Geral';
    }

    if (specStock) {
      const inStock = !!State.currentProduct.stock;
      specStock.textContent  = inStock ? 'Disponível' : 'Esgotado';
      specStock.style.color  = inStock ? 'green' : 'red';
    }

    // Renderizar especificações dinâmicas a partir dos filter_tags
    const specsContainer = document.getElementById('specsDynamic');
    if (specsContainer) {
      const filterTags = State.currentProduct.filter_tags || [];
      if (!filterTags.length) {
        specsContainer.innerHTML = '';
        return;
      }

      // Agrupar por filtro
      const grouped = {};
      filterTags.forEach(ft => {
        const key = String(ft.filter_id);
        if (!grouped[key]) grouped[key] = { name: ft.filter_name, tags: [] };
        grouped[key].tags.push(ft.tag_name);
      });

      specsContainer.innerHTML = Object.values(grouped).map(g => `
        <div class="spec-row">
          <span class="spec-label">${g.name}:</span>
          <span class="spec-value">${g.tags.join(', ')}</span>
        </div>
      `).join('');
    }
  }

  static render3DModel() {
    const open3DBtn = document.getElementById('open3DBtn');
    const modelFile = State.currentProduct.model_file;

    if (!modelFile) {
      if (open3DBtn) open3DBtn.style.display = 'none';
      return;
    }

    const modelViewer = document.getElementById('model3D');
    if (modelViewer) {
      modelViewer.src = `${API_BASE}/models/${modelFile}`;
      this.setupModelColor(modelViewer);
    }

    const modalTitle = document.getElementById('modal3DTitle');
    if (modalTitle) {
      modalTitle.textContent = `Modelo 3D: ${State.currentProduct.name}`;
    }
  }

  static setupModelColor(modelViewer) {
    modelViewer.addEventListener('load', () => {
      console.log('✓ Modelo 3D carregado');
      
      // Aplicar cor padrão (cinza escuro)
      MaterialColorManager.applyColor('#555555');
    });
  }

  static updatePageTitle() {
    document.title = `${State.currentProduct.name} - XYZ Labs`;
  }
}

// ==========================================
// GESTOR DE MATERIAL E COR (NOVO)
// ==========================================
class MaterialColorManager {
  static applyMaterial(materialId) {
    if (!State.options) return;

    const material = State.options.materials.find(m => m.id === materialId);
    if (!material) return;

    State.selectedMaterial = material;
    console.log('✓ Material selecionado:', material.name);

    // Atualizar cores disponíveis
    this.updateAvailableColors(materialId);
    
    // Renderizar seletor de cores
    this.renderColorSelector();
    
    // Aplicar primeira cor disponível
    if (State.availableColors.length > 0) {
      this.applyColor(State.availableColors[0].code);
      State.selectedColor = State.availableColors[0];
    }
  }

  static updateAvailableColors(materialId) {
    if (!State.options) return;

    State.availableColors = State.options.colors.filter(
      color => color.material === materialId
    );
    
    console.log(`✓ ${State.availableColors.length} cores disponíveis para ${materialId}`);
  }

  static applyColor(colorCode) {
    const modelViewer = document.getElementById('model3D');
    if (!modelViewer || !modelViewer.model) return;

    const materials = modelViewer.model.materials;
    
    if (!materials || materials.length === 0) {
      console.warn('⚠️ Nenhum material 3D encontrado');
      return;
    }

    materials.forEach((material) => {
      material.pbrMetallicRoughness.setBaseColorFactor(colorCode);
      material.pbrMetallicRoughness.setRoughnessFactor(0.75);
      material.pbrMetallicRoughness.setMetallicFactor(0.15);
    });

    console.log(`✓ Cor aplicada: ${colorCode}`);
  }

  static renderMaterialSelector() {
    const container = document.getElementById('materialSelector');
    if (!container || !State.options) return;

    container.innerHTML = '';

    State.options.materials.forEach(material => {
      const button = document.createElement('button');
      button.className = 'material-btn';
      button.dataset.materialId = material.id;
      button.innerHTML = `
        <span class="material-name">${material.name}</span>
        ${material.badge ? `<span class="material-badge">${material.badge}</span>` : ''}
      `;

      button.addEventListener('click', () => {
        // Remover active de todos
        container.querySelectorAll('.material-btn').forEach(btn => 
          btn.classList.remove('active')
        );
        
        // Adicionar active ao clicado
        button.classList.add('active');
        
        // Aplicar material
        this.applyMaterial(material.id);
      });

      container.appendChild(button);
    });

    // Selecionar primeiro material por padrão
    if (State.options.materials.length > 0) {
      const firstBtn = container.querySelector('.material-btn');
      if (firstBtn) {
        firstBtn.classList.add('active');
        this.applyMaterial(State.options.materials[0].id);
      }
    }
  }

  static renderColorSelector() {
    const container = document.getElementById('colorSelector');
    if (!container) return;

    container.innerHTML = '';

    State.availableColors.forEach(color => {
      const button = document.createElement('button');
      button.className = 'color-btn';
      button.dataset.colorCode = color.code;
      button.style.backgroundColor = color.code;
      button.title = color.name;

      // Adicionar borda para cores claras
      if (this.isLightColor(color.code)) {
        button.style.border = '2px solid #000';
      }

      button.addEventListener('click', () => {
        // Remover active de todos
        container.querySelectorAll('.color-btn').forEach(btn => 
          btn.classList.remove('active')
        );
        
        // Adicionar active ao clicado
        button.classList.add('active');
        
        // Aplicar cor
        this.applyColor(color.code);
        State.selectedColor = color;
        
        // Atualizar label
        const colorLabel = document.getElementById('selectedColorLabel');
        if (colorLabel) {
          colorLabel.textContent = color.name;
        }
      });

      container.appendChild(button);
    });

    // Selecionar primeira cor por padrão
    if (State.availableColors.length > 0) {
      const firstBtn = container.querySelector('.color-btn');
      if (firstBtn) {
        firstBtn.classList.add('active');
      }
      
      const colorLabel = document.getElementById('selectedColorLabel');
      if (colorLabel) {
        colorLabel.textContent = State.availableColors[0].name;
      }
    }
  }

  static isLightColor(hexColor) {
    // Converter hex para RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calcular luminosidade
    const luminosity = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminosity > 0.8;
  }
}

// ==========================================
// GESTÃO DA GALERIA
// ==========================================
class GalleryManager {
  static setup() {
    State.productImages = State.currentProduct.images || [];

    if (State.productImages.length === 0) {
      State.productImages = ['placeholder.jpg'];
    }

    this.updateMainImage();
    this.renderThumbnails();
    this.renderIndicators();
  }

  static updateMainImage() {
    const mainImage = document.getElementById('mainImage');
    if (!mainImage) return;

    const imageUrl = this.getImageUrl(State.productImages[State.currentSlideIndex]);
    
    mainImage.src = imageUrl;
    mainImage.alt = State.currentProduct ? State.currentProduct.name : 'Produto';

    this.updateIndicators();
  }

  static getImageUrl(image) {
    if (image === 'placeholder.jpg') {
      return '/lib/images/placeholder.jpg';
    }
    if (image && image.startsWith('http')) {
      return image;
    }
    if (image) {
      return `${API_BASE}/images/${image}`;
    }
    return '/lib/images/placeholder.jpg';
  }

  static renderThumbnails() {
    const container = document.getElementById('thumbnails');
    if (!container) return;

    container.innerHTML = '';

    State.productImages.forEach((image, index) => {
      const thumbnail = this.createThumbnail(image, index);
      container.appendChild(thumbnail);
    });

    const emptySlots = Math.max(0, 4 - State.productImages.length);
    for (let i = 0; i < emptySlots; i++) {
      container.appendChild(this.createEmptyThumbnail());
    }
  }

  static createThumbnail(image, index) {
    const thumbnail = document.createElement('div');
    thumbnail.className = 'thumbnail';
    
    if (index === State.currentSlideIndex) {
      thumbnail.classList.add('active');
    }

    const img = document.createElement('img');
    img.src = this.getImageUrl(image);
    img.alt = `${State.currentProduct.name} - Imagem ${index + 1}`;
    img.loading = 'lazy';
    img.onerror = () => img.src = '/lib/images/placeholder.jpg';

    thumbnail.appendChild(img);
    thumbnail.addEventListener('click', () => {
      State.currentSlideIndex = index;
      this.updateMainImage();
      this.updateThumbnails();
    });

    return thumbnail;
  }

  static createEmptyThumbnail() {
    const emptyThumb = document.createElement('div');
    emptyThumb.className = 'thumbnail empty';
    emptyThumb.textContent = '📦';
    return emptyThumb;
  }

  static updateThumbnails() {
    const thumbnails = document.querySelectorAll('.thumbnail:not(.empty)');
    thumbnails.forEach((thumb, index) => {
      thumb.classList.toggle('active', index === State.currentSlideIndex);
    });
  }

  static renderIndicators() {
    const container = document.getElementById('sliderIndicators');
    if (!container) return;

    container.innerHTML = '';

    if (State.productImages.length <= 1) {
      container.style.display = 'none';
      return;
    }

    container.style.display = 'flex';

    State.productImages.forEach((_, index) => {
      const indicator = this.createIndicator(index);
      container.appendChild(indicator);
    });
  }

  static createIndicator(index) {
    const indicator = document.createElement('div');
    indicator.className = 'indicator';
    
    if (index === State.currentSlideIndex) {
      indicator.classList.add('active');
    }

    indicator.addEventListener('click', () => {
      State.currentSlideIndex = index;
      this.updateMainImage();
      this.updateThumbnails();
    });

    return indicator;
  }

  static updateIndicators() {
    const indicators = document.querySelectorAll('.indicator');
    indicators.forEach((indicator, index) => {
      indicator.classList.toggle('active', index === State.currentSlideIndex);
    });
  }

  static nextSlide() {
    State.currentSlideIndex = (State.currentSlideIndex + 1) % State.productImages.length;
    this.updateMainImage();
    this.updateThumbnails();
  }

  static prevSlide() {
    State.currentSlideIndex = (State.currentSlideIndex - 1 + State.productImages.length) % State.productImages.length;
    this.updateMainImage();
    this.updateThumbnails();
  }
}

// ==========================================
// CONTROLES DO SLIDER
// ==========================================
class SliderControls {
  static setup() {
    const prevBtn = document.getElementById('prevSlide');
    const nextBtn = document.getElementById('nextSlide');

    if (prevBtn) {
      prevBtn.addEventListener('click', () => GalleryManager.prevSlide());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => GalleryManager.nextSlide());
    }
  }
}

// ==========================================
// CONTROLES DE TECLADO
// ==========================================
class KeyboardControls {
  static setup() {
    document.addEventListener('keydown', (e) => {
      const modal = document.getElementById('modal3D');
      const isModalOpen = modal && !modal.classList.contains('hidden');
      
      if (!isModalOpen) {
        if (e.key === 'ArrowLeft') GalleryManager.prevSlide();
        if (e.key === 'ArrowRight') GalleryManager.nextSlide();
      }
      
      if (e.key === 'Escape' && isModalOpen) {
        Modal3D.close();
      }
    });
  }
}

// ==========================================
// CONTROLES TOUCH (MOBILE)
// ==========================================
class TouchControls {
  static setup() {
    let touchStartX = 0;
    let touchEndX = 0;

    const mainImage = document.getElementById('mainImage');
    if (!mainImage) return;

    mainImage.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    });

    mainImage.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
    });
  }

  static handleSwipe(startX, endX) {
    const swipeThreshold = 50;
    
    if (endX < startX - swipeThreshold) {
      GalleryManager.nextSlide();
    }
    if (endX > startX + swipeThreshold) {
      GalleryManager.prevSlide();
    }
  }
}

// ==========================================
// CONTROLES DE QUANTIDADE
// ==========================================
class QuantityControls {
  static setup() {
    const qtyPlus = document.getElementById('qtyPlus');
    const qtyMinus = document.getElementById('qtyMinus');
    const qtyInput = document.getElementById('quantity');

    if (qtyPlus) {
      qtyPlus.addEventListener('click', () => {
        if (!State.currentProduct || !State.currentProduct.stock) return;
        this.increment(qtyInput);
      });
    }

    if (qtyMinus) {
      qtyMinus.addEventListener('click', () => {
        this.decrement(qtyInput);
      });
    }
  }

  static increment(input) {
    const currentQty = parseInt(input.value);
    if (currentQty < 99) {
      input.value = currentQty + 1;
    }
  }

  static decrement(input) {
    const currentQty = parseInt(input.value);
    if (currentQty > 1) {
      input.value = currentQty - 1;
    }
  }
}

// ==========================================
// BOTÃO ADICIONAR AO CARRINHO
// ==========================================
class CartButton {
  static setup() {
    const addCartBtn = document.getElementById('addToCartBtn');
    if (!addCartBtn) return;

    addCartBtn.addEventListener('click', () => this.handleAddToCart());
  }

  static handleAddToCart() {
    if (!State.currentProduct) return;

    if (!State.currentProduct.stock) {
      alert('Produto esgotado!');
      return;
    }

    const qtyInput = document.getElementById('quantity');
    const quantity = parseInt(qtyInput.value);

    if (typeof cart === 'undefined') {
      alert('Erro ao adicionar ao carrinho. Por favor, recarregue a página.');
      return;
    }

    cart.addItem(State.currentProduct, quantity);
    this.showSuccessFeedback();
    qtyInput.value = 1;
  }

  static showSuccessFeedback() {
    const btn = document.getElementById('addToCartBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Adicionado!
    `;
    btn.style.background = '#2e7d32';

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.style.background = '';
    }, 2000);
  }
}

// ==========================================
// MODAL 3D (ATUALIZADO)
// ==========================================
class Modal3D {
  static setup() {
    const open3DBtn = document.getElementById('open3DBtn');
    const close3DBtn = document.getElementById('close3DBtn');
    const modal3D = document.getElementById('modal3D');

    if (open3DBtn) {
      open3DBtn.addEventListener('click', () => this.open());
    }

    if (close3DBtn) {
      close3DBtn.addEventListener('click', () => this.close());
    }

    if (modal3D) {
      modal3D.addEventListener('click', (e) => {
        if (e.target.id === 'modal3D') this.close();
      });
    }

    this.setupControls();
  }

  static setupControls() {
    const resetBtn = document.getElementById('resetView');
    const toggleBtn = document.getElementById('toggleRotation');

    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetView());
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => this.toggleRotation());
    }
  }

  static open() {
    const modal = document.getElementById('modal3D');
    if (!modal) return;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    const modelViewer = document.getElementById('model3D');
    if (modelViewer && State.autoRotateEnabled) {
      modelViewer.setAttribute('auto-rotate', '');
    }

    // Renderizar seletores
    MaterialColorManager.renderMaterialSelector();
  }

  static close() {
    const modal = document.getElementById('modal3D');
    if (!modal) return;

    modal.classList.add('hidden');
    document.body.style.overflow = '';
  }

  static resetView() {
    const modelViewer = document.getElementById('model3D');
    if (!modelViewer) return;

    modelViewer.cameraOrbit = '45deg 55deg 5.5m';
    modelViewer.fieldOfView = '45deg';
  }

  static toggleRotation() {
    const modelViewer = document.getElementById('model3D');
    const btn = document.getElementById('toggleRotation');
    
    if (!modelViewer || !btn) return;

    State.autoRotateEnabled = !State.autoRotateEnabled;
    
    if (State.autoRotateEnabled) {
      modelViewer.setAttribute('auto-rotate', '');
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        </svg>
        Pausar Rotação
      `;
    } else {
      modelViewer.removeAttribute('auto-rotate');
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        Retomar Rotação
      `;
    }
  }
}

// ==========================================
// PRODUTOS RELACIONADOS
// ==========================================
class RelatedProductsRenderer {
  static render(products) {
    const container = document.getElementById('relatedProducts');
    if (!container) return;

    if (!products.length) {
      container.innerHTML = '<p class="no-products">Nenhum produto relacionado disponível</p>';
      return;
    }

    container.innerHTML = products.map(product => this.createProductCard(product)).join('');
    this.addClickListeners();
  }

  static createProductCard(product) {
    const image = product.images && product.images[0]
      ? product.images[0]
      : '/lib/images/placeholder.jpg';

    const outOfStock = !product.stock
      ? '<div class="homepage-out-of-stock">Esgotado</div>'
      : '';

    // Promoção
    const promoBadge = product.is_on_promotion && product.discount_percent
      ? `<div class="homepage-promo-badge">🏷️ ${product.promotion_label || 'PROMOÇÃO'} -${product.discount_percent}%</div>`
      : '';

    const discounted = product.is_on_promotion && product.discount_percent
      ? (product.price_discounted
          ? Number(product.price_discounted)
          : +(Number(product.price) * (1 - product.discount_percent / 100)).toFixed(2))
      : null;

    const priceHTML = discounted
      ? `<span class="homepage-product-price homepage-price-old">€${Number(product.price).toFixed(2)}</span>
         <span class="homepage-product-price homepage-price-new">€${discounted.toFixed(2)}</span>`
      : `<span class="homepage-product-price">€${Number(product.price).toFixed(2)}</span>`;

    return `
      <div class="homepage-product-card" data-id="${product.id}">
        <div class="homepage-product-image">
          <img src="${image}" alt="${product.name}" loading="lazy">
          ${outOfStock}
          ${promoBadge}
        </div>
        <div class="homepage-product-info">
          <h3>${product.name}</h3>
          <div class="homepage-product-footer">
            <div class="homepage-price-group">${priceHTML}</div>
            <div class="homepage-product-actions">
              <button class="homepage-btn-view" onclick="window.location.href='product-details.html?id=${product.id}'">
                Ver Detalhes
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  static addClickListeners() {
    const cards = document.querySelectorAll('#relatedProducts .homepage-product-card');

    cards.forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.homepage-btn-view')) return;

        const productId = card.getAttribute('data-id');
        window.location.href = `product-details.html?id=${productId}`;
      });
    });
  }

  static renderError() {
    const container = document.getElementById('relatedProducts');
    if (container) {
      container.innerHTML = '<p class="error">Erro ao carregar produtos relacionados</p>';
    }
  }
}
// ==========================================
// SCROLL INFINITO - RELATED PRODUCTS
// ==========================================

class RelatedProductsScroller {
  static setup() {
    const container = document.getElementById('relatedProducts');
    const btnLeft = document.getElementById('relatedScrollLeft');
    const btnRight = document.getElementById('relatedScrollRight');

    if (!container || !btnLeft || !btnRight) return;

    // scroll por largura de card + gap
    const getScrollAmount = () => {
      const card = container.querySelector('.homepage-product-card');
      if (!card) return 260; // fallback
      const style = window.getComputedStyle(container);
      const gap = parseInt(style.gap) || 16;
      return card.offsetWidth + gap;
    };

    // eventos dos botões
    btnLeft.addEventListener('click', () => {
      container.scrollBy({ left: -getScrollAmount(), behavior: 'smooth' });
    });

    btnRight.addEventListener('click', () => {
      container.scrollBy({ left: getScrollAmount(), behavior: 'smooth' });
    });

    // opcional: scroll infinito (loop)
    container.addEventListener('scroll', () => {
      const maxScroll = container.scrollWidth - container.clientWidth;
      if (container.scrollLeft >= maxScroll - 1) {
        container.scrollLeft = 0;
      } else if (container.scrollLeft <= 0) {
        // Se quiser loopar para o final:
        // container.scrollLeft = maxScroll;
      }
    });
  }
}

// Inicializar após os produtos renderizarem
document.addEventListener('DOMContentLoaded', () => {
  RelatedProductsScroller.setup();
});


// Inicializar após os produtos renderizarem
document.addEventListener('DOMContentLoaded', () => {
  RelatedProductsScroller.setup();
});

// ==========================================
// INICIALIZAR APLICAÇÃO
// ==========================================
const app = new ProductDetailsApp();