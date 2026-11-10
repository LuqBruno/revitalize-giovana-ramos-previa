// Revitalize Estética: prévia conceitual (Bruno Luque).
// Motion (vanilla) para coreografia e progresso de rolagem; Lenis para a roda do mouse.
// O conteúdo funciona sem este arquivo: os estados escondidos só existem depois de `motion-ready`.

const root = document.documentElement;
const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
const fineMQ = matchMedia('(hover: hover) and (pointer: fine)');
const deskMQ = matchMedia('(min-width: 861px)');
const reduce = reduceMQ.matches;
if (reduce) root.classList.add('reduce');

/* tokens de motion */
const EASE_OUT = [0.23, 1, 0.32, 1];
const EASE_IO = [0.77, 0, 0.175, 1];
const CSS_IO = 'cubic-bezier(0.77, 0, 0.175, 1)';
const CSS_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

/* mola com velocidade preservada (interrompível) */
function springVec(apply, { stiffness = 170, damping = 20 } = {}) {
  const s = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, raf: 0, last: 0 };
  const tick = (t) => {
    const dt = Math.min(0.032, (t - (s.last || t)) / 1000 || 0.016); s.last = t;
    for (const k of ['x', 'y']) {
      const v = 'v' + k, tk = 't' + k;
      s[v] += (-stiffness * (s[k] - s[tk]) - damping * s[v]) * dt; s[k] += s[v] * dt;
    }
    apply(s.x, s.y);
    if (Math.abs(s.x - s.tx) + Math.abs(s.y - s.ty) + Math.abs(s.vx) + Math.abs(s.vy) > 0.01) s.raf = requestAnimationFrame(tick);
    else { s.raf = 0; s.last = 0; }
  };
  return (x, y) => { s.tx = x; s.ty = y; if (!s.raf) s.raf = requestAnimationFrame(tick); };
}

/* ------------------------------------------------------------------ */
/* Frentes de cuidado e mensagem de WhatsApp                           */
/* ------------------------------------------------------------------ */
const WA = 'https://wa.me/5548996378336';
const FRONTS = {
  '': { phrase: 'uma avaliação', line: 'Se já tiver uma frente em mente, escolha abaixo. A conversa pode começar sem ela.' },
  corporal: { phrase: 'uma avaliação corporal', line: 'Na frente corporal, a avaliação olha para a região que você aponta e para o seu dia a dia.' },
  facial: { phrase: 'uma avaliação facial', line: 'Na frente facial, a conversa parte do que você observa no espelho e do cuidado que já faz em casa.' },
  laser: { phrase: 'depilação a laser', line: 'Na depilação a laser, a conversa inclui a região de interesse e o seu histórico de depilação.' },
  diastase: { phrase: 'diástase', line: 'Na diástase, a conversa começa pelo que você sente e percebe na região abdominal.' },
};
const state = { front: '' };
const messageFor = (f) => `Olá, Giovana! Gostaria de conversar sobre ${FRONTS[f].phrase}.`;
const waHref = (f) => `${WA}?text=${encodeURIComponent(messageFor(f))}`;

const groups = $$('[data-chips]');
const preview = $('[data-preview]');
const frontLines = $$('[data-front-line]');
const frontCards = $$('[data-front-card]');
let animateFn = null; // preenchido quando o Motion carrega
const pillState = new WeakMap();

function placePill(group, animated) {
  const pill = $('[data-pill]', group);
  const checked = $('input:checked', group);
  if (!pill || !checked) return;
  const r = checked.nextElementSibling.getBoundingClientRect(), gr = group.getBoundingClientRect();
  if (!r.width) return;
  const to = { x: r.left - gr.left, y: r.top - gr.top, w: r.width, h: r.height };
  const placed = pillState.get(group);
  pillState.set(group, true);
  if (!animated || !animateFn || reduce || !placed) {
    Object.assign(pill.style, { width: to.w + 'px', height: to.h + 'px', transform: `translate(${to.x}px, ${to.y}px)`, opacity: 1 });
    return;
  }
  animateFn(pill, { transform: `translate(${to.x}px, ${to.y}px)`, width: to.w + 'px', height: to.h + 'px' }, { type: 'spring', bounce: 0.18, duration: 0.45 });
}

function reorderFronts() {
  if (!frontCards.length) return;
  const before = new Map(frontCards.map((c) => [c, c.getBoundingClientRect()]));
  frontCards.forEach((c, i) => {
    c.style.order = c.dataset.front === state.front ? -1 : i;
    c.classList.toggle('is-picked', c.dataset.front === state.front);
  });
  if (reduce) return;
  frontCards.forEach((c) => {
    const a = before.get(c), b = c.getBoundingClientRect();
    const dx = a.left - b.left, dy = a.top - b.top;
    if (dx || dy) c.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 520, easing: CSS_OUT });
  });
}

function setFront(value, from) {
  state.front = value;
  groups.forEach((g) => {
    if (g !== from) { const input = $(`input[value="${value}"]`, g); if (input) input.checked = true; }
    placePill(g, true);
  });
  const msg = messageFor(value);
  if (preview) preview.textContent = msg;
  frontLines.forEach((p) => { p.textContent = FRONTS[value].line; });
  $$('[data-wa]').forEach((a) => { if (!a.dataset.frontLink && !a.hasAttribute('data-plain')) a.href = waHref(value); });
  reorderFronts();
}
groups.forEach((g) => {
  g.addEventListener('change', (e) => { if (e.target.matches('input')) setFront(e.target.value, g); });
  if (!$('[data-pill]', g)) g.classList.add('no-pill');
  new ResizeObserver(() => placePill(g, false)).observe(g);
});
document.fonts?.ready.then(() => groups.forEach((g) => placePill(g, false)));
frontLines.forEach((p) => { p.textContent = FRONTS[''].line; });
groups.forEach((g) => placePill(g, false));

/* copiar mensagem */
const copyBtn = $('[data-copy]');
const copyLabel = $('[data-copy-label]');
const status = $('[data-status]');
let copyTimer = 0;
copyBtn?.addEventListener('click', async () => {
  const text = messageFor(state.front);
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.cssText = 'position:fixed;opacity:0'; document.body.appendChild(ta); ta.select();
    try { ok = document.execCommand('copy'); } catch { ok = false; } ta.remove();
  }
  copyLabel.textContent = ok ? 'Copiado' : 'Copie manualmente';
  status.textContent = ok ? 'Mensagem copiada. É só colar no WhatsApp.' : 'Não foi possível copiar. Selecione o texto acima e copie.';
  clearTimeout(copyTimer);
  copyTimer = setTimeout(() => { copyLabel.textContent = 'Copiar mensagem'; status.textContent = ''; }, 2600);
});

/* ------------------------------------------------------------------ */
/* Recorte interno do espelho: a foto é reenquadrada, nunca ampliada   */
/* além do necessário. Margem de 3,5% esconde os cantos da captura.    */
/* ------------------------------------------------------------------ */
function cropTransform(img, c) {
  const host = img.parentElement;
  const W = host.clientWidth, H = host.clientHeight;
  if (!W || !H) return null;
  const ar = (+img.getAttribute('height')) / (+img.getAttribute('width'));
  const imgH0 = W * ar;
  let s = c.h ? H / (c.h * imgH0) : 0;
  s = Math.max(s, 1.075, H / (0.93 * imgH0));
  const vw = 1 / s, vh = H / (s * imgH0);
  const x0 = clamp(c.cx - vw / 2, 0.035, 0.965 - vw);
  const y0 = clamp(c.cy - vh / 2, 0.035, 0.965 - vh);
  return `translate(${(-x0 * s * W).toFixed(1)}px, ${(-y0 * s * imgH0).toFixed(1)}px) scale(${s.toFixed(4)})`;
}
function applyCrop(img, c, { animated = false, duration = 900 } = {}) {
  const to = cropTransform(img, c);
  if (!to) return;
  img.classList.add('is-crop');
  const from = animated && !reduce ? getComputedStyle(img).transform : 'none';
  img._crop = c;
  img.style.transform = to;
  if (from && from !== 'none') img.animate([{ transform: from }, { transform: to }], { duration, easing: CSS_IO });
}
const cropped = $$('[data-crop]');
const cropOf = (img) => { try { return JSON.parse(img.dataset.crop); } catch { return { cx: 0.5, cy: 0.4 }; } };
const cropRO = new ResizeObserver((entries) => entries.forEach((en) => {
  $$('img.is-crop, img[data-crop], .stage__layer', en.target).forEach((img) => { if (img._crop) applyCrop(img, img._crop); });
}));
cropped.forEach((img) => { applyCrop(img, cropOf(img)); cropRO.observe(img.parentElement); });

/* ------------------------------------------------------------------ */
/* Topo, âncoras e rolagem contínua                                    */
/* ------------------------------------------------------------------ */
const top = $('[data-top]');
const darkZones = ['[data-scene]', '[data-contact]', '.foot'].map((s) => $(s)).filter(Boolean);
let topRaf = 0;
function updateTop() {
  topRaf = 0;
  top.classList.toggle('is-solid', scrollY > 24);
  const y = top.offsetHeight / 2;
  top.classList.toggle('is-dark', darkZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= y && r.bottom >= y; }));
}
addEventListener('scroll', () => { if (!topRaf) topRaf = requestAnimationFrame(updateTop); }, { passive: true });
updateTop();

let lenis = null;
function startLenis() {
  if (reduce || !window.Lenis || lenis) return;
  lenis = new window.Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
  const raf = (t) => { if (!lenis) return; lenis.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
}
if (window.Lenis) startLenis(); else addEventListener('load', startLenis, { once: true });
reduceMQ.addEventListener('change', () => { if (reduceMQ.matches && lenis) { lenis.destroy(); lenis = null; } });

function goTo(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.3, easing: (t) => 1 - Math.pow(1 - t, 4) });
  else scrollTo({ top: y, behavior: reduce ? 'auto' : 'smooth' });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const target = id === '#inicio' ? document.body : $(id);
  if (!target) return;
  e.preventDefault();
  const isScene = target.matches('[data-scene]');
  const y = id === '#inicio' ? 0 : target.getBoundingClientRect().top + scrollY - (isScene ? 0 : top.offsetHeight + 8);
  goTo(Math.max(0, y) + (isScene && root.classList.contains('pin') ? 4 : 0));
  if (id !== '#inicio') { target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }); }
});

/* ------------------------------------------------------------------ */
/* Cena "As quatro perguntas"                                           */
/* ------------------------------------------------------------------ */
const scene = $('[data-scene]');
const qs = $$('[data-q]');
const dots = $$('[data-dot]');
const qlist = $('[data-qlist]');
const countEl = $('[data-count]');
const layers = $$('.stage__layer');
const stageGlow = $('[data-stage-glow]');
const stageSweep = $('[data-stage-sweep]');
const qcrop = (q) => { const im = $('img', q); return { key: im.dataset.key, c: cropOf(im) }; };
let mode = 'list';
let cur = 0;
let sweepAnim = null;
let M = null;

function markStep(i) {
  cur = i;
  qs.forEach((q, k) => q.classList.toggle('is-active', k === i));
  dots.forEach((d, k) => { d.classList.toggle('is-on', k === i); if (k === i) d.setAttribute('aria-current', 'step'); else d.removeAttribute('aria-current'); });
  if (countEl) countEl.textContent = String(i + 1).padStart(2, '0');
}
function updateStage(i, instant) {
  const { key, c } = qcrop(qs[i]);
  layers.forEach((l) => l.classList.toggle('is-on', l.dataset.layer === key));
  const layer = layers.find((l) => l.dataset.layer === key);
  if (layer) applyCrop(layer, c, { animated: !instant, duration: 950 });
  stageGlow.style.setProperty('--g', qs[i].dataset.glow);
}
function sweepStage(dir) {
  if (reduce || !stageSweep) return;
  sweepAnim?.cancel();
  const [a, b] = dir > 0 ? ['-150%', '430%'] : ['430%', '-150%'];
  sweepAnim = stageSweep.animate([
    { opacity: 0, transform: `translateX(${a}) skewX(-14deg)` },
    { opacity: 1, offset: 0.3 },
    { opacity: 0, transform: `translateX(${b}) skewX(-14deg)` },
  ], { duration: 1100, easing: CSS_OUT });
}
function showStep(i, { instant = false } = {}) {
  if (i === cur && !instant) return;
  const prev = qs[cur], next = qs[i], dir = i >= cur ? 1 : -1;
  markStep(i);
  if (mode !== 'pin') return;
  updateStage(i, instant);
  if (instant || !animateFn || reduce) {
    qs.forEach((q) => { q.style.opacity = ''; q.style.transform = ''; q.style.visibility = ''; });
    return;
  }
  sweepStage(dir);
  prev.style.visibility = 'visible';
  animateFn(prev, { opacity: 0, transform: `translateY(${-18 * dir}px)` }, { duration: 0.28, ease: EASE_OUT })
    .then(() => { if (qs[cur] !== prev) { prev.style.visibility = ''; prev.style.opacity = ''; prev.style.transform = ''; } });
  next.style.visibility = '';
  animateFn(next, { opacity: [0, 1], transform: [`translateY(${24 * dir}px)`, 'translateY(0px)'] }, { duration: 0.55, delay: 0.1, ease: EASE_OUT });
}
function sceneProgress() {
  const r = scene.getBoundingClientRect();
  return clamp(-r.top / Math.max(1, r.height - innerHeight));
}
const stepFromProgress = (p) => Math.min(3, Math.floor(clamp(p, 0, 0.9999) * 4));

function goStep(i) {
  i = clamp(i, 0, 3);
  if (mode === 'pin') {
    const top0 = scene.getBoundingClientRect().top + scrollY;
    goTo(top0 + ((i + 0.5) / 4) * (scene.offsetHeight - innerHeight));
  } else if (mode === 'deck') {
    const q = qs[i];
    qlist.scrollTo({ left: q.offsetLeft - (qlist.clientWidth - q.clientWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
  } else {
    qs[i].scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' });
  }
}
dots.forEach((d, i) => d.addEventListener('click', () => goStep(i)));
$('[data-prev]')?.addEventListener('click', () => goStep(cur - 1));
$('[data-next]')?.addEventListener('click', () => goStep(cur + 1));

const sceneVisible = () => { const r = scene.getBoundingClientRect(); return r.top <= innerHeight * 0.5 && r.bottom >= innerHeight * 0.5; };
document.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
  if (mode === 'list' || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest('[data-chips], input, textarea, select, details')) return;
  if (mode === 'pin' && !sceneVisible()) return;
  if (mode === 'deck' && !qlist.contains(e.target) && !e.target.closest('[data-qnav]')) return;
  e.preventDefault();
  goStep(cur + (e.key === 'ArrowRight' ? 1 : -1));
});

/* cartões no celular: o índice acompanha o arrasto e a luz acompanha cada cartão */
let deckRaf = 0;
function deckUpdate() {
  deckRaf = 0;
  const lr = qlist.getBoundingClientRect(), mid = lr.left + lr.width / 2;
  let best = 0, bd = Infinity;
  qs.forEach((q, k) => {
    const r = q.getBoundingClientRect(), off = (r.left + r.width / 2 - mid) / r.width;
    q.style.setProperty('--g', (0.5 - off * 0.45).toFixed(3));
    const g = $('.mirror__glow', q); if (g) g.style.setProperty('--g', (0.5 - off * 0.45).toFixed(3));
    if (Math.abs(off) < bd) { bd = Math.abs(off); best = k; }
  });
  if (best !== cur) markStep(best);
}
qlist.addEventListener('scroll', () => { if (mode === 'deck' && !deckRaf) deckRaf = requestAnimationFrame(deckUpdate); }, { passive: true });

function setMode() {
  const next = !M || reduce ? 'list' : deskMQ.matches ? 'pin' : 'deck';
  if (next === mode && root.dataset.modeSet) return;
  mode = next; root.dataset.modeSet = '1';
  root.classList.toggle('pin', mode === 'pin');
  root.classList.toggle('deck', mode === 'deck');
  qs.forEach((q) => { q.style.opacity = ''; q.style.transform = ''; q.style.visibility = ''; });
  if (mode === 'deck') { qlist.tabIndex = 0; qlist.setAttribute('role', 'region'); qlist.setAttribute('aria-label', 'Perguntas, use as setas para trocar'); }
  else { qlist.removeAttribute('role'); qlist.removeAttribute('aria-label'); qlist.tabIndex = -1; }
  requestAnimationFrame(() => {
    if (mode === 'pin') {
      markStep(stepFromProgress(sceneProgress()));
      layers.forEach((l) => { const first = qs.map(qcrop).find((x) => x.key === l.dataset.layer); if (first) applyCrop(l, first.c); });
      updateStage(cur, true);
    } else if (mode === 'deck') { deckUpdate(); }
    else markStep(0);
  });
}
deskMQ.addEventListener('change', setMode);

/* ------------------------------------------------------------------ */
/* Mostrador fixo (celular): some no hero e no contato                  */
/* ------------------------------------------------------------------ */
const dock = $('[data-dock]');
const seen = { hero: true, contact: false };
const syncDock = () => dock && dock.classList.toggle('is-on', !seen.hero && !seen.contact);
const heroCta = $('[data-hero-cta]');
if (heroCta) new IntersectionObserver(([en]) => { seen.hero = en.isIntersecting; syncDock(); }).observe(heroCta);
new IntersectionObserver(([en]) => { seen.contact = en.isIntersecting; syncDock(); }, { threshold: 0.15 }).observe($('[data-contact]'));

/* CTA magnético (só ponteiro fino; usa `translate`, livre do :active) */
if (!reduce && fineMQ.matches) {
  $$('[data-magnetic]').forEach((b) => {
    const set = springVec((x, y) => { b.style.translate = `${x.toFixed(2)}px ${y.toFixed(2)}px`; }, { stiffness: 220, damping: 18 });
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      set((e.clientX - r.left - r.width / 2) * 0.16, (e.clientY - r.top - r.height / 2) * 0.28);
    });
    b.addEventListener('pointerleave', () => set(0, 0));
  });
}

/* ------------------------------------------------------------------ */
/* Motion: coreografia                                                  */
/* ------------------------------------------------------------------ */
M = window.Motion || null;
if (!M) console.warn('Motion indisponível; página segue estática.');

if (M) {
  const { animate, scroll, inView, stagger } = M;
  animateFn = (...a) => animate(...a);
  const prog = (p) => (typeof p === 'number' ? p : p?.y?.progress ?? 0);

  if (reduce) {
    root.classList.add('motion-ready');
  } else {
    root.classList.add('motion-ready');

    /* ---- Assinatura 1: hero, o espelho abre e a luz passa uma vez ---- */
    const hero = $('[data-hero]');
    animate('.hero__title .line > span', { transform: ['translateY(108%)', 'translateY(0%)'] }, { duration: 1, delay: stagger(0.08), ease: EASE_OUT });
    animate('.hero .eyebrow, .hero__lead, .hero__actions', { opacity: [0, 1], transform: ['translateY(14px)', 'translateY(0)'] }, { duration: 0.8, delay: stagger(0.08, { startDelay: 0.3 }), ease: EASE_OUT });
    animate('.hero__mirror .mirror__frame', { clipPath: ['inset(100% 0 0 0 round 999px 999px 22px 22px)', 'inset(0% 0 0 0 round 999px 999px 22px 22px)'] }, { duration: 1.3, delay: 0.15, ease: EASE_IO })
      .then(() => { $('.hero__mirror .mirror__frame').style.clipPath = 'none'; });
    animate('.hero__ask', { opacity: [0, 1], transform: ['translateY(10px)', 'translateY(0)'] }, { duration: 0.6, delay: 1.2, ease: EASE_OUT });
    requestAnimationFrame(() => root.classList.add('hero-in'));
    const hSweep = $('[data-hero-sweep]');
    setTimeout(() => hSweep?.animate([
      { opacity: 0, transform: 'translateX(-150%) skewX(-14deg)' }, { opacity: 1, offset: 0.3 }, { opacity: 0, transform: 'translateX(430%) skewX(-14deg)' },
    ], { duration: 1500, easing: CSS_OUT }), 1000);

    // a luz do espelho segue o ponteiro (mola do próprio CSS); a moldura sobe de leve ao sair
    const hGlow = $('[data-hero-glow]');
    const heroMirror = $('.hero__mirror');
    if (fineMQ.matches && hGlow) {
      addEventListener('pointermove', (e) => {
        if (scrollY > innerHeight) return;
        hGlow.style.setProperty('--g', (0.1 + 0.85 * clamp(e.clientX / innerWidth)).toFixed(3));
      }, { passive: true });
    }
    scroll((p) => { heroMirror.style.translate = `0 ${(prog(p) * -46).toFixed(1)}px`; }, { target: hero, offset: ['start start', 'end start'] });

    /* ---- Narrativa 1: a luz varre entre o hero e a avaliação ---- */
    const sw = $('[data-sweep]');
    scroll((p) => {
      const t = prog(p);
      sw.style.opacity = String(Math.sin(Math.PI * clamp(t)).toFixed(3));
      sw.style.transform = `translateX(${(-50 + t * 170).toFixed(1)}vw) skewX(-18deg)`;
    }, { target: $('.sweep'), offset: ['start end', 'start start'] });

    /* ---- Avaliação: a linha acende com a leitura ---- */
    const howSteps = $('[data-how-steps]');
    const lis = $$('li', howSteps);
    scroll(() => {
      const r = howSteps.getBoundingClientRect();
      const mark = innerHeight * 0.62;
      howSteps.style.setProperty('--rail', clamp((mark - r.top - 30) / Math.max(1, r.height - 60)).toFixed(3));
      lis.forEach((li) => li.classList.toggle('is-lit', li.getBoundingClientRect().top < mark));
    }, { target: $('[data-how]'), offset: ['start end', 'end start'] });

    /* ---- Assinatura 2: a cena das quatro perguntas ---- */
    setMode();
    scroll(() => { if (mode === 'pin') showStep(stepFromProgress(sceneProgress())); }, { target: scene, offset: ['start start', 'end end'] });

    /* ---- Narrativa 2: a moldura de arco abre a seção seguinte como uma porta ---- */
    const fronts = $('[data-fronts]');
    scroll((p) => {
      const t = clamp(prog(p));
      if (t >= 1) { fronts.style.clipPath = 'none'; return; }
      const m = 34 * (1 - t), r = 1400 * Math.pow(1 - t, 1.4);
      fronts.style.clipPath = `inset(0 ${m.toFixed(2)}% 0 ${m.toFixed(2)}% round ${r.toFixed(0)}px ${r.toFixed(0)}px 0 0)`;
    }, { target: $('[data-doorway]'), offset: ['start end', 'start 0.2'] });

    /* ---- Títulos: revelação por máscara ---- */
    $$('[data-mask]').forEach((h) => {
      if (h.getBoundingClientRect().top < innerHeight * 0.9) return;
      h.style.clipPath = 'inset(0 0 100% 0)';
      h.style.transform = 'translateY(22px)';
      inView(h.parentElement, () => { animate(h, { clipPath: ['inset(0% 0% 100% 0%)', 'inset(0% 0% -14% 0%)'], transform: 'translateY(0px)' }, { duration: 1, ease: EASE_OUT }); }, { amount: 0.25 });
    });

    /* ---- O espaço: as janelas de arco se abrem ---- */
    $$('[data-reveal]').forEach((fig) => {
      const shape = $('.arc__shape', fig);
      if (fig.getBoundingClientRect().top < innerHeight * 0.85) return;
      shape.style.clipPath = 'inset(100% 0 0 0)';
      inView(fig, () => { animate(shape, { clipPath: ['inset(100% 0 0 0)', 'inset(0% 0 0 0)'] }, { duration: 1.2, ease: EASE_IO }); }, { amount: 0.2 });
    });
  }
}
if (!M || reduce) setMode();
