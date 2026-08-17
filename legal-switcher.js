(function () {
    var STORAGE_KEY = 'cg_legal_lang';
    var select = document.getElementById('legal-lang-select');
    var blocks = document.querySelectorAll('.legal-lang-block');

    function availableLangs() {
        return Array.prototype.map.call(blocks, function (b) { return b.getAttribute('data-lang'); });
    }

    function showLang(lang) {
        var langs = availableLangs();
        if (langs.indexOf(lang) === -1) lang = 'en';

        var activeBlock = null;
        Array.prototype.forEach.call(blocks, function (b) {
            var isMatch = b.getAttribute('data-lang') === lang;
            b.hidden = !isMatch;
            if (isMatch) activeBlock = b;
        });

        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr');
        if (select) select.value = lang;
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

        var nav = (navigator.language || 'en').split('-')[0];
        return nav;
    }

    if (select) {
        select.addEventListener('change', function () {
            showLang(select.value);
            var url = new URL(window.location.href);
            url.searchParams.set('lang', select.value);
            window.history.replaceState({}, '', url);
        });
    }

    showLang(getInitialLang());
})();
