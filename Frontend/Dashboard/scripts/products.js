// ==== products.js ====
(() => {
  const API_BASE = 'http://localhost:3001';
  const token = localStorage.getItem('token');

  const productsList = document.getElementById('productsList');

  // filtros
  const searchInput = document.getElementById('productSearch');
  const activeFilter = document.getElementById('productFilterActive');
  const stockFilter = document.getElementById('productFilterStock');
  const priceMinInput = document.getElementById('priceMin');
  const priceMaxInput = document.getElementById('priceMax');
  const categoryFilter = document.getElementById('productFilterCategory');
  const primaryCategoryFilter = document.getElementById('productFilterPrimaryCategory');

  // Elementos de seleção múltipla (podem não existir)
  const selectAllCheckbox = document.getElementById('selectAllProducts');
  const deleteSelectedBtn = document.getElementById('deleteSelectedBtn');
  const selectionCount = document.getElementById('selectionCount');

  let allProducts = [];
  let selectedProductIds = new Set();

  // Verificar se a funcionalidade de seleção múltipla está disponível
  const hasMultiSelectFeature = !!(selectAllCheckbox && deleteSelectedBtn && selectionCount);

  function authHeaders() {
    return { Authorization: `Bearer ${token}` };
  }

  // ===== ATUALIZAR CONTADOR DE SELEÇÃO =====
  function updateSelectionUI() {
    // Só executar se os elementos existirem
    if (!hasMultiSelectFeature) return;

    const count = selectedProductIds.size;
    
    if (count > 0) {
      selectionCount.textContent = `${count} selecionado${count > 1 ? 's' : ''}`;
      deleteSelectedBtn.disabled = false;
      deleteSelectedBtn.classList.add('has-selection');
    } else {
      selectionCount.textContent = '';
      deleteSelectedBtn.disabled = true;
      deleteSelectedBtn.classList.remove('has-selection');
    }

    // Atualizar estado do "selecionar todos"
    const visibleProducts = Array.from(productsList.querySelectorAll('.product-item'));
    const visibleProductIds = visibleProducts.map(row => parseInt(row.dataset.productId));
    const allVisibleSelected = visibleProductIds.length > 0 && 
                                visibleProductIds.every(id => selectedProductIds.has(id));
    
    selectAllCheckbox.checked = allVisibleSelected;
    selectAllCheckbox.indeterminate = !allVisibleSelected && 
                                      visibleProductIds.some(id => selectedProductIds.has(id));
  }

  // ===== TOGGLE SELEÇÃO DE PRODUTO =====
  function toggleProductSelection(productId, checkbox) {
    if (checkbox.checked) {
      selectedProductIds.add(productId);
    } else {
      selectedProductIds.delete(productId);
    }
    updateSelectionUI();
  }

  // ===== SELECIONAR/DESSELECIONAR TODOS =====
  function toggleSelectAll(checked) {
    const visibleProducts = Array.from(productsList.querySelectorAll('.product-item'));
    
    visibleProducts.forEach(row => {
      const productId = parseInt(row.dataset.productId);
      const checkbox = row.querySelector('.product-select-checkbox');
      
      if (checkbox) {
        checkbox.checked = checked;
        if (checked) {
          selectedProductIds.add(productId);
        } else {
          selectedProductIds.delete(productId);
        }
      }
    });
    
    updateSelectionUI();
  }

  // ===== ELIMINAR PRODUTOS SELECIONADOS =====
  async function deleteSelectedProducts() {
    if (selectedProductIds.size === 0) return;

    const count = selectedProductIds.size;
    const confirmed = confirm(
      `Tem a certeza que deseja eliminar ${count} produto${count > 1 ? 's' : ''}?\n\n` +
      `Esta ação não pode ser revertida.`
    );

    if (!confirmed) return;

    const productsToDelete = Array.from(selectedProductIds);
    let successCount = 0;
    let errorCount = 0;

    // Mostrar loading
    deleteSelectedBtn.disabled = true;
    deleteSelectedBtn.textContent = '⏳ A eliminar...';

    for (const productId of productsToDelete) {
      try {
        const res = await fetch(`${API_BASE}/products/${productId}`, {
          method: 'DELETE',
          headers: authHeaders()
        });

        if (res.ok) {
          successCount++;
          selectedProductIds.delete(productId);
        } else {
          errorCount++;
        }
      } catch (err) {
        console.error(`Erro ao eliminar produto ${productId}:`, err);
        errorCount++;
      }
    }

    // Restaurar botão
    deleteSelectedBtn.textContent = '🗑️ Eliminar Selecionados';

    // Mostrar resultado
    if (errorCount === 0) {
      alert(`✅ ${successCount} produto${successCount > 1 ? 's eliminados' : ' eliminado'} com sucesso!`);
    } else {
      alert(
        `⚠️ Eliminados: ${successCount}\n` +
        `Erros: ${errorCount}\n\n` +
        `Alguns produtos não puderam ser eliminados.`
      );
    }

    // Recarregar lista
    await loadProducts();
    updateSelectionUI();
  }

  // ===== RENDER =====
  function renderProducts(products) {
    productsList.innerHTML = '';

    if (!products.length) {
      productsList.innerHTML = '<div style="padding:10px">Sem produtos.</div>';
      if (hasMultiSelectFeature) updateSelectionUI();
      return;
    }

    products.forEach(p => {
      const row = document.createElement('div');
      row.className = 'product-item';
      row.dataset.productId = p.id;

      const categories = (p.categories || [])
        .map(c => c.name)
        .join(', ');

      const isSelected = selectedProductIds.has(p.id);

      // Renderizar com ou sem checkbox dependendo se a funcionalidade existe
      if (hasMultiSelectFeature) {
        row.innerHTML = `
          <div class="product-select">
            <input 
              type="checkbox" 
              class="product-select-checkbox" 
              data-product-id="${p.id}"
              ${isSelected ? 'checked' : ''}
            >
          </div>
          <span class="product-name">${p.name}</span>
          <span>€${Number(p.price).toFixed(2)}</span>
          <span class="${p.stock ? 'in-stock' : 'out-stock'}">
            ${p.stock ? 'Disponível' : 'Indisponível'}
          </span>
          <span>${categories || '—'}</span>
          <span class="status ${p.is_active ? 'active' : 'inactive'}">
            ${p.is_active ? 'Ativo' : 'Inativo'}
          </span>
          <div class="actions">
            <button class="secondary-btn view-btn">Detalhes</button>
            <button class="primary-btn edit-btn">Editar</button>
          </div>
        `;

        // Event listener para checkbox
        const checkbox = row.querySelector('.product-select-checkbox');
        checkbox.addEventListener('change', (e) => {
          e.stopPropagation();
          toggleProductSelection(p.id, checkbox);
        });
      } else {
        // Versão sem checkbox (compatibilidade com HTML antigo)
        row.innerHTML = `
          <span class="product-name">${p.name}</span>
          <span>€${Number(p.price).toFixed(2)}</span>
          <span class="${p.stock ? 'in-stock' : 'out-stock'}">
            ${p.stock ? 'Disponível' : 'Indisponível'}
          </span>
          <span>${categories || '—'}</span>
          <span class="status ${p.is_active ? 'active' : 'inactive'}">
            ${p.is_active ? 'Ativo' : 'Inativo'}
          </span>
          <div class="actions">
            <button class="secondary-btn view-btn">Detalhes</button>
            <button class="primary-btn edit-btn">Editar</button>
          </div>
        `;
      }

      row.querySelector('.view-btn').addEventListener('click', () => {
        document.dispatchEvent(
          new CustomEvent('openViewProductModal', { detail: p })
        );
      });

      row.querySelector('.edit-btn').addEventListener('click', () => {
        document.dispatchEvent(
          new CustomEvent('openEditProductModal', { detail: p })
        );
      });

      productsList.appendChild(row);
    });

    if (hasMultiSelectFeature) updateSelectionUI();
  }

  // ===== APPLY FILTERS =====
  function applyFilters() {
    let filtered = [...allProducts];

    const search = searchInput.value.toLowerCase();
    const active = activeFilter.value;
    const stock = stockFilter.value;
    const priceMin = Number(priceMinInput.value);
    const priceMax = Number(priceMaxInput.value);
    const category = categoryFilter.value.toLowerCase();
    const primaryCategory = primaryCategoryFilter.value.toLowerCase();

    filtered = filtered.filter(p => {

      if (search && !p.name.toLowerCase().includes(search)) return false;

      if (active !== '' && String(p.is_active) !== active) return false;

      if (stock !== '' && String(p.stock) !== stock) return false;

      if (priceMin && Number(p.price) < priceMin) return false;

      if (priceMax && Number(p.price) > priceMax) return false;

      if (category) {
        const hasCategory = (p.categories || []).some(c =>
          c.name.toLowerCase().includes(category)
        );
        if (!hasCategory) return false;
      }

      if (primaryCategory) {
        const hasPrimary = (p.categories || []).some(c =>
          c.is_primary &&
          c.name.toLowerCase().includes(primaryCategory)
        );
        if (!hasPrimary) return false;
      }

      return true;
    });

    renderProducts(filtered);
  }

  // ===== LOAD PRODUCTS =====
  async function loadProducts() {
    productsList.innerHTML = '<div style="padding:10px">A carregar...</div>';

    try {
      const res = await fetch(`${API_BASE}/products`, {
        headers: authHeaders()
      });

      if (!res.ok) throw new Error();

      allProducts = await res.json();

      console.log('Produtos recebidos:', allProducts);

      applyFilters();

    } catch (err) {
      console.error(err);
      productsList.innerHTML =
        '<div style="padding:10px;color:red">Erro ao carregar produtos.</div>';
    }
  }

  // ===== EVENTS =====
  [
    searchInput,
    activeFilter,
    stockFilter,
    priceMinInput,
    priceMaxInput,
    categoryFilter,
    primaryCategoryFilter
  ].forEach(el => {
    if (el) el.addEventListener('input', applyFilters);
  });

  // Event listener para "selecionar todos" (só se existir)
  if (selectAllCheckbox) {
    selectAllCheckbox.addEventListener('change', (e) => {
      toggleSelectAll(e.target.checked);
    });
  }

  // Event listener para "eliminar selecionados" (só se existir)
  if (deleteSelectedBtn) {
    deleteSelectedBtn.addEventListener('click', deleteSelectedProducts);
  }

  document.addEventListener('DOMContentLoaded', loadProducts);

  window.reloadProducts = loadProducts;

  // Log para debug
  if (hasMultiSelectFeature) {
    console.log('✅ Funcionalidade de seleção múltipla ATIVADA');
  } else {
    console.log('ℹ️ Funcionalidade de seleção múltipla DESATIVADA (elementos não encontrados)');
  }
})();