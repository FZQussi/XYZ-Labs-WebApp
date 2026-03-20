// ============================================================
// CUSTOM SELECT DROPDOWN - BRUTALISTA (MELHORADO)
// Substitui o select nativo por um custom com estilo brutalista
// - Mostra texto completo (não trunca)
// - Opção padrão selecionada automaticamente
// ============================================================

class BrutalSelect {
  constructor(selectElement, options = {}) {
    this.select = selectElement;
    this.options = {
      maxHeight: options.maxHeight || 300,
      ...options
    };
    
    this.isOpen = false;
    this.selectedValue = null;
    this.selectedText = '';
    
    this.init();
  }

  init() {
    // Guardar dados originais do select
    this.originalOptions = Array.from(this.select.options).map(opt => ({
      value: opt.value,
      text: opt.text,
      selected: opt.selected,
      element: opt
    }));

    // Encontrar a opção selecionada (com atributo selected ou a primeira)
    const selectedOpt = this.originalOptions.find(opt => opt.selected) || this.originalOptions[0];
    
    if (selectedOpt) {
      this.selectedValue = selectedOpt.value;
      this.selectedText = selectedOpt.text;
    } else {
      this.selectedText = 'Selecione...';
    }

    // Esconder o select original
    this.select.style.display = 'none';
    this.select.classList.add('hidden-native-select');

    // Criar o container do custom select
    this.container = document.createElement('div');
    this.container.className = 'brute-select-container';
    this.select.parentNode.insertBefore(this.container, this.select);
    this.container.appendChild(this.select);

    // Criar o botão trigger
    this.trigger = document.createElement('button');
    this.trigger.className = 'brute-select-trigger';
    this.trigger.type = 'button';
    this.trigger.innerHTML = `
      <span class="brute-select-value">${this.escapeHtml(this.selectedText)}</span>
      <span class="brute-select-arrow">▼</span>
    `;
    this.container.appendChild(this.trigger);

    // Criar a lista de opções
    this.dropdown = document.createElement('div');
    this.dropdown.className = 'brute-select-dropdown';
    this.dropdown.innerHTML = `<div class="brute-select-options"></div>`;
    this.container.appendChild(this.dropdown);

    // Renderizar opções
    this.renderOptions();

    // Adicionar event listeners
    this.attachEventListeners();
  }

  renderOptions() {
    const optionsContainer = this.dropdown.querySelector('.brute-select-options');
    optionsContainer.innerHTML = '';

    this.originalOptions.forEach((opt, index) => {
      const optionEl = document.createElement('div');
      optionEl.className = 'brute-select-option';
      if (opt.value === this.selectedValue) {
        optionEl.classList.add('selected');
      }
      optionEl.dataset.value = opt.value;
      optionEl.dataset.index = index;
      optionEl.textContent = opt.text;

      optionEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.selectOption(opt.value, opt.text);
      });

      optionEl.addEventListener('mouseenter', () => {
        this.clearHover();
        optionEl.classList.add('hovered');
      });

      optionsContainer.appendChild(optionEl);
    });
  }

  selectOption(value, text) {
    this.selectedValue = value;
    this.selectedText = text;

    // Atualizar o select original
    this.select.value = value;

    // Atualizar a trigger
    this.trigger.querySelector('.brute-select-value').textContent = this.escapeHtml(text);

    // Atualizar visual das opções
    this.renderOptions();

    // Fechar dropdown
    this.close();

    // Disparar change event no select original
    const event = new Event('change', { bubbles: true });
    this.select.dispatchEvent(event);
  }

  attachEventListeners() {
    // Click no trigger
    this.trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggle();
    });

    // Click fora para fechar
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target) && !this.dropdown.contains(e.target)) {
        this.close();
      }
    });

    // Recalcular posição ao scroll ou resize
    window.addEventListener('scroll', () => {
      if (this.isOpen) {
        this.repositionDropdown();
      }
    }, { passive: true });

    window.addEventListener('resize', () => {
      if (this.isOpen) {
        this.repositionDropdown();
      }
    }, { passive: true });

    // Keyboard navigation
    this.trigger.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        e.preventDefault();
        this.open();
      }
    });

    this.dropdown.addEventListener('keydown', (e) => {
      const options = this.dropdown.querySelectorAll('.brute-select-option');
      let currentIndex = Array.from(options).findIndex(opt => opt.classList.contains('hovered'));
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        this.clearHover();
        currentIndex = Math.min(currentIndex + 1, options.length - 1);
        if (options[currentIndex]) {
          options[currentIndex].classList.add('hovered');
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        this.clearHover();
        currentIndex = Math.max(currentIndex - 1, 0);
        if (options[currentIndex]) {
          options[currentIndex].classList.add('hovered');
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (currentIndex >= 0 && options[currentIndex]) {
          const value = options[currentIndex].dataset.value;
          const text = options[currentIndex].textContent;
          this.selectOption(value, text);
        }
      } else if (e.key === 'Escape') {
        this.close();
        this.trigger.focus();
      }
    });
  }

  toggle() {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  open() {
    this.isOpen = true;
    this.container.classList.add('open');
    
    // Calcular posição do trigger
    const triggerRect = this.trigger.getBoundingClientRect();
    
    // Posicionar o dropdown logo abaixo do trigger
    this.dropdown.style.position = 'fixed';
    this.dropdown.style.left = triggerRect.left + 'px';
    this.dropdown.style.top = (triggerRect.bottom) + 'px';
    this.dropdown.style.width = triggerRect.width + 'px';
    this.dropdown.style.display = 'block';

    // Auto-scroll para a opção selecionada
    const selectedOption = this.dropdown.querySelector('.brute-select-option.selected');
    if (selectedOption) {
      setTimeout(() => {
        selectedOption.scrollIntoView({ block: 'nearest' });
        selectedOption.classList.add('hovered');
      }, 50);
    }
  }

  close() {
    this.isOpen = false;
    this.container.classList.remove('open');
    this.dropdown.style.display = 'none';
    this.clearHover();
  }

  repositionDropdown() {
    if (!this.isOpen) return;
    
    const triggerRect = this.trigger.getBoundingClientRect();
    this.dropdown.style.left = triggerRect.left + 'px';
    this.dropdown.style.top = (triggerRect.bottom) + 'px';
    this.dropdown.style.width = triggerRect.width + 'px';
  }

  clearHover() {
    this.dropdown.querySelectorAll('.brute-select-option').forEach(opt => {
      opt.classList.remove('hovered');
    });
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  destroy() {
    this.container.remove();
    this.select.style.display = 'block';
    this.select.classList.remove('hidden-native-select');
  }
}

// ============================================================
// INICIALIZAR TODOS OS CUSTOM SELECTS NA PÁGINA
// ============================================================
function initBrutalSelects() {
  // Encontrar todos os selects com a classe primary-category-select
  document.querySelectorAll('.primary-category-select').forEach(selectEl => {
    // Se ainda não foi inicializado
    if (!selectEl.classList.contains('brute-initialized')) {
      new BrutalSelect(selectEl);
      selectEl.classList.add('brute-initialized');
    }
  });
}

// Inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initBrutalSelects);
} else {
  initBrutalSelects();
}

// Também inicializar quando novos selects são adicionados dinamicamente
const observer = new MutationObserver(() => {
  initBrutalSelects();
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});

// Exportar para uso manual se necessário
window.BrutalSelect = BrutalSelect;
window.initBrutalSelects = initBrutalSelects;