// Main JavaScript for ContractFlow Pro Landing Page
document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Navbar background change on scroll
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('navbar-scrolled');
        } else {
            navbar.classList.remove('navbar-scrolled');
        }
    });

    // Add scroll-triggered animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    // Observe elements for animation
    document.querySelectorAll('.use-case-card, .problem-card, .solution-card, .benefit-card, .startup-card, .industry-data-card').forEach(el => {
        observer.observe(el);
    });

    // Mobile menu toggle
    const mobileMenuToggle = document.getElementById('sideNavToggle');
    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function() {
            const navbarCollapse = document.querySelector('.navbar-collapse');
            navbarCollapse.classList.toggle('show');
        });
    }

    // Loading animation for "Get Started" button
    const getStartedBtn = document.querySelector('a[href="#demo"]');
    if (getStartedBtn) {
        getStartedBtn.addEventListener('click', function(e) {
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Loading...';
            setTimeout(() => {
                this.innerHTML = '<i class="fas fa-play me-2"></i>Start Free Trial';
            }, 2000);
        });
    }

    // Dashboard Selection Functionality
    const dashboardSelectors = document.querySelectorAll('.dashboard-selector');
    const dashboardContent = document.getElementById('dashboardContent');
    const dashboardSections = document.querySelectorAll('.dashboard-section');

    dashboardSelectors.forEach(selector => {
        selector.addEventListener('click', function() {
            const dashboardType = this.getAttribute('data-dashboard');
            
            // Hide all dashboard sections
            dashboardSections.forEach(section => {
                section.style.display = 'none';
            });
            
            // Show the selected dashboard section
            const selectedSection = document.getElementById(dashboardType + '-dashboard');
            if (selectedSection) {
                selectedSection.style.display = 'block';
                dashboardContent.style.display = 'block';
                
                // Scroll to dashboard content
                dashboardContent.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
            
            // Update active state of dashboard selectors
            dashboardSelectors.forEach(sel => {
                sel.classList.remove('active');
            });
            this.classList.add('active');
        });
    });

    // Add scroll progress indicator
    const progressBar = document.createElement('div');
    progressBar.className = 'scroll-progress';
    progressBar.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: linear-gradient(90deg, #000000, #333333);
        z-index: 9999;
        transition: width 0.1s ease;
    `;
    document.body.appendChild(progressBar);

    window.addEventListener('scroll', function() {
        const scrollTop = document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrollPercent = (scrollTop / scrollHeight) * 100;
        progressBar.style.width = scrollPercent + '%';
    });

    // Back to top button
    const backToTopBtn = document.createElement('button');
    backToTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    backToTopBtn.className = 'back-to-top';
    backToTopBtn.style.cssText = `
        position: fixed;
        bottom: 30px;
        right: 30px;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: #000000;
        color: #ffffff;
        border: none;
        cursor: pointer;
        display: none;
        z-index: 1000;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    document.body.appendChild(backToTopBtn);

    window.addEventListener('scroll', function() {
        if (window.scrollY > 300) {
            backToTopBtn.style.display = 'block';
        } else {
            backToTopBtn.style.display = 'none';
        }
    });

    backToTopBtn.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    backToTopBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px)';
        this.style.boxShadow = '0 6px 20px rgba(0,0,0,0.25)';
    });

    backToTopBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0)';
        this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
    });

    console.log('ContractFlow Pro landing page loaded successfully!');
});
