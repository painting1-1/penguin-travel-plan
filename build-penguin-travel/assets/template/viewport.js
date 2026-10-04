
(() => {
  const viewport = window.visualViewport;
  let frame;
  function update() {
    frame = null;
    document.documentElement.style.setProperty('--ledger-dialog-vh', `${viewport?.height || window.innerHeight}px`);
    document.documentElement.style.setProperty('--ledger-dialog-top', `${viewport?.offsetTop || 0}px`);
    const input = document.activeElement;
    const body = input?.closest?.('.ledger-dialog[open] .ledger-dialog-body');
    if (!body || !input.matches('input,select,textarea')) return;
    const field = input.getBoundingClientRect(), bounds = body.getBoundingClientRect();
    if (field.bottom > bounds.bottom - 12) body.scrollTop += field.bottom - bounds.bottom + 12;
    else if (field.top < bounds.top + 8) body.scrollTop -= bounds.top + 8 - field.top;
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  window.addEventListener('resize', schedule, { passive: true });
  viewport?.addEventListener('resize', schedule, { passive: true });
  viewport?.addEventListener('scroll', schedule, { passive: true });
  document.addEventListener('focusin', schedule);
  update();
})();

