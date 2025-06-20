document.addEventListener("DOMContentLoaded", () => {
    // --- Initializations ---
    const DOMElements = {
        html: document.documentElement,
        themeToggle: document.getElementById('theme-toggle'),
        hamburger: document.querySelector(".hamburger"),
        navMenu: document.querySelector(".nav-menu"),
        header: document.querySelector('.main-header'),
        backToTopBtn: document.querySelector('.back-to-top-btn'),
        heroContent: document.querySelector('.hero-content'),
        sections: document.querySelectorAll('[data-section]'),
        navLinks: document.querySelectorAll('[data-link]'),
        cookieBanner: document.getElementById('cookie-banner'),
        cookieAcceptBtn: document.getElementById('cookie-accept-btn'),
        tiltCards: document.querySelectorAll('.value-card'),
        contactForm: document.getElementById('contact-form'),
        formSuccessMessage: document.getElementById('form-success-message')
    };

    // --- Theme (Dark/Light Mode) ---
    const savedTheme = localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    DOMElements.html.setAttribute('data-theme', savedTheme);
    DOMElements.themeToggle.checked = savedTheme === 'dark';
    DOMElements.themeToggle.addEventListener('change', () => {
        const newTheme = DOMElements.themeToggle.checked ? 'dark' : 'light';
        DOMElements.html.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

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

    // --- AJAX Form Submission ---
    DOMElements.contactForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch(this.getAttribute('action'), {
            method: 'POST',
            headers: { 'Accept': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }).then(() => {
            this.style.opacity = '0';
            this.style.pointerEvents = 'none';
            DOMElements.formSuccessMessage.classList.remove('hidden');
        }).catch(error => alert('An error occurred. Please try again.'));
    });

    // --- Hamburger Menu ---
    DOMElements.hamburger?.addEventListener("click", () => DOMElements.navMenu.classList.toggle("active"));
    DOMElements.navLinks?.forEach(n => n.addEventListener("click", () => DOMElements.navMenu.classList.remove("active")));

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
                DOMElements.navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('data-link') === currentSectionId));
            }
        });
    }, { rootMargin: "-50% 0px -50% 0px" });
    DOMElements.sections?.forEach(section => sectionObserver.observe(section));

    // --- 3D Tilt Effect for Cards ---
    DOMElements.tiltCards?.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const { width, height, left, top } = rect;
            const x = e.clientX - left;
            const y = e.clientY - top;
            const rotateX = (y / height - 0.5) * -15;
            const rotateY = (x / width - 0.5) * 15;
            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
        });
    });
});