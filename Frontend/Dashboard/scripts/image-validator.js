/**
 * ========================================
 * IMAGE VALIDATOR - Validação de imagens
 * Com preview, tamanho e notificações
 * ========================================
 */

const ImageValidator = {
  // Configurações
  config: {
    maxFileSize: 5 * 1024 * 1024, // 5MB por imagem
    maxTotalSize: 50 * 1024 * 1024, // 50MB total
    allowedFormats: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  },

  /**
   * Converter bytes para formato legível
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Validar um ficheiro de imagem
   * Retorna: { valid: boolean, error: string|null, size: number, formatted: string }
   */
  validateFile(file) {
    // Verificar tipo
    if (!this.config.allowedFormats.includes(file.type)) {
      return {
        valid: false,
        error: `❌ Formato não permitido. Use JPEG, PNG, WebP ou GIF.`,
        size: file.size,
        formatted: this.formatBytes(file.size)
      };
    }

    // Verificar tamanho
    if (file.size > this.config.maxFileSize) {
      return {
        valid: false,
        error: `❌ Imagem muito grande (${this.formatBytes(file.size)}). Máximo: ${this.formatBytes(this.config.maxFileSize)}`,
        size: file.size,
        formatted: this.formatBytes(file.size)
      };
    }

    return {
      valid: true,
      error: null,
      size: file.size,
      formatted: this.formatBytes(file.size)
    };
  },

  /**
   * Validar múltiplos ficheiros
   */
  validateFiles(files) {
    const results = [];
    let totalSize = 0;

    for (const file of files) {
      const validation = this.validateFile(file);
      results.push({ file, ...validation });
      if (validation.valid) {
        totalSize += file.size;
      }
    }

    // Verificar tamanho total
    if (totalSize > this.config.maxTotalSize) {
      return {
        valid: false,
        error: `❌ Tamanho total muito grande (${this.formatBytes(totalSize)}). Máximo: ${this.formatBytes(this.config.maxTotalSize)}`,
        results,
        totalSize,
        totalFormatted: this.formatBytes(totalSize)
      };
    }

    return {
      valid: results.every(r => r.valid),
      error: null,
      results,
      totalSize,
      totalFormatted: this.formatBytes(totalSize),
      validFiles: results.filter(r => r.valid).map(r => r.file)
    };
  },

  /**
   * Criar elemento de notificação de imagem
   */
  createImageNotification(file, validation) {
    const container = document.createElement('div');
    container.className = `image-notification ${validation.valid ? 'success' : 'error'}`;
    
    const statusIcon = validation.valid ? '✅' : '❌';
    const statusText = validation.valid ? 'OK' : 'Rejeitada';
    
    container.innerHTML = `
      <div class="image-notification-content">
        <div class="image-notification-header">
          <span class="image-notification-status">${statusIcon} ${statusText}</span>
          <span class="image-notification-name">${file.name}</span>
        </div>
        <div class="image-notification-details">
          <span class="image-notification-size">${validation.formatted}</span>
          ${!validation.valid ? `<span class="image-notification-error">${validation.error}</span>` : ''}
        </div>
      </div>
    `;

    return container;
  },

  /**
   * Mostrar notificações de validação
   */
  showNotifications(containerId, validation) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';
    container.style.display = 'block';

    // Mostrar resultado geral se houver erro
    if (!validation.valid && validation.error) {
      const generalError = document.createElement('div');
      generalError.className = 'image-validation-error';
      generalError.innerHTML = `<strong>${validation.error}</strong>`;
      container.appendChild(generalError);
    }

    // Mostrar notificações individuais se forem múltiplos ficheiros
    if (validation.results && validation.results.length > 0) {
      validation.results.forEach(result => {
        const notification = this.createImageNotification(result.file, result);
        container.appendChild(notification);
      });
    }

    // Mostrar resumo
    if (validation.totalFormatted) {
      const summary = document.createElement('div');
      summary.className = 'image-validation-summary';
      const validCount = validation.results ? validation.results.filter(r => r.valid).length : 0;
      summary.innerHTML = `
        <strong>Resumo:</strong> ${validCount} imagem(ns) válida(s) • ${validation.totalFormatted}
      `;
      container.appendChild(summary);
    }
  },

  /**
   * Criar preview de imagem com validação
   */
  async createPreviewWithValidation(file) {
    const validation = this.validateFile(file);

    return new Promise((resolve) => {
      if (!validation.valid) {
        resolve({
          file,
          validation,
          preview: null
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({
          file,
          validation,
          preview: e.target.result
        });
      };
      reader.onerror = () => {
        resolve({
          file,
          validation: { ...validation, valid: false, error: '❌ Erro ao ler ficheiro' },
          preview: null
        });
      };
      reader.readAsDataURL(file);
    });
  }
};

// Exportar para uso global
window.ImageValidator = ImageValidator;

// ===== CSS =====
const style = document.createElement('style');
style.textContent = `
/* Notificações de validação */
.image-notification {
  padding: 12px;
  margin: 8px 0;
  border-radius: 6px;
  border-left: 4px solid;
  background: #f5f5f5;
  font-size: 14px;
}

.image-notification.success {
  border-left-color: #4caf50;
  background: #f1f8f4;
}

.image-notification.error {
  border-left-color: #f44336;
  background: #fef1f0;
}

.image-notification-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.image-notification-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.image-notification-status {
  min-width: 50px;
  font-weight: bold;
}

.image-notification-name {
  flex: 1;
  word-break: break-word;
  color: #333;
}

.image-notification-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #666;
}

.image-notification-size {
  background: rgba(0,0,0,0.05);
  padding: 2px 8px;
  border-radius: 3px;
  font-family: monospace;
}

.image-notification-error {
  color: #f44336;
  font-weight: 500;
}

/* Erro de validação geral */
.image-validation-error {
  padding: 12px;
  margin-bottom: 12px;
  border-radius: 6px;
  background: #ffebee;
  border: 1px solid #f44336;
  color: #c62828;
  font-weight: 600;
}

/* Resumo de validação */
.image-validation-summary {
  padding: 10px;
  margin-top: 8px;
  border-radius: 6px;
  background: #e8f5e9;
  border-left: 4px solid #4caf50;
  font-size: 13px;
  color: #2e7d32;
}

/* Container de notificações */
#imageValidationContainer {
  margin: 12px 0;
}

#imageValidationContainer:empty {
  display: none;
}

/* Preview de imagens (para integração) */
.image-preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.image-preview-item {
  position: relative;
  border-radius: 6px;
  overflow: hidden;
  background: #f5f5f5;
  aspect-ratio: 1;
}

.image-preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.image-preview-item.error {
  opacity: 0.5;
  border: 2px solid #f44336;
}

.image-preview-item .size-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: bold;
}

.image-preview-item.error .size-badge {
  background: #f44336;
}

.image-preview-item.success .size-badge {
  background: #4caf50;
}
`;
document.head.appendChild(style);

// ===== EXPORTAR PARA USO GLOBAL =====
window.ImageValidator = ImageValidator;