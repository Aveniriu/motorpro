// Navigation and smooth scrolling functionality
class Navigation {
    constructor() {
        this.currentSection = 'hero';
        this.navLinks = document.querySelectorAll('.nav-link');
        this.sections = document.querySelectorAll('section');
        this.navbar = document.querySelector('.header');
        this.init();
    }

    init() {
        this.setupSmoothScroll();
        this.setupScrollSpy();
        this.setupNavbarBackground();
        this.setupMobileMenu();
    }

    setupSmoothScroll() {
        // Smooth scroll for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = anchor.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    const headerHeight = this.navbar.offsetHeight;
                    const targetPosition = targetElement.offsetTop - headerHeight;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });

                    // Close mobile menu if open
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    const navbarCollapse = document.querySelector('.navbar-collapse');
                    if (navbarCollapse.classList.contains('show')) {
                        navbarToggler.click();
                    }
                }
            });
        });
    }

    setupScrollSpy() {
        // Update active nav link based on scroll position
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.currentSection = entry.target.id;
                    this.updateActiveNavLink();
                }
            });
        }, observerOptions);

        this.sections.forEach(section => {
            observer.observe(section);
        });
    }

    updateActiveNavLink() {
        this.navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${this.currentSection}`) {
                link.classList.add('active');
            }
        });
    }

    setupNavbarBackground() {
        // Add background to navbar on scroll
        window.addEventListener('scroll', () => {
            if (window.scrollY > 100) {
                this.navbar.style.background = 'rgba(44, 62, 80, 0.98)';
                this.navbar.style.boxShadow = '0 2px 20px rgba(0,0,0,0.1)';
            } else {
                this.navbar.style.background = 'rgba(44, 62, 80, 0.95)';
                this.navbar.style.boxShadow = 'none';
            }
        });
    }

    setupMobileMenu() {
        // Close mobile menu when clicking on a link
        const navLinks = document.querySelectorAll('.nav-link');
        const navbarCollapse = document.querySelector('.navbar-collapse');
        
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navbarCollapse.classList.contains('show')) {
                    const navbarToggler = document.querySelector('.navbar-toggler');
                    navbarToggler.click();
                }
            });
        });
    }

    // Method to scroll to specific section
    scrollToSection(sectionId) {
        const targetElement = document.querySelector(sectionId);
        if (targetElement) {
            const headerHeight = this.navbar.offsetHeight;
            const targetPosition = targetElement.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }
}

// Initialize navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.motorproNavigation = new Navigation();
});