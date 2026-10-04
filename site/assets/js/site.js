/* HORANiQ: menu, hero report animation, contact form, click tracking hooks. No third-party code, no cookies. */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.add("js");
  window.dataLayer = window.dataLayer || [];
  /* Optional cookieless analytics (Plausible, only when the build enabled it): forward the same events, without personal data. */
  var _push = window.dataLayer.push.bind(window.dataLayer);
  window.dataLayer.push = function (o) {
    try {
      if (o && o.event && typeof window.plausible === "function") {
        var props = {};
        Object.keys(o).forEach(function (k) { if (k !== "event") props[k] = String(o[k]); });
        window.plausible(o.event, { props: props });
      }
    } catch (e) { /* analytics must never break the page */ }
    return _push(o);
  };

  /* Mobile menu: the nav wipes up full screen (CSS); the button label switches between Menu and Close. */
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("nav");
  function setMenu(open, focusBtn) {
    if (!nav || !btn) return;
    nav.classList.toggle("open", open);
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? btn.dataset.close : btn.dataset.open;
    if (!open && focusBtn) btn.focus();
  }
  if (btn && nav) {
    btn.addEventListener("click", function () { setMenu(!nav.classList.contains("open")); });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) setMenu(false, true);
    });
    window.addEventListener("resize", function () { if (window.innerWidth > 1240) setMenu(false); });
  }

  /* Leistungen submenu: hover and keyboard focus open it via CSS; the toggle button serves touch and screen readers. */
  var subItems = document.querySelectorAll(".has-sub");
  function closeSubs(except) {
    subItems.forEach(function (item) {
      if (item === except) return;
      item.classList.remove("open");
      item.querySelector(".sub-toggle").setAttribute("aria-expanded", "false");
    });
  }
  subItems.forEach(function (item) {
    var toggle = item.querySelector(".sub-toggle");
    toggle.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      closeSubs(item);
    });
  });
  document.addEventListener("click", function (e) { if (!e.target.closest(".has-sub")) closeSubs(null); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var openItem = document.querySelector(".has-sub.open");
    if (openItem) { closeSubs(null); openItem.querySelector(".sub-toggle").focus(); }
  });

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
  var interestHint = form.querySelector("#interest-hint");
  function syncLabel() {
    var opt = interest && interest.options[interest.selectedIndex];
    submitBtn.textContent = (opt && opt.dataset.submit) || defaultLabel;
    if (interestHint) {
      var hint = (opt && opt.dataset.hint) || "";
      interestHint.textContent = hint;
      interestHint.hidden = !hint;
    }
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
    syncLabel();
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
