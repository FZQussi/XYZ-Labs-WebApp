/**
 * ========================================
 * IMAGE ORDER MANAGER - CORRIGIDO
 * Sistema de ordenação de imagens com drag & drop
 * ========================================
 */
class ImageOrderManager {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.images = []; // Array de objetos {file: File, preview: string, order: number}
    this.options = {
      maxImages: options.maxImages || 4,
      onOrderChange: options.onOrderChange || (() => {}),
      onImageAdd: options.onImageAdd || (() => {}),
      onImageRemove: options.onImageRemove || (() => {})
    };
    
    this.draggedItem = null;
    this.init();
  }

  init() {
    if (!this.container) {
      console.error('Container não encontrado');
      return;
    }
    
    this.container.classList.add('image-order-container');
  }

  // Adicionar imagens do input file
  async addImagesFromInput(fileInput) {
    const files = Array.from(fileInput.files);
    
    if (files.length + this.images.length > this.options.maxImages) {
      alert(`Máximo de ${this.options.maxImages} imagens permitidas`);
      return false;
    }

    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        console.warn('Ficheiro não é uma imagem:', file.name);
        continue;
      }

      const preview = await this.createPreview(file);
      const order = this.images.length;
      
      this.images.push({ file, preview, order, id: Date.now() + Math.random() });
    }

    this.options.onImageAdd(this.images);
    this.render();
    return true;
  }

  // Adicionar imagens existentes (URLs) - modo edição
  addExistingImages(imageUrls) {
    this.images = imageUrls.map((url, index) => ({
      file: null,
      preview: url,
      order: index,
      id: `existing-${index}`,
      isExisting: true,
      filename: url.split('/').pop()
    }));

    this.render();
  }

  createPreview(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(file);
    });
  }

  // Renderizar imagens com drag & drop
  render() {
    this.container.innerHTML = '';

    if (this.images.length === 0) {
      this.container.innerHTML = '<p class="no-images-placeholder">Nenhuma imagem adicionada</p>';
      return;
    }

    const sortedImages = [...this.images].sort((a, b) => a.order - b.order);

    sortedImages.forEach((image, index) => {
      const item = this.createImageItem(image, index, sortedImages.length);
      this.container.appendChild(item);
    });

    this.updateOrderIndicators();
  }

  // Criar elemento HTML para uma imagem
  createImageItem(image, visualIndex, totalImages) {
    const item = document.createElement('div');
    item.className = 'image-order-item';
    item.draggable = true;
    item.dataset.imageId = image.id;
    item.dataset.order = image.order;

    item.innerHTML = `
      <div class="image-order-preview">
        <img src="${image.preview}" alt="Imagem ${visualIndex + 1}">
        <div class="image-order-badge">${visualIndex + 1}</div>
        <div class="image-primary-badge" style="display: ${visualIndex === 0 ? 'flex' : 'none'}">
          <span>★ Principal</span>
        </div>
      </div>
      <div class="image-order-controls">
        <button class="btn-order-up" title="Mover para cima" ${visualIndex === 0 ? 'disabled' : ''}>↑</button>
        <button class="btn-order-down" title="Mover para baixo" ${visualIndex === totalImages - 1 ? 'disabled' : ''}>↓</button>
        <button class="btn-remove" title="Remover imagem">×</button>
      </div>
    `;

    this.addDragListeners(item);
    this.addButtonListeners(item, image);

    return item;
  }

  addDragListeners(item) {
    item.addEventListener('dragstart', (e) => {
      this.draggedItem = item;
      item.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    item.addEventListener('dragend', () => {
      item.classList.remove('dragging');
      this.draggedItem = null;
    });

    item.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      const afterElement = this.getDragAfterElement(this.container, e.clientY);
      
      if (afterElement == null) {
        this.container.appendChild(this.draggedItem);
      } else {
        this.container.insertBefore(this.draggedItem, afterElement);
      }
    });

    item.addEventListener('drop', (e) => {
      e.preventDefault();
      this.updateOrderFromDOM();
    });
  }

  addButtonListeners(item, image) {
    const btnUp = item.querySelector('.btn-order-up');
    const btnDown = item.querySelector('.btn-order-down');
    const btnRemove = item.querySelector('.btn-remove');

    btnUp?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.moveUp(image.id);
    });

    btnDown?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.moveDown(image.id);
    });

    btnRemove?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.removeImage(image.id);
    });
  }

  getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.image-order-item:not(.dragging)')];

    return draggableElements.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  moveUp(imageId) {
    const index = this.images.findIndex(img => img.id === imageId);
    if (index <= 0) return;

    [this.images[index - 1].order, this.images[index].order] = [this.images[index].order, this.images[index - 1].order];
    this.render();
    this.options.onOrderChange(this.getOrderedImages());
  }

  moveDown(imageId) {
    const index = this.images.findIndex(img => img.id === imageId);
    if (index < 0 || index >= this.images.length - 1) return;

    [this.images[index + 1].order, this.images[index].order] = [this.images[index].order, this.images[index + 1].order];
    this.render();
    this.options.onOrderChange(this.getOrderedImages());
  }

  removeImage(imageId) {
    const index = this.images.findIndex(img => img.id === imageId);
    if (index < 0) return;

    if (!confirm('Remover esta imagem?')) return;

    const removed = this.images.splice(index, 1)[0];

    // Reajustar ordens
    this.images.forEach((img, idx) => img.order = idx);

    this.render();
    this.options.onImageRemove(removed);
  }

  updateOrderFromDOM() {
    const items = this.container.querySelectorAll('.image-order-item');
    items.forEach((item, index) => {
      const image = this.images.find(img => img.id == item.dataset.imageId);
      if (image) image.order = index;
    });

    this.render();
    this.options.onOrderChange(this.getOrderedImages());
  }

  updateOrderIndicators() {
    const items = this.container.querySelectorAll('.image-order-item');
    items.forEach((item, index) => {
      const badge = item.querySelector('.image-order-badge');
      const primaryBadge = item.querySelector('.image-primary-badge');
      if (badge) badge.textContent = index + 1;
      if (primaryBadge) primaryBadge.style.display = index === 0 ? 'flex' : 'none';

      const btnUp = item.querySelector('.btn-order-up');
      const btnDown = item.querySelector('.btn-order-down');
      if (btnUp) btnUp.disabled = index === 0;
      if (btnDown) btnDown.disabled = index === items.length - 1;
    });
  }

  getOrderedImages() {
    return [...this.images].sort((a, b) => a.order - b.order);
  }

  getOrderedFiles() {
    return this.getOrderedImages().map(img => img.file).filter(f => f !== null);
  }

  getOrderedFilenames() {
    return this.getOrderedImages().map(img => img.filename).filter(f => f);
  }

  clear() {
    this.images = [];
    this.render();
  }

  getCount() {
    return this.images.length;
  }

  canAddMore() {
    return this.images.length < this.options.maxImages;
  }
}

// Exportar para uso global
window.ImageOrderManager = ImageOrderManager;
