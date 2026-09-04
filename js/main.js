// ===== Barra de progresso de leitura =====
const scrollBar = document.querySelector('.scroll-progress-bar');
function updateScrollProgress() {
  const h = document.documentElement;
  const max = h.scrollHeight - h.clientHeight;
  const pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
  if (scrollBar) scrollBar.style.width = pct + '%';
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
updateScrollProgress();

// ===== Sidebar (menu lateral) =====
const menuToggle = document.querySelector('.menu-toggle');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');
const overlay = document.querySelector('.sidebar-overlay');

function openSidebar() { sidebar?.classList.add('open'); overlay?.classList.add('show'); menuToggle?.classList.add('open'); }
function closeSidebar() { sidebar?.classList.remove('open'); overlay?.classList.remove('show'); menuToggle?.classList.remove('open'); }

function toggleSidebar() {
  if (sidebar?.classList.contains('open')) {
    closeSidebar();
  } else {
    openSidebar();
  }
}

menuToggle?.addEventListener('click', toggleSidebar);
sidebarClose?.addEventListener('click', closeSidebar);
overlay?.addEventListener('click', closeSidebar);
document.querySelectorAll('.side-link').forEach((link) => link.addEventListener('click', closeSidebar));

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ===== Transição suave entre páginas =====
if (!prefersReducedMotion) {
  document.querySelectorAll('a[href]').forEach((link) => {
    const href = link.getAttribute('href');
    const isInternal = href && !href.startsWith('#') && !href.startsWith('http') &&
      !href.startsWith('mailto:') && !href.startsWith('tel:') && link.target !== '_blank';
    if (!isInternal) return;
    link.addEventListener('click', (e) => {
      if (e.metaKey || e.ctrlKey || e.shiftKey) return; // deixa abrir em nova aba normalmente
      e.preventDefault();
      document.body.classList.add('page-leaving');
      setTimeout(() => { window.location.href = href; }, 320);
    });
  });
}

// ===== Cards com leve inclinação seguindo o mouse (delicada, não mecânica) =====
if (!prefersReducedMotion) {
  document.querySelectorAll('.cat-card, .service-item').forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.dataset.hovering = 'true';
      const icon = card.querySelector('.icon-badge');
      if (icon) icon.style.transform = '';
    });
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      const rx = (-py * 9).toFixed(2);
      const ry = (px * 9).toFixed(2);
      // uma transição curta suaviza o movimento sem deixar o card
      // "correndo atrás" do cursor (o problema de antes era 0.3s)
      card.style.transition = 'transform 0.15s ease-out';
      card.style.transform = `translateY(-3px) perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => {
      card.dataset.hovering = 'false';
      card.style.transition = 'transform 0.5s cubic-bezier(0.16,1,0.3,1)';
      card.style.transform = '';
    });
  });
}

// ===== Brilho do botão seguindo o cursor (interno + sombra externa) =====
if (!prefersReducedMotion) {
  document.querySelectorAll('.btn').forEach((btn) => {
    btn.addEventListener('mousemove', (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      btn.style.setProperty('--mx', (x / rect.width) * 100 + '%');
      btn.style.setProperty('--my', (y / rect.height) * 100 + '%');
      // sombra externa desloca na mesma direção do cursor, com limite máximo
      const sx = Math.max(Math.min((x - rect.width / 2) * 0.25, 16), -16);
      const sy = Math.max(Math.min((y - rect.height / 2) * 0.25, 16), -16);
      btn.style.setProperty('--sx', sx + 'px');
      btn.style.setProperty('--sy', sy + 'px');
    });
  });
}

// ===== Parallax genérico (qualquer imagem dentro de .hero-media, .page-media, .split-media, .parallax-banner) =====
const parallaxImgs = document.querySelectorAll('.hero-media img, .page-media img, .split-media img, .parallax-banner img, .page-media .visual-panel, .split-media .visual-panel, .parallax-banner .visual-panel');
const blobLayers = document.querySelectorAll('.hero-layer.l1, .hero-layer.l2');
const mountainLayers = document.querySelectorAll('.mountain-layer');
const parallaxCards = document.querySelectorAll('.cat-card, .service-item');
const parallaxIcons = document.querySelectorAll('.icon-badge');
const parallaxBlocks = document.querySelectorAll('.section-head, .split-text, .callout, .method-strip, .stat-row, .cta-banner, .faq-item, .side-card');

if (!prefersReducedMotion) {
  let ticking = false;

  function updateParallax() {
    const vh = window.innerHeight;
    const mobile = window.innerWidth < 700;

    parallaxImgs.forEach((img) => {
      const rect = img.parentElement.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      const speed = mobile ? 0.05 : 0.12;
      const offset = Math.max(Math.min(center * speed, 60), -60);
      img.style.transform = `translateY(${offset}px)`;
    });

    blobLayers.forEach((layer, i) => {
      const speed = i === 0 ? 0.15 : -0.1;
      const offset = window.scrollY * speed * (mobile ? 0.4 : 1);
      layer.style.transform = `translate3d(0, ${offset}px, 0)`;
    });

    const mountainSpeeds = [0.08, 0.16, 0.26];
    mountainLayers.forEach((layer, i) => {
      const offset = window.scrollY * mountainSpeeds[i] * (mobile ? 0.5 : 1);
      layer.style.transform = `translate3d(0, ${-offset}px, 0)`;
    });

    // Cards de solução: só recebem o parallax quando NÃO estão em
    // hover (não briga com a inclinação 3D) E já terminaram a
    // animação de entrada lateral (senão o transform inline do
    // parallax cortava a entrada pela metade, sobrescrevendo o
    // translateX que ainda estava em andamento). Quando o card sai
    // da tela, limpa o transform inline — senão ele fica "grudado"
    // e trava o reset da animação de entrada pra próxima vez.
    if (!mobile) {
      parallaxCards.forEach((card) => {
        if (card.dataset.hovering === 'true') return;
        if (!card.classList.contains('in')) {
          if (card.style.transform) card.style.transform = '';
          return;
        }
        const rect = card.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        const offset = Math.max(Math.min(center * 0.07, 34), -34);
        card.style.transition = 'transform 0.2s ease-out';
        card.style.transform = `translateY(${offset}px)`;
      });
    }

    // Ícones: profundidade independente do card, mais perceptível.
    // Se o card-pai estiver em hover, limpa o transform inline pra
    // não brigar com o efeito de escala/rotação (definido em CSS).
    parallaxIcons.forEach((icon) => {
      const parentCard = icon.closest('.cat-card, .service-item');
      if (parentCard && parentCard.dataset.hovering === 'true') {
        icon.style.transform = '';
        return;
      }
      const rect = icon.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - vh / 2;
      const offset = Math.max(Math.min(center * 0.09, 40), -40);
      icon.style.transform = `translateY(${offset}px)`;
    });

    // Blocos de texto/seção: mesmo princípio do hero — desce, o
    // bloco que já apareceu recua um pouco (como se ficasse "atrás"
    // do que vem a seguir); sobe, tudo volta suavemente pro centro.
    // Só entra em ação depois que a entrada (fade/lateral) já
    // terminou, senão cortaria essa animação pela metade. Ao sair
    // da tela, limpa o transform inline — é exatamente isso que
    // fazia o texto "perder a animação" ao rolar de volta: sobrava
    // um transform grudado, que bloqueava a CSS de resetar o estado
    // escondido (opacidade/posição) pra tocar de novo depois.
    if (!mobile) {
      parallaxBlocks.forEach((block) => {
        if (!block.classList.contains('in')) {
          if (block.style.transform) block.style.transform = '';
          return;
        }
        const rect = block.getBoundingClientRect();
        const center = rect.top + rect.height / 2 - vh / 2;
        const offset = Math.max(Math.min(center * 0.025, 18), -18);
        block.style.transition = 'transform 0.2s ease-out';
        block.style.transform = `translateY(${offset}px)`;
      });
    }

    ticking = false;
  }

  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(updateParallax); ticking = true; }
  }, { passive: true });
  updateParallax();
}

// ===== Reveal on scroll (funciona nos dois sentidos: sai da tela, reseta) =====
const revealEls = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-up, .reveal-down, .hero-enter');
if (revealEls.length && 'IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle('in', entry.isIntersecting);
    });
  }, { threshold: 0.15 });
  revealEls.forEach((el) => observer.observe(el));
} else {
  revealEls.forEach((el) => el.classList.add('in'));
}

// ===== Contadores animados =====
const statNums = document.querySelectorAll('.stat-box .n[data-count]');
if (statNums.length && 'IntersectionObserver' in window) {
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      let current = 0;
      const step = Math.max(1, Math.round(target / 40));
      const timer = setInterval(() => {
        current += step;
        if (current >= target) { current = target; clearInterval(timer); }
        el.textContent = current + suffix;
      }, 25);
      counterObserver.unobserve(el);
    });
  }, { threshold: 0.4 });
  statNums.forEach((el) => counterObserver.observe(el));
}
