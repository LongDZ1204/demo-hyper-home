/* ============================================================================
   HYPER INKERS — BOOKING FORM behavior  (design-system component · v7)
   Self-initializing. Include once per page AFTER the modal markup:
       <script src="_foundation/components/booking-form.js" defer></script>
   Open from ANY element:  <button data-open-booking>Book now</button>
   Programmatic:  HIBooking.open() / HIBooking.close()
   v7: live required-field tracking → status line + CTA enable/glow.
   NOTE: submit shows the demo success state. Wire the real POST where marked.
   ============================================================================ */
(function () {
  var modal = document.getElementById('hiBookingModal');
  if (!modal) return;

  var scroll  = modal.querySelector('[data-booking-body]');
  var footer  = modal.querySelector('[data-booking-footer]');
  var success = modal.querySelector('[data-booking-success]');
  var form    = modal.querySelector('[data-booking-form]');
  var submit  = modal.querySelector('[data-booking-submit]');
  var status  = modal.querySelector('[data-booking-status]');
  var dateEl  = modal.querySelector('input[type="date"]');
  var required = form ? Array.prototype.slice.call(form.querySelectorAll('[required]')) : [];
  var selects  = form ? Array.prototype.slice.call(form.querySelectorAll('select')) : [];

  if (dateEl) { try { dateEl.min = new Date().toISOString().split('T')[0]; } catch (e) {} }

  // live validity → status text + CTA enable/glow
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
  if (form) { form.addEventListener('input', refresh); form.addEventListener('change', refresh); }

  function open() {
    modal.classList.add('open');
    document.body.classList.add('modal-open');
    if (scroll)  scroll.style.display = '';
    if (footer)  footer.style.display = '';
    if (success) success.classList.remove('active');
    refresh();
    var first = modal.querySelector('.field-input');
    setTimeout(function () { if (first) first.focus(); }, 300);
  }
  function close() {
    modal.classList.remove('open');
    document.body.classList.remove('modal-open');
  }

  document.querySelectorAll('[data-open-booking]').forEach(function (el) {
    el.addEventListener('click', function (e) { e.preventDefault(); open(); });
  });
  modal.querySelectorAll('[data-booking-close]').forEach(function (el) { el.addEventListener('click', close); });
  modal.addEventListener('click', function (e) { if (e.target === modal) close(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('open')) close();
  });

  // submit → demo success state (replace with real submission)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (scroll) scroll.style.display = 'none';
      if (footer) footer.style.display = 'none';
      if (success) success.classList.add('active');
    });
  }

  refresh();                                   // initial state on load
  window.HIBooking = { open: open, close: close };
})();
