document.addEventListener("DOMContentLoaded", () => {
    // --- Hamburger Menu ---
    const hamburger = document.querySelector(".hamburger");
    const navMenu = document.querySelector(".nav-menu");
    hamburger.addEventListener("click", () => {
        hamburger.classList.toggle("active");
        navMenu.classList.toggle("active");
    });
    document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navMenu.classList.remove("active");
    }));

    // --- Sticky Header & Back to Top Button ---
    const header = document.querySelector('.main-header');
    const backToTopBtn = document.querySelector('.back-to-top-btn');
    window.addEventListener('scroll', () => {
        // Sticky Header
        if (window.scrollY > 50) {
            header.classList.add('sticky');
        } else {
            header.classList.remove('sticky');
        }
        // Back to Top Button
        if (window.scrollY > 300) {
            backToTopBtn.classList.add('show');
        } else {
            backToTopBtn.classList.remove('show');
        }
    });

    // --- Fade-in Scroll Animations ---
    const fadeInObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is visible
    document.querySelectorAll('.hidden').forEach((el) => fadeInObserver.observe(el));
    
    // --- Active Nav Link Highlighting on Scroll ---
    const sections = document.querySelectorAll('[data-section]');
    const navLinks = document.querySelectorAll('[data-link]');
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('data-link') === entry.target.getAttribute('data-section'));
                });
            }
        });
    }, { rootMargin: "-50% 0px -50% 0px" }); // Activate when section is in the middle of the viewport
    sections.forEach(section => sectionObserver.observe(section));
});