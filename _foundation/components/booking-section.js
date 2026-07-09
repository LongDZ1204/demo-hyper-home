/* ============================================================================
   HYPER INKERS — BOOKING SECTION behavior  (inline, non-modal · v1 · 2026-07-08)
   For the always-visible #book section. NOT the popup — see booking-form.js
   for the click-to-open modal's behavior.
   Include once per page AFTER the section markup:
       <script src="_foundation/components/booking-section.js" defer></script>
   Wires: live required-field validation -> status line + CTA enable/glow,
   demo success-state on submit. Wire the real POST where marked.
   Generic by design — works off [required] attributes inside [data-bks-form],
   so the same script drives the FULL variant (with Service/Artist) and the
   REMOVAL variant (without them) unmodified.
   ============================================================================ */
(function () {
  document.querySelectorAll('[data-bks-form]').forEach(function (form) {
    var card    = form.closest('.bks-card');
    if (!card) return;
    var body    = card.querySelector('[data-bks-body]');
    var success = card.querySelector('[data-bks-success]');
    var submit  = form.querySelector('[data-bks-submit]');
    var status  = form.querySelector('[data-bks-status]');
    var dateEl  = form.querySelector('input[type="date"]');
    var required = Array.prototype.slice.call(form.querySelectorAll('[required]'));
    var selects  = Array.prototype.slice.call(form.querySelectorAll('select'));

    if (dateEl) { try { dateEl.min = new Date().toISOString().split('T')[0]; } catch (e) {} }

    function refresh() {
      selects.forEach(function (s) { s.classList.toggle('is-empty', !s.value); });
      var remaining = required.reduce(function (n, el) { return n + (el.checkValidity() ? 0 : 1); }, 0);
      if (submit) submit.disabled = remaining > 0;
      if (status) {
        if (remaining === 0) {
          status.innerHTML = '<span class="check">&#10003;</span>Ready to submit';
          status.classList.add('is-ready');
        } else {
          status.textContent = remaining + (remaining === 1 ? ' required field remaining' : ' required fields remaining');
          status.classList.remove('is-ready');
        }
      }
    }
    form.addEventListener('input', refresh);
    form.addEventListener('change', refresh);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (body)    body.style.display = 'none';
      if (success) success.classList.add('active');
    });

    refresh();
  });
})();
