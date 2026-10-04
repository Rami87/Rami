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

  /* Mobile menu: a full-screen panel that wipes up; the button label switches between Menu and Close. */
  var btn = document.querySelector(".menu-btn");
  var wipe = document.getElementById("wipe");
  function setMenu(open, focusBtn) {
    if (!wipe || !btn) return;
    wipe.classList.toggle("open", open);
    wipe.setAttribute("aria-hidden", open ? "false" : "true");
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", open ? "true" : "false");
    btn.textContent = open ? btn.dataset.close : btn.dataset.open;
    if (!open && focusBtn) btn.focus();
  }
  if (btn && wipe) {
    btn.addEventListener("click", function () { setMenu(!wipe.classList.contains("open")); });
    wipe.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && wipe.classList.contains("open")) setMenu(false, true);
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

  /* Circle carousel (Care packages): the card nearest the centre is active; it sets the section colour and the curved title. */
  function initStage(stage) {
    var stageSec = stage.closest(".svc-stage");
    if (!stageSec) return;
    var track = stage.querySelector(".track");
    var cards = [].slice.call(track.children);
    var arc = stage.querySelector(".stage-arc");
    var arcPath = arc.querySelector("path");
    var arcText = arc.querySelector("textPath");
    var chips = [].slice.call(stage.querySelectorAll(".chip"));
    var current = -1;
    var smooth = reduce ? "auto" : "smooth";
    var layoutArc = function () {
      var D = cards[0].querySelector(".disc").offsetWidth, r = D / 2 + 30, w = 2 * r + 120, cy = r + 34;
      arc.setAttribute("width", w);
      arc.setAttribute("height", cy + 6);
      arc.setAttribute("viewBox", "0 0 " + w + " " + (cy + 6));
      arcPath.setAttribute("d", "M " + (w / 2 - r) + " " + cy + " A " + r + " " + r + " 0 0 1 " + (w / 2 + r) + " " + cy);
      arc.style.top = (56 + D / 2 - cy) + "px"; /* the arc is centred on the active disc */
    };
    var nearest = function () {
      var box = track.getBoundingClientRect(), mid = box.left + box.width / 2, best = 0, bestD = Infinity;
      cards.forEach(function (el, i) {
        var b = el.getBoundingClientRect(), d = Math.abs(b.left + b.width / 2 - mid);
        if (d < bestD) { bestD = d; best = i; }
      });
      return best;
    };
    var activate = function (i) {
      if (i === current) return;
      var before = current < 0 ? -1 : +cards[current].dataset.g;
      current = i;
      cards.forEach(function (el, k) { el.classList.toggle("is-active", k === i); });
      var g = +cards[i].dataset.g;
      stageSec.style.setProperty("--stage-bg", cards[i].dataset.color);
      chips.forEach(function (c, k) { c.setAttribute("aria-current", k === g ? "true" : "false"); });
      if (g !== before) {
        arc.classList.add("swap");
        setTimeout(function () { arcText.textContent = cards[i].dataset.gname; arc.classList.remove("swap"); }, reduce ? 0 : 220);
      }
    };
    var goTo = function (i) {
      i = Math.max(0, Math.min(cards.length - 1, i));
      cards[i].scrollIntoView({ behavior: smooth, inline: "center", block: "nearest" });
    };
    var queued = false;
    track.addEventListener("scroll", function () {
      if (queued) return;
      queued = true;
      requestAnimationFrame(function () { queued = false; activate(nearest()); });
    });
    stage.querySelector(".stage-prev").addEventListener("click", function () { goTo(current - 1); });
    stage.querySelector(".stage-next").addEventListener("click", function () { goTo(current + 1); });
    chips.forEach(function (c, k) {
      c.addEventListener("click", function () {
        goTo(cards.findIndex(function (el) { return +el.dataset.g === k; }));
      });
    });
    track.addEventListener("keydown", function (e) {
      var rtl = doc.lang === "ar" || doc.dir === "rtl";
      if (e.key === "ArrowRight") { goTo(current + (rtl ? -1 : 1)); e.preventDefault(); }
      if (e.key === "ArrowLeft") { goTo(current + (rtl ? 1 : -1)); e.preventDefault(); }
    });
    track.addEventListener("focusin", function (e) {
      var card = e.target.closest(".card");
      if (card) goTo(cards.indexOf(card));
    });
    window.addEventListener("resize", layoutArc);
    layoutArc();
    arcText.textContent = cards[0].dataset.gname;
    activate(nearest());
  }
  document.querySelectorAll(".stage").forEach(initStage);

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
