// Animations and interactive effects
class Animations {
    constructor() {
        this.animatedElements = new Set();
        this.init();
    }

    init() {
        this.setupScrollAnimations();
        this.setupHoverEffects();
        this.setupCounterAnimations();
        this.setupFormAnimations();
    }

    setupScrollAnimations() {
        // Animate elements on scroll
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -10% 0px',
            threshold: 0
        };

        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.animatedElements.has(entry.target)) {
                    this.animateElement(entry.target);
                    this.animatedElements.add(entry.target);
                }
            });
        }, observerOptions);

        // Observe all animate-able elements
        document.querySelectorAll('.problem-card, .tech-card, .team-card, .market-card').forEach(el => {
            animationObserver.observe(el);
        });
    }

    animateElement(element) {
        // Add animation class based on element type
        if (element.classList.contains('problem-card') || 
            element.classList.contains('tech-card') ||
            element.classList.contains('team-card')) {
            
            element.style.opacity = '0';
            element.style.transform = 'translateY(30px)';
            
            setTimeout(() => {
                element.style.transition = 'all 0.6s ease';
                element.style.opacity = '1';
                element.style.transform = 'translateY(0)';
            }, 100);
        }

        if (element.classList.contains('market-card')) {
            const valueElement = element.querySelector('.market-value');
            if (valueElement && !valueElement.dataset.animated) {
                this.animateCounter(valueElement);
                valueElement.dataset.animated = 'true';
            }
        }
    }

    animateCounter(element) {
        const targetText = element.textContent;
        const isPercentage = targetText.includes('%');
        const isCurrency = targetText.includes('руб') || targetText.includes('млрд');
        
        let numericValue;
        if (isPercentage) {
            numericValue = parseFloat(targetText);
        } else if (isCurrency) {
            // Extract numeric value from currency string
            const match = targetText.match(/[\d.,]+/);
            numericValue = match ? parseFloat(match[0].replace(',', '.')) : 0;
        } else {
            numericValue = parseFloat(targetText) || 0;
        }

        let current = 0;
        const increment = numericValue / 30;
        const duration = 1500;
        const stepTime = duration / 30;

        const timer = setInterval(() => {
            current += increment;
            if (current >= numericValue) {
                current = numericValue;
                clearInterval(timer);
            }
            
            if (isPercentage) {
                element.textContent = `${Math.round(current)}% в год`;
            } else if (isCurrency) {
                element.textContent = `${current.toFixed(1).replace('.', ',')} млрд рублей`;
            }
        }, stepTime);
    }

    setupHoverEffects() {
        // Enhanced hover effects for cards
        document.querySelectorAll('.problem-card, .tech-card, .team-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                card.style.transform = 'translateY(-10px) scale(1.02)';
            });
            
            card.addEventListener('mouseleave', () => {
                card.style.transform = 'translateY(0) scale(1)';
            });
        });

        // CTA button hover effect
        const ctaButton = document.querySelector('.cta-button');
        if (ctaButton) {
            ctaButton.addEventListener('mouseenter', () => {
                ctaButton.style.transform = 'translateY(-3px) scale(1.05)';
            });
            
            ctaButton.addEventListener('mouseleave', () => {
                ctaButton.style.transform = 'translateY(0) scale(1)';
            });
        }
    }

    setupCounterAnimations() {
        // Animate numbers in the competitor table on scroll
        const tableObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animateTableNumbers(entry.target);
                    tableObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        const competitorsTable = document.querySelector('#competitors .table');
        if (competitorsTable) {
            tableObserver.observe(competitorsTable);
        }
    }

    animateTableNumbers(table) {
        const cells = table.querySelectorAll('td');
        cells.forEach(cell => {
            const text = cell.textContent;
            if (/^\d+([.,]\d+)?$/.test(text)) {
                const number = parseFloat(text.replace(',', '.'));
                this.animateNumberCell(cell, number);
            }
        });
    }

    animateNumberCell(cell, targetNumber) {
        let current = 0;
        const increment = targetNumber / 20;
        const duration = 1000;
        const stepTime = duration / 20;

        const originalContent = cell.textContent;
        
        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNumber) {
                current = targetNumber;
                clearInterval(timer);
                cell.textContent = originalContent;
            } else {
                cell.textContent = Math.round(current);
            }
        }, stepTime);
    }

    setupFormAnimations() {
        // Form animations for future contact form
        const contactForm = document.querySelector('form');
        if (contactForm) {
            const inputs = contactForm.querySelectorAll('input, textarea, select');
            
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    input.parentElement.classList.add('focused');
                });
                
                input.addEventListener('blur', () => {
                    if (!input.value) {
                        input.parentElement.classList.remove('focused');
                    }
                });
            });
        }
    }

    // Utility method for adding fade-in animation
    fadeInElement(element, delay = 0) {
        setTimeout(() => {
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.8s ease';
            
            requestAnimationFrame(() => {
                element.style.opacity = '1';
            });
        }, delay);
    }
}

// Initialize animations when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.motorproAnimations = new Animations();
});