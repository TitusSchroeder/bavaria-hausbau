/**
 * BAVARIA Hausbau GmbH - High-Performance JavaScript Controller
 * Hardware GPU-accelerated event listeners, requestAnimationFrame scroll throttling,
 * smooth IntersectionObserver reveal engine, and instant UI responsiveness.
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeaderScroll();
  initMobileNav();
  initPortfolioFilter();
  initContactForm();
  initScrollReveal();
  initParallaxScroll();
  initQualityTabs();
});

/**
  * Adds 'scrolled' class to header with RAF throttling to prevent layout thrashing
  */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  if (!header) return;

  let ticking = false;
  let isScrolled = false;

  const checkScroll = () => {
    const shouldScroll = window.scrollY > 40;
    if (shouldScroll !== isScrolled) {
      isScrolled = shouldScroll;
      if (isScrolled) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
    ticking = false;
  };

  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(checkScroll);
      ticking = true;
    }
  }, { passive: true });

  checkScroll();
}

/**
  * Handles mobile hamburger menu toggle
  */
function initMobileNav() {
  const burgerBtn = document.querySelector('.burger-btn');
  const mobileOverlay = document.querySelector('.mobile-nav-overlay');
  
  if (!burgerBtn || !mobileOverlay) return;

  burgerBtn.addEventListener('click', () => {
    const isOpen = burgerBtn.classList.toggle('open');
    mobileOverlay.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  const mobileLinks = mobileOverlay.querySelectorAll('.mobile-nav-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', () => {
      burgerBtn.classList.remove('open');
      mobileOverlay.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

/**
  * Handles references/portfolio filtering based on category buttons
  */
function initPortfolioFilter() {
  const filterButtons = document.querySelectorAll('.filter-btn');
  const portfolioItems = document.querySelectorAll('.portfolio-item');
  
  if (filterButtons.length === 0 || portfolioItems.length === 0) return;

  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      filterButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
      portfolioItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        
        if (filterValue === 'all' || itemCategory === filterValue) {
          item.classList.remove('hidden');
          window.requestAnimationFrame(() => {
            item.style.opacity = '1';
            item.style.transform = 'translate3d(0,0,0)';
          });
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
}

/**
  * Handles contact form validation
  */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const existingMsg = contactForm.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();
    
    const name = document.getElementById('formName').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const message = document.getElementById('formMessage').value.trim();
    const projectType = document.getElementById('formProjectType') ? document.getElementById('formProjectType').value : 'Bauvorhaben';

    if (!name || !email || !message) {
      displayMessage(contactForm, 'Bitte füllen Sie alle erforderlichen Felder (*) aus.', 'error');
      return;
    }
    
    if (!validateEmail(email)) {
      displayMessage(contactForm, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error');
      return;
    }
    
    const successText = `Vielen Dank für Ihre Anfrage, Herr/Frau ${name}! Wir haben Ihre Nachricht erhalten und melden uns in Kürze unter ${email} bei Ihnen.`;
    displayMessage(contactForm, successText, 'success');
    contactForm.reset();
  });
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function displayMessage(form, text, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message ${type}`;
  messageDiv.textContent = text;
  form.appendChild(messageDiv);
  messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
  * High-Performance Intersection Observer for scroll-reveal animations
  */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length === 0) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -5% 0px',
    threshold: 0.08
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
}

/**
  * GPU-accelerated requestAnimationFrame parallax scroll controller
  */
function initParallaxScroll() {
  const containers = document.querySelectorAll('.parallax-img-wrapper');
  if (!containers.length) return;

  let ticking = false;

  const updateParallax = () => {
    const windowHeight = window.innerHeight;
    containers.forEach(container => {
      const rect = container.getBoundingClientRect();
      if (rect.top < windowHeight && rect.bottom > 0) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const parallaxTranslate = centerOffset * -0.035;
        container.style.transform = `translate3d(0, ${parallaxTranslate}px, 0)`;
      }
    });
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallax);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateParallax();
}

/**
  * Handles interactive tabs in the BAVARIA Qualitätscenter section
  */
function initQualityTabs() {
  const tabButtons = document.querySelectorAll('.quality-tab-btn');
  const tabPanes = document.querySelectorAll('.quality-tab-pane');

  if (tabButtons.length === 0 || tabPanes.length === 0) return;

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('data-tab');

      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      tabPanes.forEach(pane => {
        if (pane.id === targetId) {
          pane.classList.add('active');
        } else {
          pane.classList.remove('active');
        }
      });
    });
  });
}
