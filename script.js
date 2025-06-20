document.addEventListener("DOMContentLoaded", () => {
    // --- Initializations ---
    const allSelectors = {
        hamburger: ".hamburger", navMenu: ".nav-menu", header: '.main-header',
        backToTopBtn: '.back-to-top-btn', heroContent: '.hero-content',
        sections: '[data-section]', navLinks: '[data-link]',
        cookieBanner: '#cookie-banner', cookieAcceptBtn: '#cookie-accept-btn',
        tiltCards: '.value-card'
    };
    const DOMElements = Object.fromEntries(
        Object.entries(allSelectors).map(([key, selector]) => [key, key.endsWith('s') ? document.querySelectorAll(selector) : document.querySelector(selector)])
    );

    // --- Hero Content Animation ---
    setTimeout(() => DOMElements.heroContent?.classList.add('animate-in'), 300);

    // --- Cookie Consent ---
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => DOMElements.cookieBanner?.classList.add('show'), 2000);
    }
    DOMElements.cookieAcceptBtn?.addEventListener('click', () => {
        DOMElements.cookieBanner.classList.remove('show');
        localStorage.setItem('cookieConsent', 'true');
    });

    // --- Hamburger Menu ---
    DOMElements.hamburger?.addEventListener("click", () => {
        DOMElements.hamburger.classList.toggle("active");
        DOMElements.navMenu.classList.toggle("active");
    });
    DOMElements.navLinks?.forEach(n => n.addEventListener("click", () => {
        DOMElements.hamburger.classList.remove("active");
        DOMElements.navMenu.classList.remove("active");
    }));

    // --- Scroll-based Behaviors ---
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        DOMElements.header?.classList.toggle('sticky', scrollY > 50);
        DOMElements.backToTopBtn?.classList.toggle('show', scrollY > 300);
    });

    // --- Intersection Observers ---
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('show'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.hidden').forEach((el) => fadeInObserver.observe(el));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const section = entry.target;
                const newTitle = section.getAttribute('data-title');
                document.title = `${newTitle} | DuoFine`;
                const currentSectionId = section.getAttribute('data-section');
                DOMElements.navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-link') === currentSectionId);
                });
            }
        });
    }, { rootMargin: "-50% 0px -50% 0px" });
    DOMElements.sections?.forEach(section => sectionObserver.observe(section));

    // --- 3D Tilt Effect for Cards ---
    DOMElements.tiltCards?.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const { width, height } = rect;
            const rotateX = (y / height - 0.5) * -20;
            const rotateY = (x / width - 0.5) * 20;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0)';
        });
    });
});