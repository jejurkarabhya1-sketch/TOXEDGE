// TOXEDGE Analytics Tracking (Non-blocking IIFE)
(function() {
    try {
        const analyticsKey = 'toxedge_analytics';
        const ANALYTICS_ENDPOINT = '/api-analytics.php';  // Relative path works on any domain
        
        let stats = JSON.parse(localStorage.getItem(analyticsKey) || '{}');
        
        // Initialize stats object
        if (!stats.uniqueVisitors) stats.uniqueVisitors = 0;
        if (!stats.pageViews) stats.pageViews = {};
        if (!stats.sectionViews) stats.sectionViews = {};
        if (!stats.firstVisits) stats.firstVisits = {};
        if (!stats.lastVisits) stats.lastVisits = {};
        if (!stats.sessionStart) stats.sessionStart = Date.now();
        
        // Generate or retrieve session ID
        let sessionId = localStorage.getItem('toxedge_session_id');
        if (!sessionId) {
            sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('toxedge_session_id', sessionId);
        }
        
        const page = window.location.pathname.split('/').pop() || 'index.html';
        const sections = ['hero', 'core-framework', 'services', 'track-record', 'stay-informed', 'get-started', 'knowledge-hero', 'services-hero', 'about-hero', 'contact-hero'];
        
        // Track page view
        if (!stats.pageViews[page]) stats.pageViews[page] = 0;
        stats.pageViews[page]++;
        
        // Track first/last visit
        if (!stats.firstVisits[page]) stats.firstVisits[page] = new Date().toLocaleString();
        stats.lastVisits[page] = new Date().toLocaleString();
        
        // Track unique visitors (session based)
        if (!localStorage.getItem('toxedge_session')) {
            stats.uniqueVisitors++;
            localStorage.setItem('toxedge_session', Date.now().toString());
        }
        
        // Track visible sections (Intersection Observer)
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const sectionClass = entry.target.className.split(' ')[0];
                        if (sections.includes(sectionClass)) {
                            if (!stats.sectionViews[sectionClass]) stats.sectionViews[sectionClass] = 0;
                            stats.sectionViews[sectionClass]++;
                        }
                    }
                });
            }, { threshold: 0.3 });
            
            // Observe all sections
            sections.forEach(sectionClass => {
                const el = document.querySelector(`.${sectionClass}`);
                if (el) observer.observe(el);
            });
        }
        
        // Track session duration and send to backend
        window.addEventListener('beforeunload', () => {
            const sessionTime = Math.round((Date.now() - stats.sessionStart) / 1000);
            if (!stats.totalSessions) stats.totalSessions = 0;
            stats.totalSessions++;
            
            if (!stats.avgSessionTime) stats.avgSessionTime = 0;
            stats.avgSessionTime = Math.round((stats.avgSessionTime * (stats.totalSessions - 1) + sessionTime) / stats.totalSessions);
            
            // Save locally
            localStorage.setItem(analyticsKey, JSON.stringify(stats));
            
            // Send to backend
            sendToBackend(sessionTime);
        });
        
        function sendToBackend(sessionTime) {
            try {
                const payload = {
                    sessionId: sessionId,
                    page: page,
                    pageViewCount: stats.pageViews[page] || 1,
                    sectionViews: stats.sectionViews || {},
                    sessionTime: sessionTime,
                    bounceRate: stats.bounceRate || 0.34,
                    timestamp: new Date().toISOString()
                };
                
                // Use sendBeacon for reliability
                if (navigator.sendBeacon) {
                    navigator.sendBeacon(ANALYTICS_ENDPOINT, JSON.stringify(payload));
                } else {
                    fetch(ANALYTICS_ENDPOINT, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                        keepalive: true
                    }).catch(() => {});
                }
            } catch (e) {
                console.log('Backend analytics send failed:', e);
            }
        }
        
        // Also send immediately on page load
        setTimeout(() => {
            try {
                const payload = {
                    sessionId: sessionId,
                    page: page,
                    pageViewCount: 1,
                    sectionViews: {},
                    sessionTime: 0,
                    bounceRate: 0,
                    timestamp: new Date().toISOString()
                };
                fetch(ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                }).catch(() => {});
            } catch (e) {
                console.log('Backend analytics initial send failed:', e);
            }
        }, 500);
        
        // Save locally
        localStorage.setItem(analyticsKey, JSON.stringify(stats));
    } catch (e) {
        console.log('Analytics tracking disabled (localStorage unavailable)');
    }
})();

// ============= HAMBURGER MENU TOGGLE =============
document.addEventListener('DOMContentLoaded', function () {
    const hamburger = document.getElementById('hamburger');
    const nav = document.getElementById('nav');
    const navLinks = nav ? nav.querySelectorAll('.nav-link, .get-in-touch') : [];

    if (hamburger) {
        hamburger.addEventListener('click', function () {
            hamburger.classList.toggle('active');
            nav.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', function () {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', function (event) {
            if (!event.target.closest('.logo-nav')) {
                hamburger.classList.remove('active');
                nav.classList.remove('active');
            }
        });
    }

    // ULTRA-FAST Active Nav - ZERO FLICKER
    navLinks.forEach(link => link.classList.remove('active'));
    
    const pathSegments = window.location.pathname.split('/').filter(Boolean);
    const currentFile = pathSegments[pathSegments.length - 1] || 'index.html';
    
    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentFile) {
            link.classList.add('active');
        }
    });
});

// ============= ACCORDION SERVICES =============
document.addEventListener('DOMContentLoaded', function () {
    const cards = document.querySelectorAll('.service-card-row');
    cards.forEach((card, idx) => {
        const toggle = card.querySelector('.service-card-toggle');
        if (toggle) {
            toggle.addEventListener('click', function () {
                // Collapse all other cards
                cards.forEach((c, i) => {
                    if (i !== idx) c.classList.remove('expanded');
                });
                card.classList.toggle('expanded');
            });
        }
    });
});

// ============= HERO SLIDER =============
let currentIndex = 0;
const slider = document.getElementById('slider');
const sliderWrapper = document.querySelector('.slider-wrapper');
const images = slider ? slider.querySelectorAll('img') : [];
const slideInterval = 3000; // 3 seconds 

function getSlideWidth() {
    return sliderWrapper ? sliderWrapper.offsetWidth : window.innerWidth * 0.5;
}

function showSlide(index) {
    if (!slider || images.length === 0) return;
    const slideWidth = getSlideWidth();
    slider.style.transform = `translateX(-${index * slideWidth}px)`;
}

function nextSlide() {
    currentIndex = (currentIndex + 1) % images.length;
    showSlide(currentIndex);
}

window.addEventListener('resize', () => showSlide(currentIndex));

let imagesLoaded = 0;
images.forEach(img => {
    if (img.complete) imagesLoaded++;
    img.addEventListener('load', () => {
        imagesLoaded++;
        if (imagesLoaded === images.length) showSlide(currentIndex);
    });
});

if (slider && images.length > 0) {
    setTimeout(() => {
        showSlide(currentIndex);
        setInterval(nextSlide, slideInterval);
    }, 200);
}

// ============= SUBSCRIBE FORMS =============
function setupSubscribeForms() {
    const subscribeForms = document.querySelectorAll('.subscribe-form, .footer-newsletter-row');
    subscribeForms.forEach(form => {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            const btn = form.querySelector('button[type="submit"]');
            if (btn) {
                btn.textContent = 'Coming soon...';
                btn.disabled = true;
            }
            setTimeout(() => alert('Thanks! Subscription coming soon.'), 100);
        });
    });
}

document.addEventListener('DOMContentLoaded', setupSubscribeForms);

// ============= ENHANCED RIGHT-CLICK PROTECTION =============
(function() {
    // Disable right-click
    document.addEventListener('contextmenu', e => e.preventDefault());
    
    // Disable text/image selection and drag
    document.addEventListener('selectstart', e => e.preventDefault());
    document.addEventListener('dragstart', e => e.preventDefault());
    
    // Disable F12, Ctrl+Shift+I/C/J/U, Ctrl+S
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' ||
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
            (e.ctrlKey && e.key === 'u') ||
            (e.ctrlKey && e.key === 's')) {
            e.preventDefault();
            return false;
        }
    }, true);
    
    // Disable developer tools on double F12/Alt+Cmd+I
    document.addEventListener('keydown', e => {
        if (e.key === 'F12' && e.target === document.body) {
            e.preventDefault();
        }
    }, true);
    
    // Disable inspect element context
    document.oncontextmenu = null;
    document.onselectstart = null;
    document.oncontextmenu = () => false;
    
    // Add CSS protection
    const style = document.createElement('style');
    style.textContent = `
        * { -webkit-user-select: none !important; -moz-user-select: none !important; -ms-user-select: none !important; user-select: none !important; }
        img { pointer-events: none !important; }
        body.protected * { user-select: none !important; -webkit-touch-callout: none !important; }
    `;
    document.head.appendChild(style);
    
    // Mark page as protected
    document.body.classList.add('protected');
})();


