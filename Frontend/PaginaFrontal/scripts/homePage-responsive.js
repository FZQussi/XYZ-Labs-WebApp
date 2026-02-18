// ==========================================
// HOMEPAGE-RESPONSIVE.JS
// Específico da HomePage: process section,
// ajustes responsivos, modal de sucesso
//
// DEPENDE DE: header.js (já incluído antes)
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  initProcessSection();
  checkOrderSuccess();
  initializeResponsiveAdjustments();
});

// ==========================================
// PROCESS SECTION - Scroll + Parallax
// ==========================================
function initProcessSection() {
  initProcessCards();
  initProcessParallax();
}

function initProcessCards() {
  const cards = document.querySelectorAll('.process-card-wrapper');
  if (!cards.length) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    cards.forEach(c => c.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
  );

  cards.forEach(card => observer.observe(card));
}

function initProcessParallax() {
  const bgImage = document.querySelector('.process-bg-image');
  const section = document.getElementById('processSection');
  if (!bgImage || !section || window.innerWidth <= 768) return;

  let ticking = false;

  function updateParallax() {
    const rect  = section.getBoundingClientRect();
    const viewH = window.innerHeight;
    if (rect.bottom < 0 || rect.top > viewH) { ticking = false; return; }
    const progress = 1 - (rect.bottom / (viewH + rect.height));
    bgImage.style.transform = `translateY(${progress * 80}px)`;
    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
  }, { passive: true });

  updateParallax();
}

// ==========================================
// MODAL DE SUCESSO DE PEDIDO
// ==========================================
function checkOrderSuccess() {
  const lastOrderId = sessionStorage.getItem('lastOrderId');
  if (!lastOrderId) return;
  showSuccessModal(lastOrderId);
  sessionStorage.removeItem('lastOrderId');
}

function showSuccessModal(orderId) {
  const modal       = document.getElementById('successModal');
  const orderNumber = document.getElementById('orderNumber');
  if (!modal || !orderNumber) return;
  orderNumber.textContent = orderId;
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.add('hidden'), 5000);
}

// ==========================================
// AJUSTES RESPONSIVOS
// ==========================================
function initializeResponsiveAdjustments() {
  handleOrientationChange();
  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', debounce(handleResize, 250));

  if ('ontouchstart' in window) document.body.classList.add('touch-device');
  if ('IntersectionObserver' in window) initLazyLoading();
}

function handleOrientationChange() {
  const isLandscapeMobile =
    window.matchMedia('(orientation: landscape)').matches && window.innerWidth <= 768;
  document.body.classList.toggle('landscape-mobile', isLandscapeMobile);
}

function handleResize() {
  adjustCarouselSpeed();
}

function adjustCarouselSpeed() {
  const track = document.querySelector('.carousel-track');
  if (!track) return;
  const w = window.innerWidth;
  track.style.animationDuration =
    w <= 480  ? '70s' :
    w <= 768  ? '60s' :
    w <= 1024 ? '50s' : '40s';
}

function initLazyLoading() {
  const observer = new IntersectionObserver((entries, obs) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          obs.unobserve(img);
        }
      }
    });
  }, { rootMargin: '50px 0px', threshold: 0.01 });

  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
}

// ==========================================
// UTILITÁRIOS
// ==========================================
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

window.addEventListener('offline', () => {
  alert('Parece que está sem conexão à internet. Algumas funcionalidades podem não estar disponíveis.');
});

if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
  const viewport = document.querySelector('meta[name="viewport"]');
  if (viewport) viewport.content = 'width=device-width, initial-scale=1, maximum-scale=1';
}