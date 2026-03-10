// ==========================================
// AUTH-CHECK.JS - Script inline para o HEAD
// Executa ANTES de o CSS renderizar
// Evita o "flicker" dos botões de autenticação
// ==========================================

(function() {
  'use strict';
  
  // Verificação rápida e síncrona
  const token = localStorage.getItem('token');
  
  if (token) {
    // Utilizador logado - adicionar class ao documento
    document.documentElement.classList.add('authenticated');
  } else {
    // Utilizador não logado - adicionar class ao documento
    document.documentElement.classList.add('not-authenticated');
  }
})();