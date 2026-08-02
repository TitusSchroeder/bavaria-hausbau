/**
 * BAVARIA Hausbau GmbH - JavaScript Controller
 * Handles mobile menu, header sticky effect, portfolio filtering, contact form,
 * high-performance intersection observer for scroll-reveal,
 * and high-end video scroll engine (seeking-aware bidirectional smooth scrub with sequential text cards).
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
 * Adds 'scrolled' class to header when page is scrolled down
 */
function initHeaderScroll() {
  const header = document.querySelector('.header');
  const heroWrapper = document.querySelector('.hero-scroll-wrapper');
  if (!header) return;

  const checkScroll = () => {
    if (heroWrapper) {
      // Keep navigation bar transparent until the video scroll section is fully finished
      const heroBottom = heroWrapper.offsetTop + heroWrapper.offsetHeight - 140;
      if (window.scrollY > heroBottom) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    } else {
      if (window.scrollY > 50) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }
  };

  window.addEventListener('scroll', checkScroll, { passive: true });
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
    
    // Prevent body scrolling when mobile menu is open
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close menu when clicking on a link
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
    button.addEventListener('click', (e) => {
      // Remove active class from all buttons
      filterButtons.forEach(btn => btn.classList.remove('active'));
      
      // Add active class to clicked button
      button.classList.add('active');
      
      const filterValue = button.getAttribute('data-filter');
      
      portfolioItems.forEach(item => {
        const itemCategory = item.getAttribute('data-category');
        
        if (filterValue === 'all' || itemCategory === filterValue) {
          item.classList.remove('hidden');
          // Trigger a minor layout recalculation for reveal transitions
          setTimeout(() => {
            item.style.opacity = '1';
            item.style.transform = 'translateY(0) scale(1)';
          }, 50);
        } else {
          item.classList.add('hidden');
        }
      });
    });
  });
}

/**
 * Handles contact form validation and mock submission feedback
 */
function initContactForm() {
  const contactForm = document.getElementById('contactForm');
  if (!contactForm) return;

  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    // Clear previous messages
    const existingMsg = contactForm.querySelector('.form-message');
    if (existingMsg) existingMsg.remove();
    
    // Fetch values
    const name = document.getElementById('formName').value.trim();
    const email = document.getElementById('formEmail').value.trim();
    const phone = document.getElementById('formPhone').value.trim();
    const projectType = document.getElementById('formProjectType').value;
    const timeframe = document.getElementById('formTimeframe').value;
    const message = document.getElementById('formMessage').value.trim();
    
    // Simple validation
    if (!name || !email || !message) {
      displayMessage(contactForm, 'Bitte füllen Sie alle erforderlichen Felder (*) aus.', 'error');
      return;
    }
    
    // Validate E-Mail
    if (!validateEmail(email)) {
      displayMessage(contactForm, 'Bitte geben Sie eine gültige E-Mail-Adresse ein.', 'error');
      return;
    }
    
    // Success feedback
    const successText = `Vielen Dank für Ihre Anfrage, Herr/Frau ${name}! Wir haben Ihre Anfrage für das Bauvorhaben "${projectType}" erhalten und werden uns in Kürze unter ${email} bei Ihnen melden.`;
    displayMessage(contactForm, successText, 'success');
    
    // Reset form
    contactForm.reset();
  });
}

/**
 * Email validation regex helper
 */
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/**
 * Displays feedback message at the bottom of the form
 */
function displayMessage(form, text, type) {
  const messageDiv = document.createElement('div');
  messageDiv.className = `form-message ${type}`;
  messageDiv.textContent = text;
  
  form.appendChild(messageDiv);
  
  // Smooth scroll
  messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Intersection Observer for scroll-reveal animations
 */
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  if (revealElements.length === 0) return;

  // Immediately make all elements visible to guarantee no content is ever hidden
  revealElements.forEach(el => el.classList.add('reveal-active'));

  if (!('IntersectionObserver' in window)) return;

  const observerOptions = {
    root: null,
    rootMargin: '0px 0px -4% 0px',
    threshold: 0.05
  };

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
      }
    });
  }, observerOptions);

  revealElements.forEach(element => {
    // Only animate elements that are below the initial viewport
    const rect = element.getBoundingClientRect();
    if (rect.top > window.innerHeight) {
      element.classList.remove('reveal-active');
      element.classList.add('reveal-init');
      revealObserver.observe(element);
    }
  });
}

}

/**
 * Smooth Container-Level Parallax scroll controller for .parallax-img-wrapper elements
 * Shifts the entire card box without overflowing inner images or creating white border gaps.
 */
function initParallaxScroll() {
  const containers = document.querySelectorAll('.parallax-img-wrapper');
  if (!containers.length) return;

  const onScroll = () => {
    const windowHeight = window.innerHeight;
    containers.forEach(container => {
      const rect = container.getBoundingClientRect();
      if (rect.top < windowHeight && rect.bottom > 0) {
        const centerOffset = (rect.top + rect.height / 2) - (windowHeight / 2);
        const parallaxTranslate = centerOffset * -0.05; // Soft 5% container offset
        container.style.transform = `translateY(${parallaxTranslate}px)`;
      }
    });
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

/**
 * Toggles collapsible google review cards
 */
function toggleReview(id) {
  const container = document.getElementById(id);
  if (!container) return;
  const isExpanded = container.classList.toggle('expanded');
  const btn = container.querySelector('.read-more-btn');
  if (btn) {
    btn.innerHTML = isExpanded ? 'Weniger lesen &uarr;' : 'Mehr lesen &darr;';
  }
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

      // Update buttons state
      tabButtons.forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');

      // Update panes state
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
