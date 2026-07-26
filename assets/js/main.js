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
  initHeroFlashlight();
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

  const observerOptions = {
    root: null, // viewport
    rootMargin: '0px 0px -8% 0px', // trigger slightly before entering view
    threshold: 0.12 // trigger when 12% of the element is visible
  };

  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('reveal-active');
        // Once animated, stop observing this element
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  revealElements.forEach(element => {
    revealObserver.observe(element);
  });
}

/**
 * Controls interactive CAD Blueprint Flashlight Scanner on Mouse Hover.
 * Displays the photorealistic Traumhaus render by default,
 * and reveals the technical CAD blueprint in a glowing spotlight lens under the cursor.
 */
function initHeroFlashlight() {
  const heroSection = document.getElementById('hero');
  const blueprintImg = document.getElementById('heroBlueprintFlashlight');
  const flashlightRing = document.getElementById('heroFlashlightRing');

  if (!heroSection || !blueprintImg) return;

  let currentX = window.innerWidth / 2;
  let currentY = window.innerHeight / 2;
  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let radius = 0;
  let targetRadius = 0;
  let isHovered = false;

  const onMouseMove = (e) => {
    const rect = heroSection.getBoundingClientRect();
    targetX = e.clientX - rect.left;
    targetY = e.clientY - rect.top;
    isHovered = true;
    targetRadius = 210; // 210px radius flashlight lens
  };

  const onMouseLeave = () => {
    isHovered = false;
    targetRadius = 0;
  };

  const renderFrame = () => {
    // Smooth 120 FPS lerp tracking
    currentX += (targetX - currentX) * 0.18;
    currentY += (targetY - currentY) * 0.18;
    radius += (targetRadius - radius) * 0.15;

    if (blueprintImg) {
      const clipStr = `circle(${radius.toFixed(1)}px at ${currentX.toFixed(1)}px ${currentY.toFixed(1)}px)`;
      blueprintImg.style.clipPath = clipStr;
      blueprintImg.style.webkitClipPath = clipStr;
    }

    if (flashlightRing) {
      flashlightRing.style.left = `${currentX.toFixed(1)}px`;
      flashlightRing.style.top = `${currentY.toFixed(1)}px`;
      if (isHovered && radius > 20) {
        flashlightRing.classList.add('active');
      } else {
        flashlightRing.classList.remove('active');
      }
    }

    requestAnimationFrame(renderFrame);
  };

  heroSection.addEventListener('mousemove', onMouseMove, { passive: true });
  heroSection.addEventListener('mouseleave', onMouseLeave, { passive: true });

  // Touch support for tablets / smartphones
  heroSection.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      const rect = heroSection.getBoundingClientRect();
      targetX = e.touches[0].clientX - rect.left;
      targetY = e.touches[0].clientY - rect.top;
      isHovered = true;
      targetRadius = 180;
    }
  }, { passive: true });

  heroSection.addEventListener('touchend', onMouseLeave, { passive: true });

  requestAnimationFrame(renderFrame);
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
