document.addEventListener("DOMContentLoaded", () => {
    // --- Initializations ---
    const DOMElements = {
        hamburger: document.querySelector(".hamburger"),
        navMenu: document.querySelector(".nav-menu"),
        header: document.querySelector('.main-header'),
        backToTopBtn: document.querySelector('.back-to-top-btn'),
        typingHeadline: document.getElementById('typing-headline'),
        heroContent: document.querySelector('.hero-content'),
        sections: document.querySelectorAll('[data-section]'),
        navLinks: document.querySelectorAll('[data-link]'),
        cookieBanner: document.getElementById('cookie-banner'),
        cookieAcceptBtn: document.getElementById('cookie-accept-btn'),
        contactForm: document.getElementById('contact-form'),
        formSuccessMessage: document.getElementById('form-success-message')
    };

    // --- Initial State Setup ---
    DOMElements.formSuccessMessage.style.display = 'none';

    // --- Typing Animation ---
    const textToType = "Building the Future, Together.";
    let i = 0;
    function typeWriter() {
        if (DOMElements.typingHeadline && i < textToType.length) {
            DOMElements.typingHeadline.innerHTML += textToType.charAt(i);
            i++;
            setTimeout(typeWriter, 80);
        }
    }
    setTimeout(typeWriter, 500);
    setTimeout(() => DOMElements.heroContent?.classList.add('animate-in'), 300);

    // --- Cookie Consent ---
    if (!localStorage.getItem('cookieConsent')) {
        setTimeout(() => DOMElements.cookieBanner?.classList.add('show'), 2000);
    }
    DOMElements.cookieAcceptBtn?.addEventListener('click', () => {
        DOMElements.cookieBanner.classList.remove('show');
        localStorage.setItem('cookieConsent', 'true');
    });

    // --- AJAX Form Submission (Temporarily Disabled for Testing) ---
    /*
    DOMElements.contactForm?.addEventListener('submit', function(e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch(this.getAttribute('action'), {
            method: 'POST',
            headers: { 'Accept': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams(formData).toString()
        }).then(() => {
            this.style.display = 'none';
            DOMElements.formSuccessMessage.style.display = 'block';
        }).catch(error => alert('An error occurred. Please try again.'));
    });
    */

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
});