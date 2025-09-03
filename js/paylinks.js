// js/paylinks.js  (versión filtrada)
(function () {
  const PAY_PAGE = 'pagos.html';

  // Qué tarjetas escanear (según tu HTML)
  const CARD_SELECTORS = [
    '.fruite-item',                 // cards de catálogo
    '.vesitable-item',              // carrusel
    '.p-4.rounded.bg-light'         // “más vendidos” (con precio)
  ];

  // Secciones/ancestros que deben ignorarse
  const SKIP_ANCESTORS = [
    '[data-nopay]', // marca manual
    '.featurs',     // tus cajas de “Envíos, Seguridad, …”
    '.service'      // por si usas otra sección de features
  ];

  const PAY_BTN_ATTR = 'data-pay-btn';
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function normalizeAmount(v) {
    if (typeof v !== 'string') v = String(v ?? '');
    v = v.trim();
    if (v.includes('.') && v.includes(',')) v = v.replace(/\./g, '').replace(',', '.');
    else if (v.includes(',')) v = v.replace(',', '.');
    const n = parseFloat(v);
    return isNaN(n) ? null : Number(n.toFixed(2));
  }

  function findTitle(card) {
    const el = card.querySelector('h4, .h4, .h5, a.h5, .card-title');
    return (el ? el.textContent : 'Producto').trim();
  }

  function findPrice(card) {
    // 1) Prioridad: data-monto
    const raw = card.dataset?.monto;
    if (raw) {
      const n = normalizeAmount(raw);
      if (n !== null) return n.toFixed(2);
    }
    // 2) Buscar “S/ 123.45” en nodos
    for (const node of $$('.text-dark, .fw-bold, h4, h5, p, span, div', card)) {
      const t = (node.textContent || '').replace(/\s+/g, ' ').trim();
      const m = t.match(/S\/\s*([\d.,]+)/i);
      if (m) {
        const n = normalizeAmount(m[1]);
        if (n !== null) return n.toFixed(2);
      }
    }
    return null; // si no hay precio, no es producto
  }

  function findOrder(card) {
    return card.dataset?.order || card.dataset?.sku || '';
  }

  function buildPayHref(title, amount, order) {
    const qp = new URLSearchParams();
    qp.set('producto', title);
    qp.set('monto', amount);
    if (order) qp.set('order', order);
    return `${PAY_PAGE}?${qp.toString()}`;
  }

  function makePayButton(title, amount, order) {
    const a = document.createElement('a');
    a.setAttribute(PAY_BTN_ATTR, '1');
    a.href = buildPayHref(title, amount, order);
    a.className = 'btn border border-secondary rounded-pill px-3 text-primary ms-2';
    a.innerHTML = '<i class="fas fa-money-bill-wave me-2 text-primary"></i>Pagar';
    a.title = 'Pagar con Yape/Plin';
    return a;
  }

  function placeButton(card, btn) {
    const row =
      card.querySelector('.d-flex.justify-content-between.flex-lg-wrap') ||
      card.querySelector('.p-4') ||
      card;
    row.appendChild(btn);
  }

  function shouldSkip(card) {
    return SKIP_ANCESTORS.some(sel => card.closest(sel));
  }

  function processCard(card) {
    if (card.querySelector(`[${PAY_BTN_ATTR}]`)) return; // ya existe
    if (shouldSkip(card)) return;                         // dentro de sección no pagable

    const amount = findPrice(card);
    if (amount === null) return;                          // si no hay precio, NO inyectar

    const title = findTitle(card);
    const order = findOrder(card);
    const btn = makePayButton(title, amount, order);
    placeButton(card, btn);
  }

  document.addEventListener('DOMContentLoaded', () => {
    CARD_SELECTORS.forEach(sel => $$(sel).forEach(processCard));
  });
})();
