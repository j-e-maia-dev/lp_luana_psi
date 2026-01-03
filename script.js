/**
 * ==========================================
 * LUANA MAIA - PSICÓLOGA
 * Landing Page Cinematográfica
 * JavaScript Principal
 * ==========================================
 */

(function() {
    'use strict';

    // ==========================================
    // CONFIGURAÇÕES GLOBAIS
    // ==========================================
    const CONFIG = {
        // WhatsApp
        whatsappNumber: '5519989276280',
        whatsappMessage: 'Olá, vim pelo site e gostaria de agendar uma consulta.',

        // Animações
        animationThreshold: 0.15,
        animationRootMargin: '0px 0px -50px 0px',

        // Tracking
        enableTracking: true,
        debugMode: false
    };

    // ==========================================
    // UTILITÁRIOS
    // ==========================================
    const Utils = {
        // Debounce function
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Throttle function
        throttle(func, limit) {
            let inThrottle;
            return function(...args) {
                if (!inThrottle) {
                    func.apply(this, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },

        // Get UTM parameters
        getUTMParams() {
            const params = new URLSearchParams(window.location.search);
            return {
                utm_source: params.get('utm_source') || '',
                utm_medium: params.get('utm_medium') || '',
                utm_campaign: params.get('utm_campaign') || '',
                utm_term: params.get('utm_term') || '',
                utm_content: params.get('utm_content') || '',
                gclid: params.get('gclid') || '',
                fbclid: params.get('fbclid') || ''
            };
        },

        // Store UTM in session/local storage
        storeUTMParams() {
            const utmParams = this.getUTMParams();
            const hasParams = Object.values(utmParams).some(v => v !== '');

            if (hasParams) {
                sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
                // Also store first touch attribution
                if (!localStorage.getItem('first_touch_utm')) {
                    localStorage.setItem('first_touch_utm', JSON.stringify({
                        ...utmParams,
                        timestamp: new Date().toISOString()
                    }));
                }
            }

            return utmParams;
        },

        // Get stored UTM params
        getStoredUTMParams() {
            try {
                return JSON.parse(sessionStorage.getItem('utm_params')) || this.getUTMParams();
            } catch {
                return this.getUTMParams();
            }
        },

        // Build WhatsApp URL with UTM tracking
        buildWhatsAppURL(customMessage = null) {
            const message = customMessage || CONFIG.whatsappMessage;
            const utmParams = this.getStoredUTMParams();

            let finalMessage = message;
            if (utmParams.utm_source) {
                finalMessage += ` [Origem: ${utmParams.utm_source}]`;
            }

            return `https://wa.me/${CONFIG.whatsappNumber}?text=${encodeURIComponent(finalMessage)}`;
        },

        // Check if device is touch
        isTouchDevice() {
            return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        },

        // Check if reduced motion is preferred
        prefersReducedMotion() {
            return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        },

        // Log for debug
        log(...args) {
            if (CONFIG.debugMode) {
                console.log('[LP]', ...args);
            }
        }
    };

    // ==========================================
    // TRACKING & ANALYTICS
    // ==========================================
    const Tracking = {
        init() {
            // Store UTM parameters
            Utils.storeUTMParams();

            // Setup click tracking
            this.setupClickTracking();

            // Setup scroll depth tracking
            this.setupScrollTracking();

            // Track page view
            this.trackPageView();

            Utils.log('Tracking initialized');
        },

        // Push to dataLayer (GTM)
        pushToDataLayer(event, data = {}) {
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event,
                ...data,
                timestamp: new Date().toISOString()
            });
            Utils.log('DataLayer push:', event, data);
        },

        // Track page view
        trackPageView() {
            const utmParams = Utils.getStoredUTMParams();
            this.pushToDataLayer('page_view', {
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname,
                ...utmParams
            });
        },

        // Setup click tracking for elements with data-track attribute
        setupClickTracking() {
            document.addEventListener('click', (e) => {
                const trackElement = e.target.closest('[data-track]');
                if (trackElement) {
                    const category = trackElement.dataset.trackCategory || 'Click';
                    const action = trackElement.dataset.trackAction || 'Unknown';
                    const label = trackElement.dataset.trackLabel || '';

                    this.trackEvent(category, action, label);
                }
            });
        },

        // Track custom event
        trackEvent(category, action, label = '', value = null) {
            // Push to GTM dataLayer
            this.pushToDataLayer('custom_event', {
                event_category: category,
                event_action: action,
                event_label: label,
                event_value: value
            });

            // Google Analytics 4 (if gtag is available)
            if (typeof gtag === 'function') {
                gtag('event', action, {
                    event_category: category,
                    event_label: label,
                    value: value
                });
            }
        },

        // Track conversion (for Google Ads)
        trackConversion(conversionLabel, value = null) {
            // GTM conversion
            this.pushToDataLayer('conversion', {
                conversion_label: conversionLabel,
                conversion_value: value
            });

            // Google Ads conversion tracking
            if (typeof gtag === 'function') {
                gtag('event', 'conversion', {
                    send_to: conversionLabel,
                    value: value,
                    currency: 'BRL'
                });
            }
        },

        // Track form submission
        trackFormSubmission(formName, formData = {}) {
            const utmParams = Utils.getStoredUTMParams();

            this.pushToDataLayer('form_submission', {
                form_name: formName,
                ...formData,
                ...utmParams
            });

            // Track as conversion
            this.trackConversion('AW-CONVERSION_ID/CONVERSION_LABEL');
        },

        // Setup scroll depth tracking
        setupScrollTracking() {
            const depths = [25, 50, 75, 90, 100];
            const tracked = new Set();

            const checkScrollDepth = Utils.throttle(() => {
                const scrollTop = window.pageYOffset;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const scrollPercent = Math.round((scrollTop / docHeight) * 100);

                depths.forEach(depth => {
                    if (scrollPercent >= depth && !tracked.has(depth)) {
                        tracked.add(depth);
                        this.trackEvent('Scroll', 'Depth', `${depth}%`);
                    }
                });
            }, 500);

            window.addEventListener('scroll', checkScrollDepth, { passive: true });
        },

        // Track section view
        trackSectionView(sectionId) {
            this.trackEvent('Section', 'View', sectionId);
        }
    };

    // ==========================================
    // LOADER
    // ==========================================
    const Loader = {
        element: null,

        init() {
            this.element = document.getElementById('loader');
            if (!this.element) return;

            document.body.classList.add('loading');

            // Hide loader after page load
            window.addEventListener('load', () => {
                this.hide();
            });

            // Fallback: hide after 3 seconds max
            setTimeout(() => this.hide(), 3000);
        },

        hide() {
            if (!this.element) return;

            this.element.classList.add('hidden');
            document.body.classList.remove('loading');

            // Trigger animations after loader hides
            setTimeout(() => {
                Animations.init();
            }, 300);
        }
    };

    // ==========================================
    // CURSOR (Usando padrão do navegador)
    // ==========================================
    const CustomCursor = {
        init() {
            // Cursor padrão - não precisa de inicialização customizada
            // Apenas marca dispositivos touch para CSS
            if (Utils.isTouchDevice()) {
                document.body.classList.add('touch');
            }
        }
    };

    // ==========================================
    // HEADER
    // ==========================================
    const Header = {
        element: null,
        progress: null,
        lastScroll: 0,

        init() {
            this.element = document.getElementById('header');
            this.progress = document.getElementById('header-progress');

            if (!this.element) return;

            this.setupScrollEffect();
            this.setupProgressBar();

            Utils.log('Header initialized');
        },

        setupScrollEffect() {
            const handleScroll = Utils.throttle(() => {
                const currentScroll = window.pageYOffset;

                // Add/remove scrolled class
                if (currentScroll > 50) {
                    this.element.classList.add('scrolled');
                } else {
                    this.element.classList.remove('scrolled');
                }

                this.lastScroll = currentScroll;
            }, 100);

            window.addEventListener('scroll', handleScroll, { passive: true });
        },

        setupProgressBar() {
            if (!this.progress) return;

            const updateProgress = Utils.throttle(() => {
                const scrollTop = window.pageYOffset;
                const docHeight = document.documentElement.scrollHeight - window.innerHeight;
                const progress = (scrollTop / docHeight) * 100;
                this.progress.style.width = `${progress}%`;
            }, 50);

            window.addEventListener('scroll', updateProgress, { passive: true });
        }
    };

    // ==========================================
    // MOBILE MENU
    // ==========================================
    const MobileMenu = {
        toggle: null,
        nav: null,
        isOpen: false,

        init() {
            this.toggle = document.getElementById('menu-toggle');
            this.nav = document.getElementById('nav');

            if (!this.toggle || !this.nav) return;

            this.toggle.addEventListener('click', () => this.toggleMenu());

            // Close on link click
            const links = this.nav.querySelectorAll('.nav-link');
            links.forEach(link => {
                link.addEventListener('click', () => this.closeMenu());
            });

            // Close on outside click
            document.addEventListener('click', (e) => {
                if (this.isOpen && !this.nav.contains(e.target) && !this.toggle.contains(e.target)) {
                    this.closeMenu();
                }
            });

            // Close on escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeMenu();
                }
            });

            Utils.log('Mobile menu initialized');
        },

        toggleMenu() {
            this.isOpen ? this.closeMenu() : this.openMenu();
        },

        openMenu() {
            this.isOpen = true;
            this.toggle.classList.add('active');
            this.toggle.setAttribute('aria-expanded', 'true');
            this.nav.classList.add('active');
            document.body.classList.add('no-scroll');
        },

        closeMenu() {
            this.isOpen = false;
            this.toggle.classList.remove('active');
            this.toggle.setAttribute('aria-expanded', 'false');
            this.nav.classList.remove('active');
            document.body.classList.remove('no-scroll');
        }
    };

    // ==========================================
    // SMOOTH SCROLL
    // ==========================================
    const SmoothScroll = {
        init() {
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', (e) => {
                    const href = anchor.getAttribute('href');
                    if (href === '#') return;

                    const target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        this.scrollTo(target);

                        // Track navigation
                        Tracking.trackEvent('Navigation', 'Anchor Click', href);
                    }
                });
            });
        },

        scrollTo(element) {
            const header = document.getElementById('header');
            const headerHeight = header ? header.offsetHeight : 0;
            const targetPosition = element.getBoundingClientRect().top + window.pageYOffset - headerHeight - 20;

            window.scrollTo({
                top: targetPosition,
                behavior: Utils.prefersReducedMotion() ? 'auto' : 'smooth'
            });
        }
    };

    // ==========================================
    // ANIMATIONS (Intersection Observer)
    // ==========================================
    const Animations = {
        observer: null,

        init() {
            if (Utils.prefersReducedMotion()) {
                // Show all elements immediately
                document.querySelectorAll('[data-animate]').forEach(el => {
                    el.classList.add('animate');
                });
                return;
            }

            this.observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add('animate');

                            // Track section view
                            const sectionId = entry.target.closest('section')?.id;
                            if (sectionId && !entry.target.dataset.tracked) {
                                entry.target.dataset.tracked = 'true';
                                Tracking.trackSectionView(sectionId);
                            }

                            // Unobserve after animation
                            this.observer.unobserve(entry.target);
                        }
                    });
                },
                {
                    threshold: CONFIG.animationThreshold,
                    rootMargin: CONFIG.animationRootMargin
                }
            );

            document.querySelectorAll('[data-animate]').forEach(el => {
                this.observer.observe(el);
            });

            Utils.log('Animations initialized');
        }
    };

    // ==========================================
    // PARALLAX
    // ==========================================
    const Parallax = {
        elements: [],

        init() {
            if (Utils.prefersReducedMotion() || Utils.isTouchDevice()) return;

            this.elements = document.querySelectorAll('[data-parallax]');
            if (this.elements.length === 0) return;

            window.addEventListener('scroll', Utils.throttle(() => this.update(), 16), { passive: true });

            Utils.log('Parallax initialized');
        },

        update() {
            const scrollY = window.pageYOffset;

            this.elements.forEach(el => {
                const speed = parseFloat(el.dataset.parallax) || 0.1;
                const rect = el.getBoundingClientRect();
                const inView = rect.top < window.innerHeight && rect.bottom > 0;

                if (inView) {
                    const yPos = scrollY * speed;
                    el.style.transform = `translateY(${yPos}px)`;
                }
            });
        }
    };

    // ==========================================
    // FAQ ACCORDION
    // ==========================================
    const FAQ = {
        init() {
            const items = document.querySelectorAll('.faq-item');

            items.forEach(item => {
                const button = item.querySelector('.faq-pergunta');
                if (!button) return;

                button.addEventListener('click', () => {
                    const isActive = item.classList.contains('active');
                    const isExpanded = button.getAttribute('aria-expanded') === 'true';

                    // Close all others
                    items.forEach(otherItem => {
                        if (otherItem !== item) {
                            otherItem.classList.remove('active');
                            otherItem.querySelector('.faq-pergunta')?.setAttribute('aria-expanded', 'false');
                        }
                    });

                    // Toggle current
                    item.classList.toggle('active');
                    button.setAttribute('aria-expanded', !isExpanded);

                    // Track FAQ interaction
                    if (!isActive) {
                        const question = button.querySelector('span')?.textContent || 'Unknown';
                        Tracking.trackEvent('FAQ', 'Open', question);
                    }
                });
            });

            Utils.log('FAQ initialized');
        }
    };

    // ==========================================
    // LEAD CAPTURE FORM
    // ==========================================
    const LeadForm = {
        form: null,
        submitButton: null,

        init() {
            this.form = document.getElementById('lead-form');
            if (!this.form) return;

            this.submitButton = this.form.querySelector('button[type="submit"]');

            this.form.addEventListener('submit', (e) => this.handleSubmit(e));

            // Real-time validation
            this.form.querySelectorAll('input, select, textarea').forEach(field => {
                field.addEventListener('blur', () => this.validateField(field));
                field.addEventListener('input', () => this.clearError(field));
            });

            Utils.log('Lead form initialized');
        },

        validateField(field) {
            const value = field.value.trim();
            let isValid = true;
            let errorMessage = '';

            // Required validation
            if (field.required && !value) {
                isValid = false;
                errorMessage = 'Este campo é obrigatório';
            }

            // Email validation
            if (field.type === 'email' && value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    isValid = false;
                    errorMessage = 'Digite um e-mail válido';
                }
            }

            // Phone validation (Brazilian format)
            if (field.type === 'tel' && value) {
                const phoneRegex = /^\(?[1-9]{2}\)?\s?9?[0-9]{4}-?[0-9]{4}$/;
                const cleanPhone = value.replace(/\D/g, '');
                if (cleanPhone.length < 10 || cleanPhone.length > 11) {
                    isValid = false;
                    errorMessage = 'Digite um telefone válido';
                }
            }

            if (!isValid) {
                this.showError(field, errorMessage);
            } else {
                this.clearError(field);
            }

            return isValid;
        },

        showError(field, message) {
            field.classList.add('error');
            const errorEl = field.parentElement.querySelector('.field-error') || this.createErrorElement(field);
            errorEl.textContent = message;
            errorEl.style.display = 'block';
        },

        clearError(field) {
            field.classList.remove('error');
            const errorEl = field.parentElement.querySelector('.field-error');
            if (errorEl) {
                errorEl.style.display = 'none';
            }
        },

        createErrorElement(field) {
            const errorEl = document.createElement('span');
            errorEl.className = 'field-error';
            field.parentElement.appendChild(errorEl);
            return errorEl;
        },

        async handleSubmit(e) {
            e.preventDefault();

            // Validate all fields
            const fields = this.form.querySelectorAll('input, select, textarea');
            let isValid = true;

            fields.forEach(field => {
                if (!this.validateField(field)) {
                    isValid = false;
                }
            });

            if (!isValid) return;

            // Get form data
            const formData = new FormData(this.form);
            const data = Object.fromEntries(formData.entries());

            // Add UTM parameters
            const utmParams = Utils.getStoredUTMParams();
            Object.assign(data, utmParams);

            // Add metadata
            data.page_url = window.location.href;
            data.timestamp = new Date().toISOString();
            data.user_agent = navigator.userAgent;

            // Disable button
            this.setLoading(true);

            try {
                // Here you would send to your backend/webhook
                // Example: await fetch('/api/leads', { method: 'POST', body: JSON.stringify(data) });

                // For now, redirect to WhatsApp with lead info
                const message = `Olá! Me chamo ${data.name}.\n\n` +
                               `${data.issue ? `Estou buscando ajuda com: ${data.issue}\n\n` : ''}` +
                               `Gostaria de agendar uma consulta.`;

                // Track conversion
                Tracking.trackFormSubmission('lead_form', data);

                // Show success
                this.showSuccess();

                // Redirect to WhatsApp after short delay
                setTimeout(() => {
                    window.open(Utils.buildWhatsAppURL(message), '_blank');
                }, 1500);

            } catch (error) {
                Utils.log('Form submission error:', error);
                this.showError(this.form, 'Ocorreu um erro. Tente novamente.');
            } finally {
                this.setLoading(false);
            }
        },

        setLoading(loading) {
            if (!this.submitButton) return;

            if (loading) {
                this.submitButton.disabled = true;
                this.submitButton.dataset.originalText = this.submitButton.innerHTML;
                this.submitButton.innerHTML = '<span class="loading-spinner"></span> Enviando...';
            } else {
                this.submitButton.disabled = false;
                this.submitButton.innerHTML = this.submitButton.dataset.originalText || 'Enviar';
            }
        },

        showSuccess() {
            const successEl = document.createElement('div');
            successEl.className = 'form-success';
            successEl.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                <h4>Recebemos seus dados!</h4>
                <p>Em instantes você será redirecionado para o WhatsApp.</p>
            `;

            this.form.innerHTML = '';
            this.form.appendChild(successEl);
        }
    };

    // ==========================================
    // WHATSAPP LINKS
    // ==========================================
    const WhatsApp = {
        init() {
            // Update all WhatsApp links with UTM tracking
            document.querySelectorAll('a[href*="wa.me"], a[href*="whatsapp"]').forEach(link => {
                link.addEventListener('click', (e) => {
                    e.preventDefault();

                    // Track WhatsApp click
                    const location = link.dataset.trackAction || 'Unknown Location';
                    Tracking.trackEvent('CTA', 'WhatsApp Click', location);
                    Tracking.trackConversion('AW-CONVERSION_ID/WHATSAPP_LABEL');

                    // Open WhatsApp with UTM tracking
                    window.open(Utils.buildWhatsAppURL(), '_blank');
                });
            });

            Utils.log('WhatsApp links initialized');
        }
    };

    // ==========================================
    // PHONE MASK
    // ==========================================
    const PhoneMask = {
        init() {
            document.querySelectorAll('input[type="tel"]').forEach(input => {
                input.addEventListener('input', (e) => {
                    let value = e.target.value.replace(/\D/g, '');

                    if (value.length > 11) {
                        value = value.slice(0, 11);
                    }

                    if (value.length > 0) {
                        if (value.length <= 2) {
                            value = `(${value}`;
                        } else if (value.length <= 7) {
                            value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                        } else {
                            value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                        }
                    }

                    e.target.value = value;
                });
            });
        }
    };

    // ==========================================
    // ACTIVE NAV LINK ON SCROLL
    // ==========================================
    const ActiveNavLink = {
        sections: [],
        navLinks: [],

        init() {
            this.sections = document.querySelectorAll('section[id]');
            this.navLinks = document.querySelectorAll('.nav-link');

            if (this.sections.length === 0) return;

            window.addEventListener('scroll', Utils.throttle(() => this.update(), 100), { passive: true });
        },

        update() {
            const header = document.getElementById('header');
            const headerHeight = header ? header.offsetHeight : 0;
            const scrollPosition = window.pageYOffset + headerHeight + 100;

            this.sections.forEach(section => {
                const sectionTop = section.offsetTop;
                const sectionHeight = section.offsetHeight;
                const sectionId = section.getAttribute('id');

                if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                    this.navLinks.forEach(link => {
                        link.classList.remove('active');
                        if (link.getAttribute('href') === `#${sectionId}`) {
                            link.classList.add('active');
                        }
                    });
                }
            });
        }
    };

    // ==========================================
    // DYNAMIC YEAR
    // ==========================================
    const DynamicYear = {
        init() {
            const yearEl = document.getElementById('current-year');
            if (yearEl) {
                yearEl.textContent = new Date().getFullYear();
            }
        }
    };

    // ==========================================
    // GOOGLE ADS CONVERSION HELPERS
    // ==========================================
    const GoogleAds = {
        // Initialize Google Ads tracking
        init() {
            // This will be called after gtag is loaded
            // Set up conversion linker for cross-domain tracking
            this.setupConversionLinker();
        },

        setupConversionLinker() {
            // Conversion linker for Google Ads
            if (typeof gtag === 'function') {
                gtag('set', 'linker', {
                    'domains': ['luanamaiapsicologa.com.br', 'wa.me']
                });
            }
        },

        // Track phone call click
        trackPhoneClick() {
            if (typeof gtag === 'function') {
                gtag('event', 'conversion', {
                    'send_to': 'AW-CONVERSION_ID/PHONE_LABEL'
                });
            }
        },

        // Track form start
        trackFormStart() {
            Tracking.trackEvent('Form', 'Start', 'Lead Form');
        },

        // Track form complete
        trackFormComplete(value = 100) {
            if (typeof gtag === 'function') {
                gtag('event', 'conversion', {
                    'send_to': 'AW-CONVERSION_ID/FORM_LABEL',
                    'value': value,
                    'currency': 'BRL'
                });
            }
        }
    };

    // ==========================================
    // INITIALIZATION
    // ==========================================
    const App = {
        init() {
            Utils.log('App initializing...');

            // Core functionality
            Loader.init();
            Header.init();
            MobileMenu.init();
            SmoothScroll.init();
            FAQ.init();
            ActiveNavLink.init();
            DynamicYear.init();

            // Visual effects
            CustomCursor.init();
            Parallax.init();

            // Forms and interactions
            LeadForm.init();
            WhatsApp.init();
            PhoneMask.init();

            // Tracking (init early)
            Tracking.init();
            GoogleAds.init();

            Utils.log('App initialized successfully');
        }
    };

    // Start the app when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => App.init());
    } else {
        App.init();
    }

    // Expose tracking functions globally for GTM/external use
    window.LPTracking = {
        trackEvent: Tracking.trackEvent.bind(Tracking),
        trackConversion: Tracking.trackConversion.bind(Tracking),
        trackFormSubmission: Tracking.trackFormSubmission.bind(Tracking),
        getUTMParams: Utils.getStoredUTMParams.bind(Utils)
    };

})();
