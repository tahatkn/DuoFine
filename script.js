/* ==========================================================================
   DuoFine — script.js
   Yalnızca index.html ve blog/* tarafından yüklenir.
   privacypolicy.html ve CG hesap sayfaları bu dosyayı kullanmaz.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------
     YAPILANDIRMA
     FORM_ENDPOINT tek satırda değiştirilebilir. Varsayılan FormSubmit
     kayıt gerektirmez; ilk gerçek gönderimde info@duofine.com adresine
     bir onay e-postası gelir, oradaki linke bir kez tıklanması gerekir.
     Formspree / Cloudflare Worker'a geçmek için yalnızca bu satır değişir.
     -------------------------------------------------------------- */
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/info@duofine.com";
  var CONTACT_EMAIL = "info@duofine.com";
  var GA_ID = "G-31K97WJQ23";
  var CONSENT_KEY = "df_consent_v2";

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ============================================================
     1. Rıza (Consent Mode v2) — varsayılan reddedilmiş.
        gtag.js yalnızca açık onaydan SONRA yüklenir.
     ============================================================ */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  gtag("consent", "default", {
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    analytics_storage: "denied",
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500
  });

  var gaLoaded = false;
  function loadAnalytics() {
    if (gaLoaded) return;
    gaLoaded = true;
    gtag("js", new Date());
    gtag("config", GA_ID, { anonymize_ip: true });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
  }

  function grantConsent() {
    gtag("consent", "update", { analytics_storage: "granted" });
    loadAnalytics();
  }

  function initConsent() {
    var banner = $("#cookie-banner");
    var choice = store.get(CONSENT_KEY);

    if (choice === "granted") { grantConsent(); return; }
    if (choice === "denied") { return; }
    if (!banner) return;

    var timer = setTimeout(function () { banner.classList.add("is-open"); }, 1200);

    function decide(value) {
      clearTimeout(timer);
      store.set(CONSENT_KEY, value);
      banner.classList.remove("is-open");
      if (value === "granted") grantConsent();
    }
    on($("#cookie-accept"), "click", function () { decide("granted"); });
    on($("#cookie-reject"), "click", function () { decide("denied"); });
  }

  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }

  /* ============================================================
     2. Mobil navigasyon — gerçek <button>, klavye erişimli
     ============================================================ */
  function initNav() {
    var toggle = $(".nav-toggle");
    var list = $("#nav-list");
    if (!toggle || !list) return;

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      list.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }
    var isOpen = function () { return toggle.getAttribute("aria-expanded") === "true"; };

    on(toggle, "click", function () { setOpen(!isOpen()); });
    $$("a", list).forEach(function (a) { on(a, "click", function () { setOpen(false); }); });

    on(document, "keydown", function (e) {
      if (e.key === "Escape" && isOpen()) { setOpen(false); toggle.focus(); }
    });
    on(document, "click", function (e) {
      if (isOpen() && !list.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    // Menü masaüstü genişliğinde açık kalmasın
    if (window.matchMedia) {
      var mq = window.matchMedia("(min-width: 761px)");
      var sync = function (m) { if (m.matches) setOpen(false); };
      if (mq.addEventListener) mq.addEventListener("change", sync);
      else if (mq.addListener) mq.addListener(sync);
    }
  }

  /* ============================================================
     3. Scroll'a bağlı durumlar — dinleyici yok, IntersectionObserver
     ============================================================ */
  function initScrollState() {
    var header = $(".site-header");
    var toTop = $(".to-top");
    var sentinel = $("#top-sentinel");
    var hero = $(".hero");

    if (header && sentinel && "IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        header.classList.toggle("is-stuck", !entries[0].isIntersecting);
      }).observe(sentinel);
    }
    if (toTop && "IntersectionObserver" in window) {
      var anchor = hero || sentinel;
      if (anchor) {
        new IntersectionObserver(function (entries) {
          toTop.classList.toggle("is-visible", !entries[0].isIntersecting);
        }).observe(anchor);
      }
      on(toTop, "click", function () {
        var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
        var skip = $(".skip-link");
        if (skip) skip.focus({ preventScroll: true });
      });
    }
  }

  /* ============================================================
     4. Görünürlük animasyonu + navigasyon vurgusu
        (document.title'a DOKUNULMAZ — sekme başlığı sabit kalır)
     ============================================================ */
  function initReveal() {
    var all = $$(".reveal");
    if (!all.length) return;

    function showAll() { all.forEach(function (el) { el.classList.add("is-visible"); }); }

    if (!("IntersectionObserver" in window)) { showAll(); return; }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    all.forEach(function (el) { io.observe(el); });

    // Emniyet ağı: gözlemci herhangi bir nedenle tetiklenmezse (sekme arka planda
    // yüklendi, IO baskılandı, beklenmedik bir hata) içerik kalıcı olarak görünmez
    // kalmasın. Görünürlük asla yalnızca JS'in doğru çalışmasına bağlı olmamalı.
    setTimeout(showAll, 4000);
  }

  function initSpy() {
    if (!("IntersectionObserver" in window)) return;
    var links = $$("[data-spy]");
    if (!links.length) return;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var id = e.target.id;
        links.forEach(function (l) {
          if (l.getAttribute("data-spy") === id) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    links.forEach(function (l) {
      var t = document.getElementById(l.getAttribute("data-spy"));
      if (t) spy.observe(t);
    });
  }

  /* ============================================================
     5. İletişim formu — gerçek doğrulama, gerçek hata bildirimi
     ============================================================ */
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function validate(field) {
    var input = $("input, textarea", field);
    var err = $(".field-error", field);
    if (!input || !err) return true;
    var v = (input.value || "").trim();
    var msg = "";

    if (!v) {
      msg = input.dataset.labelRequired || "This field is required.";
    } else if (input.type === "email" && !RE_EMAIL.test(v)) {
      msg = "Enter a valid email address (e.g. name@company.com).";
    } else if (input.tagName === "TEXTAREA" && v.length < 10) {
      msg = "Add a little more detail — at least 10 characters.";
    }

    err.textContent = msg;
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    return !msg;
  }

  function mailtoFallback(data) {
    return "mailto:" + CONTACT_EMAIL +
      "?subject=" + encodeURIComponent("Website enquiry — " + (data.name || "")) +
      "&body=" + encodeURIComponent((data.message || "") + "\n\n— " + (data.name || "") + " <" + (data.email || "") + ">");
  }

  function initForm() {
    var form = $("#contact-form");
    if (!form) return;
    var status = $("#form-status");
    var done = $("#form-done");
    var button = $("button[type=submit]", form);
    var fields = $$(".field", form);

    fields.forEach(function (f) {
      var input = $("input, textarea", f);
      if (!input) return;
      on(input, "blur", function () { validate(f); });
      on(input, "input", function () {
        if (input.getAttribute("aria-invalid") === "true") validate(f);
      });
    });

    on(form, "submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      var ok = fields.map(validate).every(Boolean);
      if (!ok) {
        var bad = $("[aria-invalid=true]", form);
        if (bad) bad.focus();
        return;
      }

      var data = {
        name: $("#name").value.trim(),
        email: $("#email").value.trim(),
        message: $("#message").value.trim(),
        _subject: "New enquiry from duofine.com",
        _template: "table",
        _captcha: "false",
        _honey: $("#company").value          // bot tuzağı
      };
      if (data._honey) return;               // sessizce yut

      button.disabled = true;
      var label = button.textContent;
      button.textContent = "Sending…";

      fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var body = {};
            try { body = JSON.parse(text); } catch (err) {}
            if (!res.ok) throw new Error(body.message || ("HTTP " + res.status));
            // FormSubmit başarıyı success:"true" ile bildirir; aksi hâli hata say.
            if (body.success !== undefined && String(body.success) !== "true") {
              throw new Error(body.message || "The form service rejected the submission.");
            }
            return body;
          });
        })
        .then(function () {
          form.hidden = true;
          done.hidden = false;
          done.focus();
        })
        .catch(function (err) {
          button.disabled = false;
          button.textContent = label;
          status.className = "form-status is-error";
          status.innerHTML =
            "The message could not be sent (" +
            String(err.message).replace(/[<>&]/g, "") +
            "). Please email <a href=\"" + mailtoFallback(data) + "\">" + CONTACT_EMAIL + "</a> instead — " +
            "the link opens a pre-filled draft so nothing you wrote is lost.";
        });
    });
  }

  /* ============================================================
     Başlat
     ============================================================ */
  function boot() {
    initConsent();
    initNav();
    initScrollState();
    initReveal();
    initSpy();
    initForm();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
