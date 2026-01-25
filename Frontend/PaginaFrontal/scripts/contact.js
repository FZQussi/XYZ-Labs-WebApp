// Frontend/PaginaFrontal/scripts/contact.js

const API_BASE = 'http://localhost:3001';
let selectedFiles = [];

document.addEventListener('DOMContentLoaded', () => {
  setupFileUpload();
  setupCharCounter();
  setupContactForm();
});

// ===== FILE UPLOAD =====
function setupFileUpload() {
  const fileInput = document.getElementById('contactFiles');
  const uploadArea = document.getElementById('fileUploadArea');
  const fileList = document.getElementById('fileList');

  // Click to upload
  uploadArea.addEventListener('click', () => {
    fileInput.click();
  });

  // Drag and drop
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
  });

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over');
  });

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  });

  // File input change
  fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  });

  function handleFiles(files) {
    files.forEach(file => {
      // Validar tamanho (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`O ficheiro ${file.name} excede 10MB`);
        return;
      }

      // Validar tipo
      const validTypes = ['image/', 'application/pdf', '.stl', '.obj', '.3mf'];
      const isValid = validTypes.some(type => 
        file.type.startsWith(type) || file.name.endsWith(type)
      );

      if (!isValid) {
        alert(`Tipo de ficheiro não suportado: ${file.name}`);
        return;
      }

      selectedFiles.push(file);
    });

    renderFileList();
  }

  function renderFileList() {
    if (selectedFiles.length === 0) {
      fileList.innerHTML = '';
      return;
    }

    fileList.innerHTML = selectedFiles.map((file, index) => `
      <div class="file-item">
        <div class="file-info">
          <span class="file-icon">${getFileIcon(file)}</span>
          <div class="file-details">
            <span class="file-name">${file.name}</span>
            <span class="file-size">${formatFileSize(file.size)}</span>
          </div>
        </div>
        <button type="button" class="file-remove" onclick="removeFile(${index})">×</button>
      </div>
    `).join('');
  }

  window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    renderFileList();
  };

  function getFileIcon(file) {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type === 'application/pdf') return '📄';
    if (file.name.endsWith('.stl') || file.name.endsWith('.obj')) return '🎨';
    return '📎';
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// ===== CHARACTER COUNTER =====
function setupCharCounter() {
  const textarea = document.getElementById('contactMessage');
  const counter = document.getElementById('charCount');
  const maxChars = 1000;

  textarea.addEventListener('input', () => {
    const count = textarea.value.length;
    counter.textContent = count;

    if (count > maxChars) {
      textarea.value = textarea.value.substring(0, maxChars);
      counter.textContent = maxChars;
    }

    // Visual feedback
    if (count > maxChars * 0.9) {
      counter.style.color = '#e53935';
    } else {
      counter.style.color = '#666';
    }
  });
}

// ===== SUBMIT FORM =====
function setupContactForm() {
  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitContactBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Dados do formulário
    const formData = new FormData();
    formData.append('name', document.getElementById('contactName').value.trim());
    formData.append('email', document.getElementById('contactEmail').value.trim());
    formData.append('phone', document.getElementById('contactPhone').value.trim());
    formData.append('subject', document.getElementById('contactSubject').value);
    formData.append('message', document.getElementById('contactMessage').value.trim());

    // Adicionar ficheiros
    selectedFiles.forEach(file => {
      formData.append('files', file);
    });

    // Desabilitar botão
    submitBtn.disabled = true;
    submitBtn.textContent = 'A enviar...';

    try {
      const res = await fetch(`${API_BASE}/contact`, {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao enviar mensagem');
      }

      // Sucesso
      showSuccessModal();
      form.reset();
      selectedFiles = [];
      renderFileList();

    } catch (err) {
      console.error('Erro ao enviar:', err);
      alert('Erro ao enviar mensagem. Por favor, tente novamente ou contacte-nos diretamente por email/telefone.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '📧 Enviar Mensagem';
    }
  });
}

function renderFileList() {
  const fileList = document.getElementById('fileList');
  
  if (selectedFiles.length === 0) {
    fileList.innerHTML = '';
    return;
  }

  fileList.innerHTML = selectedFiles.map((file, index) => `
    <div class="file-item">
      <div class="file-info">
        <span class="file-icon">${getFileIcon(file)}</span>
        <div class="file-details">
          <span class="file-name">${file.name}</span>
          <span class="file-size">${formatFileSize(file.size)}</span>
        </div>
      </div>
      <button type="button" class="file-remove" onclick="removeFile(${index})">×</button>
    </div>
  `).join('');
}

function getFileIcon(file) {
  if (file.type.startsWith('image/')) return '🖼️';
  if (file.type === 'application/pdf') return '📄';
  if (file.name.endsWith('.stl') || file.name.endsWith('.obj')) return '🎨';
  return '📎';
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showSuccessModal() {
  const modal = document.getElementById('successModal');
  modal.classList.remove('hidden');
}