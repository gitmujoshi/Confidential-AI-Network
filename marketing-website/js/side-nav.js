class SideNavigation {
    constructor() {
        this.sideNav = document.getElementById('sideNav');
        this.navLinks = document.querySelectorAll('.side-nav-link');
        this.sections = {};
        this.currentActiveSection = null;
        this.init();
    }

    init() {
        this.setupSections();
        this.setupIntersectionObserver();
        this.setupSmoothScrolling();
        this.setupScrollSpy();
        this.setupMobileToggle();
    }

    setupSections() {
        // Map navigation links to their corresponding sections
        this.navLinks.forEach(link => {
            const sectionId = link.getAttribute('href').substring(1);
            const section = document.getElementById(sectionId);
            if (section) {
                this.sections[sectionId] = {
                    element: section,
                    link: link
                };
            }
        });
    }

    setupIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '-20% 0px -70% 0px',
            threshold: 0
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const sectionId = entry.target.id;
                    this.setActiveSection(sectionId);
                }
            });
        }, options);

        // Observe all sections
        Object.values(this.sections).forEach(section => {
            observer.observe(section.element);
        });
    }

    setupSmoothScrolling() {
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                
                if (targetSection) {
                    const headerHeight = document.querySelector('nav').offsetHeight;
                    const targetPosition = targetSection.offsetTop - headerHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    setupScrollSpy() {
        let ticking = false;
        
        const updateActiveSection = () => {
            const scrollPosition = window.scrollY + 100;
            
            let currentSection = null;
            Object.entries(this.sections).forEach(([sectionId, sectionData]) => {
                const sectionTop = sectionData.element.offsetTop;
                const sectionBottom = sectionTop + sectionData.element.offsetHeight;
                
                if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
                    currentSection = sectionId;
                }
            });
            
            if (currentSection && currentSection !== this.currentActiveSection) {
                this.setActiveSection(currentSection);
            }
            
            ticking = false;
        };

        const requestTick = () => {
            if (!ticking) {
                requestAnimationFrame(updateActiveSection);
                ticking = true;
            }
        };

        window.addEventListener('scroll', requestTick);
    }

    setActiveSection(sectionId) {
        // Remove active class from current active section
        if (this.currentActiveSection && this.sections[this.currentActiveSection]) {
            this.sections[this.currentActiveSection].link.classList.remove('active');
        }

        // Add active class to new active section
        if (this.sections[sectionId]) {
            this.sections[sectionId].link.classList.add('active');
            this.currentActiveSection = sectionId;
        }
    }

    // Method to manually set active section (useful for programmatic navigation)
    goToSection(sectionId) {
        const section = document.getElementById(sectionId);
        if (section) {
            const headerHeight = document.querySelector('nav').offsetHeight;
            const targetPosition = section.offsetTop - headerHeight - 20;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    }

    // Method to show/hide navigation (useful for mobile)
    toggle() {
        if (this.sideNav) {
            this.sideNav.classList.toggle('show');
        }
    }

    // Method to hide navigation (useful for mobile)
    hide() {
        if (this.sideNav) {
            this.sideNav.classList.remove('show');
        }
    }

    setupMobileToggle() {
        const toggleBtn = document.getElementById('sideNavToggle');
        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.toggle();
            });
        }

        // Close navigation when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.sideNav.contains(e.target) && !toggleBtn.contains(e.target)) {
                this.hide();
            }
        });

        // Close navigation on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hide();
            }
        });
    }
}

// Initialize side navigation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.sideNavigation = new SideNavigation();
});

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SideNavigation;
}
