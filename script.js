/* ==========================================================================
   DuoFine — script.js
   Ana sayfa, /tr/, blog, work, 404, hukuki sayfa ve delete-account tarafından
   yüklenir. CG hesap sayfaları (activate / email_change / password_change)
   bu dosyayı KULLANMAZ; onların kendi script'leri vardır ve değişmez.
   Bağımlılık yok. Her modül, ilgili eleman sayfada yoksa sessizce atlanır.
   ========================================================================== */
(function () {
  "use strict";

  /* --------------------------------------------------------------
     YAPILANDIRMA
     FORM_ENDPOINT tek satırda değiştirilebilir (FormSubmit, kayıt gerektirmez).
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
  function on(el, ev, fn, opts) { if (el) el.addEventListener(ev, fn, opts); }
  var reduceMotion = function () {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  };
  var hasIO = "IntersectionObserver" in window;

  /* ============================================================
     1. Rıza (Consent Mode v2) — varsayılan reddedilmiş.
        gtag.js yalnızca açık onaydan SONRA yüklenir.
        Panel: sayfa yüklendikten sonra ilk kaydırma/etkileşimde
        ya da 4 s sonra — LCP'yi ve ilk izlenimi bölmez.
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

    var opened = false;
    function open() {
      if (opened) return;
      opened = true;
      banner.classList.add("is-open");
      document.documentElement.classList.add("cookie-open");
    }
    function decide(value) {
      store.set(CONSENT_KEY, value);
      banner.classList.remove("is-open");
      document.documentElement.classList.remove("cookie-open");
      if (value === "granted") grantConsent();
    }
    on($("#cookie-accept"), "click", function () { decide("granted"); });
    on($("#cookie-reject"), "click", function () { decide("denied"); });

    function arm() {
      var t = setTimeout(open, 4000);
      var once = function () { clearTimeout(t); open(); };
      on(window, "scroll", once, { once: true, passive: true });
      on(document, "pointerdown", once, { once: true });
      on(document, "keydown", once, { once: true });
    }
    if (document.readyState === "complete") arm();
    else on(window, "load", arm, { once: true });
  }

  /* ============================================================
     2. Mobil navigasyon — gerçek <button>, klavye erişimli,
        açıkken sayfanın geri kalanı inert
     ============================================================ */
  function initNav() {
    var toggle = $(".nav-toggle");
    var list = $("#nav-list");
    if (!toggle || !list) return;
    var main = $("main");
    var footer = $(".site-footer");

    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      list.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
      if ("inert" in HTMLElement.prototype) {
        if (main) main.inert = open;
        if (footer) footer.inert = open;
      }
      if (open) {
        var first = $("a", list);
        if (first) first.focus({ preventScroll: true });
      }
    }
    var isOpen = function () { return toggle.getAttribute("aria-expanded") === "true"; };

    on(toggle, "click", function () { setOpen(!isOpen()); });
    $$("a", list).forEach(function (a) { on(a, "click", function () { setOpen(false); }); });

    on(document, "keydown", function (e) {
      if (!isOpen()) return;
      if (e.key === "Escape") { setOpen(false); toggle.focus(); return; }
      if (e.key === "Tab") {
        // odak menü ile düğme arasında döner
        var items = $$("a", list).concat([toggle]);
        var i = items.indexOf(document.activeElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); items[items.length - 1].focus(); }
        else if (!e.shiftKey && i === items.length - 1) { e.preventDefault(); items[0].focus(); }
      }
    });
    on(document, "click", function (e) {
      if (isOpen() && !list.contains(e.target) && !toggle.contains(e.target)) setOpen(false);
    });
    if (window.matchMedia) {
      var mq = window.matchMedia("(min-width: 761px)");
      var sync = function (m) { if (m.matches && isOpen()) setOpen(false); };
      if (mq.addEventListener) mq.addEventListener("change", sync);
      else if (mq.addListener) mq.addListener(sync);
    }
  }

  /* ============================================================
     3. Scroll'a bağlı durumlar — dinleyici yok, IntersectionObserver
        header gölgesi · yukarı çık (footer'da park eder) · mobil CTA
     ============================================================ */
  function initScrollState() {
    var header = $(".site-header");
    var toTop = $(".to-top");
    var sentinel = $("#top-sentinel");
    var hero = $(".hero, .case-hero, .article-head");
    var footer = $(".site-footer");
    var sticky = $(".sticky-cta");
    var contact = $("#contact");

    if (header && sentinel && hasIO) {
      new IntersectionObserver(function (entries) {
        header.classList.toggle("is-stuck", !entries[0].isIntersecting);
      }).observe(sentinel);
    }
    if (toTop) {
      if (hasIO) {
        var anchor = hero || sentinel;
        if (anchor) {
          new IntersectionObserver(function (entries) {
            toTop.classList.toggle("is-visible", !entries[0].isIntersecting);
          }).observe(anchor);
        }
        if (footer) {
          new IntersectionObserver(function (entries) {
            toTop.classList.toggle("is-parked", entries[0].isIntersecting);
          }, { rootMargin: "0px 0px -40px 0px" }).observe(footer);
        }
      }
      on(toTop, "click", function () {
        window.scrollTo({ top: 0, behavior: reduceMotion() ? "auto" : "smooth" });
        var skip = $(".skip-link");
        if (skip) skip.focus({ preventScroll: true });
      });
    }
    if (sticky && hero && hasIO) {
      var heroOut = false, contactIn = false, footerIn = false;
      var update = function () { sticky.classList.toggle("is-visible", heroOut && !contactIn && !footerIn); };
      new IntersectionObserver(function (entries) { heroOut = !entries[0].isIntersecting; update(); }).observe(hero);
      if (contact) new IntersectionObserver(function (entries) { contactIn = entries[0].isIntersecting; update(); }, { threshold: 0.15 }).observe(contact);
      if (footer) new IntersectionObserver(function (entries) { footerIn = entries[0].isIntersecting; update(); }).observe(footer);
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
    if (!hasIO) { showAll(); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
    all.forEach(function (el) { io.observe(el); });
    // Emniyet ağı: gözlemci tetiklenmezse içerik kalıcı olarak görünmez kalmasın.
    setTimeout(showAll, 4000);
  }

  function initSpy() {
    if (!hasIO) return;
    var links = $$("[data-spy]");
    if (!links.length) return;
    var targets = links.map(function (l) { return document.getElementById(l.getAttribute("data-spy")); }).filter(Boolean);
    if (!targets.length) return;
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
    targets.forEach(function (t) { spy.observe(t); });
  }

  /* ============================================================
     5. Kanıt şeridi — sayaçlar ve karşılaştırma çubukları
     ============================================================ */
  function initCounters() {
    var nums = $$("[data-count]");
    var compare = $(".proof-compare");
    if (!nums.length && !compare) return;

    function run(el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var decimals = parseInt(el.getAttribute("data-decimals") || "0", 10);
      if (isNaN(target)) return;
      if (reduceMotion() || !("requestAnimationFrame" in window)) { el.textContent = target.toFixed(decimals); return; }
      var start = null, dur = 900;
      function frame(ts) {
        if (start === null) start = ts;
        var p = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(frame);
    }
    if (!hasIO) { nums.forEach(run); if (compare) compare.classList.add("is-visible"); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        if (e.target === compare) compare.classList.add("is-visible");
        else run(e.target);
      });
    }, { threshold: 0.15 });
    nums.forEach(function (n) { io.observe(n); });
    if (compare) io.observe(compare);
  }

  /* ============================================================
     6. İletişim formu — gerçek doğrulama, gerçek hata bildirimi
        Metinler form üzerindeki data-* ile dile göre değişir.
     ============================================================ */
  var RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  function msg(form, key, fallback) {
    var v = form.getAttribute("data-msg-" + key);
    return v || fallback;
  }

  function validate(form, field) {
    var input = $("input, textarea, select", field);
    var err = $(".field-error", field);
    if (!input || !err) return true;
    if (!input.hasAttribute("required") && !input.value) { err.textContent = ""; input.removeAttribute("aria-invalid"); return true; }
    var v = (input.value || "").trim();
    var m = "";
    if (!v && input.hasAttribute("required")) {
      m = msg(form, "required", "This field is required.");
    } else if (input.type === "email" && !RE_EMAIL.test(v)) {
      m = msg(form, "email", "Enter a valid email address (e.g. name@company.com).");
    } else if (input.type === "url" && v && !/^https?:\/\/\S+\.\S+/.test(v)) {
      m = msg(form, "url", "Enter a full address starting with https://");
    } else if (input.tagName === "TEXTAREA" && v.length < 10) {
      m = msg(form, "short", "Add a little more detail — at least 10 characters.");
    }
    err.textContent = m;
    if (m) input.setAttribute("aria-invalid", "true"); else input.removeAttribute("aria-invalid");
    return !m;
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
    var fields = $$(".field", form).filter(function (f) { return $(".field-error", f); });

    fields.forEach(function (f) {
      var input = $("input, textarea, select", f);
      if (!input) return;
      on(input, "blur", function () { validate(form, f); });
      on(input, "input", function () {
        if (input.getAttribute("aria-invalid") === "true") validate(form, f);
      });
    });

    on(form, "submit", function (e) {
      e.preventDefault();
      status.className = "form-status";
      status.textContent = "";

      var ok = fields.map(function (f) { return validate(form, f); }).every(Boolean);
      if (!ok) {
        var bad = $("[aria-invalid=true]", form);
        if (bad) bad.focus();
        return;
      }

      var needs = $$("input[name=needs]:checked", form).map(function (c) { return c.value; }).join(", ");
      var data = {
        name: $("#name").value.trim(),
        email: $("#email").value.trim(),
        message: $("#message").value.trim(),
        needs: needs || "—",
        budget: ($("#budget") && $("#budget").value) || "—",
        timeline: ($("#timeline") && $("#timeline").value) || "—",
        link: ($("#link") && $("#link").value.trim()) || "—",
        page: location.pathname,
        _subject: "New enquiry from duofine.com" + (needs ? " — " + needs : ""),
        _template: "table",
        _captcha: "false",
        _honey: $("#company").value          // bot tuzağı
      };
      if (data._honey) return;               // sessizce yut

      button.disabled = true;
      var label = button.textContent;
      button.textContent = msg(form, "sending", "Sending…");

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
          if (window.gtag && gaLoaded) gtag("event", "generate_lead", { needs: needs || "unspecified" });
        })
        .catch(function (err) {
          button.disabled = false;
          button.textContent = label;
          if (window.console && console.warn) {
            console.warn("[DuoFine] Contact form could not send:", err.message);
          }
          var tpl = msg(form, "error",
            "Something went wrong on our side and the message was not sent. Please email {link} instead — the link opens a draft with everything you just wrote, so nothing is lost.");
          status.className = "form-status is-error";
          status.innerHTML = tpl.replace("{link}", "<a href=\"" + mailtoFallback(data) + "\">" + CONTACT_EMAIL + "</a>");
        });
    });
  }

  /* ============================================================
     7. Blog — kopyala düğmeleri, okuma ilerlemesi, TOC vurgusu
     ============================================================ */
  function initCode() {
    var blocks = $$(".code");
    if (!blocks.length) return;
    var canCopy = !!(navigator.clipboard && navigator.clipboard.writeText);
    blocks.forEach(function (block) {
      var btn = $(".copy-btn", block);
      var pre = $("pre", block);
      if (!btn || !pre) return;
      if (!canCopy) { btn.hidden = true; return; }
      var label = btn.textContent;
      on(btn, "click", function () {
        navigator.clipboard.writeText(pre.textContent).then(function () {
          btn.textContent = btn.getAttribute("data-done") || "Copied";
          btn.classList.add("is-done");
          setTimeout(function () { btn.textContent = label; btn.classList.remove("is-done"); }, 1600);
        });
      });
    });
  }

  function initProgress() {
    var bar = $(".progress span");
    var article = $(".article-body");
    if (!bar || !article) return;
    var ticking = false;
    function update() {
      ticking = false;
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      bar.style.transform = "scaleX(" + p.toFixed(4) + ")";
    }
    on(window, "scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    on(window, "resize", update);
    update();
  }

  function initToc() {
    if (!hasIO) return;
    var links = $$(".toc a[href^='#']");
    if (!links.length) return;
    var heads = links.map(function (l) { return document.getElementById(decodeURIComponent(l.getAttribute("href").slice(1))); }).filter(Boolean);
    if (!heads.length) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (l) {
          if (l.getAttribute("href") === "#" + e.target.id) l.setAttribute("aria-current", "true");
          else l.removeAttribute("aria-current");
        });
      });
    }, { rootMargin: "-20% 0px -70% 0px" });
    heads.forEach(function (h) { io.observe(h); });
  }

  /* ============================================================
     8. 404 — "kırık bağlantıyı bildir" adresi
     ============================================================ */
  function initReport() {
    var a = $("[data-report-link]");
    if (!a) return;
    var subject = a.getAttribute("data-subject") || "Broken link on duofine.com";
    a.href = "mailto:" + CONTACT_EMAIL + "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(location.href + (document.referrer ? "\n\nfrom: " + document.referrer : ""));
  }

  /* ============================================================
     Başlat — prerender sırasında analitik/rıza çalışmasın
     ============================================================ */
  function boot() {
    initNav();
    initScrollState();
    initReveal();
    initSpy();
    initCounters();
    initForm();
    initCode();
    initProgress();
    initToc();
    initReport();
    if (document.prerendering) {
      document.addEventListener("prerenderingchange", initConsent, { once: true });
    } else {
      initConsent();
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
