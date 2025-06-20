// --- Hamburger Menu Functionality ---

// Select the hamburger menu icon and the navigation menu
const hamburger = document.querySelector(".hamburger");
const navMenu = document.querySelector(".nav-menu");

// Add a 'click' event listener to the hamburger icon
hamburger.addEventListener("click", () => {
    // Toggle the 'active' class on both the hamburger and the menu
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
});

// Close the menu when a navigation link is clicked
document.querySelectorAll(".nav-link").forEach(n => n.addEventListener("click", () => {
    hamburger.classList.remove("active");
    navMenu.classList.remove("active");
}));


// --- Smooth Scrolling Functionality ---

// Select all links with href starting with '#'
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Prevent the default jump-to-anchor behavior
        e.preventDefault();

        // Find the element to scroll to and scroll smoothly
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});