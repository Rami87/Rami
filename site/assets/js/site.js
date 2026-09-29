/* HORANiQ: menu, hero report animation, contact form, click tracking hooks. No third-party code, no cookies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  window.dataLayer = window.dataLayer || [];

  /* Mobile menu */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  function closeMenu(focusBtn) {
    if (!nav) return;
    nav.classList.remove("open");
    btn.setAttribute("aria-expanded", "false");
    if (focusBtn) btn.focus();
  }
  if (btn && nav) {
    btn.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) closeMenu(true);
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

  /* Click hooks: pushes to dataLayer only. Nothing is sent anywhere until a consented tag manager is added.
     Events never carry form contents or personal data. */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-track]");
    if (el) window.dataLayer.push({ event: "cta_click", cta: el.getAttribute("data-track"), page: location.pathname });
  });

  var form = document.getElementById("contact-form");
  var contactSection = document.getElementById("kontakt");

  /* Hide the sticky mobile bar while the contact section is on screen. */
  if (contactSection && "IntersectionObserver" in window) {
    new IntersectionObserver(function (entries) {
      document.body.classList.toggle("in-contact", entries[0].isIntersecting);
    }, { threshold: 0.15 }).observe(contactSection);
  }

  if (!form) return;
  var interest = form.querySelector("#f-interest");
  var submitBtn = form.querySelector('button[type="submit"]');
  var note = form.querySelector(".form-note");
  var msg = {
    sending: form.dataset.msgSending,
    ok: form.dataset.msgOk,
    err: form.dataset.msgErr,
    mailto: form.dataset.msgMailto,
    invalid: form.dataset.msgInvalid,
    contactInvalid: form.dataset.eContactInvalid
  };
  var defaultLabel = form.dataset.defaultLabel;
  var sending = false;

  function say(text, cls) { note.textContent = text; note.className = "form-note " + (cls || ""); }
  function syncLabel() {
    var opt = interest && interest.options[interest.selectedIndex];
    submitBtn.textContent = (opt && opt.dataset.submit) || defaultLabel;
  }

  /* Buttons with data-interest preselect the request type and keep it when the visitor arrives at the form. */
  if (interest) {
    document.addEventListener("click", function (e) {
      var el = e.target.closest("[data-interest]");
      if (!el) return;
      interest.value = el.getAttribute("data-interest");
      clearInvalid(interest.closest(".field"));
      syncLabel();
    });
    interest.addEventListener("change", syncLabel);
  }

  /* Validation with inline German (or Arabic) messages */
  function control(wrap) { return wrap.querySelector("input:not([type=hidden]), select, textarea"); }
  function setInvalid(wrap, text) {
    wrap.classList.add("invalid");
    wrap.querySelector(".err").textContent = text;
    control(wrap).setAttribute("aria-invalid", "true");
  }
  function clearInvalid(wrap) {
    if (!wrap) return;
    wrap.classList.remove("invalid");
    var e = wrap.querySelector(".err");
    if (e) e.textContent = "";
    var c = control(wrap);
    if (c) c.removeAttribute("aria-invalid");
  }
  function validContact(v) {
    v = v.trim();
    if (v.indexOf("@") > -1) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    return v.replace(/\D/g, "").length >= 6 && /^[+()\d\s\-\/.]+$/.test(v);
  }
  function validate() {
    var first = null;
    form.querySelectorAll(".field[data-error]").forEach(function (wrap) {
      var c = control(wrap);
      var value = c.type === "checkbox" ? c.checked : c.value.trim();
      var text = "";
      if (!value) text = wrap.dataset.error;
      else if (c.name === "contact" && !validContact(c.value)) text = msg.contactInvalid;
      if (text) { setInvalid(wrap, text); first = first || c; } else clearInvalid(wrap);
    });
    if (first) first.focus();
    return !first;
  }
  form.addEventListener("input", function (e) { clearInvalid(e.target.closest(".field")); });
  form.addEventListener("change", function (e) { clearInvalid(e.target.closest(".field")); });

  function collect() {
    var data = {};
    new FormData(form).forEach(function (v, k) { if (k !== "website") data[k] = v; });
    if (interest) {
      var opt = interest.options[interest.selectedIndex];
      data.interest_label = opt ? opt.textContent : "";
    }
    data.page = location.pathname;
    return data;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (sending) return;
    if (form.website && form.website.value) return; /* honeypot */
    if (!validate()) { say(msg.invalid, "err"); return; }
    var data = collect();
    var subject = form.dataset.subject + (data.interest_label ? ": " + data.interest_label : "");
    var endpoint = form.dataset.endpoint;

    /* No receiving service connected: open a prefilled e-mail and say so. No success message. */
    if (!endpoint) {
      var body = Object.keys(data).map(function (k) { return k + ": " + data[k]; }).join("\n");
      location.href = "mailto:" + form.dataset.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
      window.dataLayer.push({ event: "lead_mailto_opened", sector: data.sector || "", interest: data.interest || "" });
      say(msg.mailto, "info");
      return;
    }

    sending = true;
    submitBtn.disabled = true;
    submitBtn.setAttribute("aria-busy", "true");
    submitBtn.textContent = msg.sending;
    say(msg.sending, "info");
    data._subject = subject;
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 15000) : null;
    fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data), signal: ctrl ? ctrl.signal : undefined })
      .then(function (r) {
        if (!r.ok) throw new Error("http " + r.status);
        form.reset();
        if (interest) syncLabel();
        say(msg.ok, "ok");
        window.dataLayer.push({ event: "lead_submit", sector: data.sector || "", interest: data.interest || "" });
      })
      .catch(function () { say(msg.err, "err"); }) /* inputs stay as they are */
      .then(function () {
        if (timer) clearTimeout(timer);
        sending = false;
        submitBtn.disabled = false;
        submitBtn.removeAttribute("aria-busy");
        if (interest) syncLabel(); else submitBtn.textContent = defaultLabel;
      });
  });
})();
