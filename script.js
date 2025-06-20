document.addEventListener("DOMContentLoaded", () => {
    // --- Initializations ---
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    const header = document.querySelector('.main-header');
    const backToTopBtn = document.querySelector('.back-to-top-btn');
    const heroContent = document.querySelector('.hero-content');
    const sections = document.querySelectorAll('[data-section]');
    const navLinks = document.querySelectorAll('[data-link]');
    const cookieBanner = document.getElementById('cookie-banner');
    const cookieAcceptBtn = document.getElementById('cookie-accept-btn');

    // --- Hero Content Animation ---
    setTimeout(() => {
        heroContent.classList.add('animate-in');
    }, 300);

    // --- Cookie Consent ---
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => {
            cookieBanner.classList.add('show');
        }, 2000);
    }
    cookieAcceptBtn.addEventListener('click', () => {
        cookieBanner.classList.remove('show');
        localStorage.setItem('cookieConsent', 'true');
    });

    // --- Hamburger Menu ---
    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    });
    navLinks.forEach(n => n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
    }));

    // --- Scroll-based Behaviors ---
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        header.classList.toggle('sticky', scrollY > 50);
        backToTopBtn.classList.toggle('show', scrollY > 300);
    });

    // --- Intersection Observers ---
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) { entry.target.classList.add('show'); }
        });
    }, { threshold: 0.1 });
    document.querySelectorAll('.hidden').forEach((el) => fadeInObserver.observe(el));

    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const currentSection = entry.target.getAttribute('data-section');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-link') === currentSection);
                });
            }
        });
    }, { rootMargin: "-50% 0px -50% 0px" });
    sections.forEach(section => sectionObserver.observe(section));
});