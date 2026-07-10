(function () {
  const images = Array.from(document.querySelectorAll('.trail-card-image img, .gallery-card img'));
  if (!images.length) return;

  function ensureLightbox() {
    let overlay = document.getElementById('lightbox-overlay');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'lightbox-overlay';
    overlay.innerHTML = `
      <button class="lightbox-close" type="button">&times;</button>
      <button class="lightbox-nav prev" type="button">&#10094;</button>
      <div class="lightbox-content">
        <img id="lightbox-img" src="" alt="Zoomed view">
      </div>
      <div class="lightbox-caption" id="lightbox-caption"></div>
      <button class="lightbox-nav next" type="button">&#10095;</button>
    `;
    document.body.appendChild(overlay);
    return overlay;
  }

  const overlay = ensureLightbox();
  const imgEl = overlay.querySelector('#lightbox-img');
  const captionEl = overlay.querySelector('#lightbox-caption');
  const closeBtn = overlay.querySelector('.lightbox-close');
  const prevBtn = overlay.querySelector('.lightbox-nav.prev');
  const nextBtn = overlay.querySelector('.lightbox-nav.next');

  const items = images.map((img) => {
    const card = img.closest('.trail-card, .gallery-card');
    const title = card ? card.querySelector('.trail-card-title, .gallery-card-title') : null;
    const text = card ? card.querySelector('.trail-card-text, .gallery-card-text') : null;
    const footer = card ? card.querySelector('.trail-card-footer') : null;

    return {
      src: img.getAttribute('src') || '',
      caption: [
        title ? title.textContent.trim() : (img.alt || 'Memory'),
        text ? text.textContent.trim() : '',
        footer ? footer.textContent.trim() : ''
      ].filter(Boolean).join(' • ')
    };
  });

  let currentIndex = 0;

  function openAt(index) {
    if (!items.length) return;
    currentIndex = (index + items.length) % items.length;
    imgEl.src = items[currentIndex].src;
    captionEl.textContent = items[currentIndex].caption;
    overlay.classList.add('active');
    if (window.synth && typeof window.synth.playClick === 'function') {
      window.synth.playClick();
    }
  }

  function close() {
    overlay.classList.remove('active');
  }

  images.forEach((img, index) => {
    img.style.cursor = 'zoom-in';

    img.addEventListener('dblclick', (event) => {
      event.preventDefault();
      openAt(index);
    });

    let lastTap = 0;
    img.addEventListener('touchstart', (event) => {
      const now = Date.now();
      if (now - lastTap < 280) {
        event.preventDefault();
        openAt(index);
      }
      lastTap = now;
    }, { passive: false });
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) close();
  });

  prevBtn.addEventListener('click', () => openAt(currentIndex - 1));
  nextBtn.addEventListener('click', () => openAt(currentIndex + 1));

  document.addEventListener('keydown', (event) => {
    if (!overlay.classList.contains('active')) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft') openAt(currentIndex - 1);
    if (event.key === 'ArrowRight') openAt(currentIndex + 1);
  });
})();
