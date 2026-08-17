(function () {
    var STORAGE_KEY = 'cg_legal_lang';
    var DEFAULT_LANG = 'en';
    var flagButtons = document.querySelectorAll('.legal-lang-flag');
    var blocks = document.querySelectorAll('.legal-lang-block');

    function availableLangs() {
        return Array.prototype.map.call(blocks, function (b) { return b.getAttribute('data-lang'); });
    }

    function showLang(lang) {
        var langs = availableLangs();
        if (langs.indexOf(lang) === -1) lang = DEFAULT_LANG;

        var activeBlock = null;
        Array.prototype.forEach.call(blocks, function (b) {
            var isMatch = b.getAttribute('data-lang') === lang;
            b.hidden = !isMatch;
            if (isMatch) activeBlock = b;
        });

        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        Array.prototype.forEach.call(flagButtons, function (btn) {
            var isActive = btn.getAttribute('data-lang') === lang;
            btn.classList.toggle('is-active', isActive);
            btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });
        if (activeBlock) {
            var title = activeBlock.getAttribute('data-title');
            if (title) document.title = title;
        }
        try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* private mode etc. */ }
    }

    function getInitialLang() {
        var params = new URLSearchParams(window.location.search);
        var fromQuery = params.get('lang');
        if (fromQuery) return fromQuery;

        try {
            var stored = localStorage.getItem(STORAGE_KEY);
            if (stored) return stored;
        } catch (e) { /* private mode etc. */ }

        return DEFAULT_LANG;
    }

    Array.prototype.forEach.call(flagButtons, function (btn) {
        btn.addEventListener('click', function () {
            var lang = btn.getAttribute('data-lang');
            showLang(lang);
            var url = new URL(window.location.href);
            url.searchParams.set('lang', lang);
            window.history.replaceState({}, '', url);
        });
    });

    showLang(getInitialLang());
})();
