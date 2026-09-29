/* HORANiQ: menu, hero report animation, contact form, click tracking hooks. No third-party code, no cookies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { nav.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); }
    });
  }

  /* The one animation: lamps in the example report switch on one after another. */
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.querySelectorAll(".report").forEach(function (report) {
    var lamps = report.querySelectorAll(".lamp");
    function lightAll() { lamps.forEach(function (l) { l.classList.add("on"); }); report.classList.add("lit"); }
    if (reduce || !("IntersectionObserver" in window)) { lightAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      report.classList.add("lit");
      lamps.forEach(function (l, i) { setTimeout(function () { l.classList.add("on"); }, 350 + i * 420); });
    }, { threshold: 0.4 });
    io.observe(report);
  });

  /* Tracking hooks: pushes to dataLayer only. Nothing is sent anywhere until a consented tag manager is added. */
  window.dataLayer = window.dataLayer || [];
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) window.dataLayer.push({ event: "cta_click", cta: el.getAttribute("data-track"), page: location.pathname });
  });

  /* Contact form: posts to the configured endpoint, otherwise opens a prefilled e-mail. */
  var form = document.getElementById("contact-form");
  if (!form) return;
  var note = form.querySelector(".form-note");
  var msg = {
    sending: form.dataset.msgSending,
    ok: form.dataset.msgOk,
    err: form.dataset.msgErr,
    invalid: form.dataset.msgInvalid
  };
  function say(text, cls) { note.textContent = text; note.className = "form-note " + (cls || ""); }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (form.website && form.website.value) return; /* honeypot */
    if (!form.checkValidity()) { form.reportValidity(); say(msg.invalid, "err"); return; }
    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== "website") data[k] = v; });
    data.page = location.pathname;
    var endpoint = form.dataset.endpoint;
    window.dataLayer.push({ event: "lead_submit", sector: data.sector || "", page: location.pathname });

    if (!endpoint) {
      var body = Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\n");
      location.href = "mailto:" + form.dataset.email + "?subject=" + encodeURIComponent(form.dataset.subject) + "&body=" + encodeURIComponent(body);
      say(msg.ok, "ok");
      return;
    }
    say(msg.sending);
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) { if (!r.ok) throw new Error(r.status); form.reset(); say(msg.ok, "ok"); })
      .catch(function () { say(msg.err, "err"); });
  });
})();
