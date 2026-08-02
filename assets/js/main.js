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
  if (!header) return;

  const checkScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
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
 * Controls interactive drone video playback bound to Hero header scroll progress.
 * Integrates sequential info cards fading in and out at specific progress stages.
 * Employs a seeking-aware bidirectional smooth scrub to prevent browser decoding lag.
 */
function initHeroVideoScroll() {
  const track = document.getElementById('heroScrollTrack');
  const video = document.getElementById('heroVideo');
  const content = document.getElementById('heroContent');
  const indicator = document.getElementById('scrollIndicator');
  const cards = document.querySelectorAll('.hero-scroll-info-card');
  
  if (!track || !video) return;

  // Initialize video on reload to start at 0s
  video.currentTime = 0;
  video.playbackRate = 1.0;

  let targetProgress = 0;
  let smoothProgress = 0;
  let targetTime = 0;
  let isScrollActive = false;
  let videoDuration = 0;
  let lastSeekTimestamp = 0;

  video.addEventListener('loadedmetadata', () => {
    videoDuration = video.duration;
  });

  if (video.readyState >= 1) {
    videoDuration = video.duration;
  }

  const onScroll = () => {
    const rect = track.getBoundingClientRect();
    const trackHeight = rect.height - window.innerHeight;
    const progress = Math.max(0, Math.min(1, -rect.top / trackHeight));
    targetProgress = progress;

    if (-rect.top >= 0 && -rect.top <= trackHeight) {
      isScrollActive = true;
    } else {
      isScrollActive = false;
    }
  };

  // High-performance animation tick
  const renderFrame = (now) => {
    if (!videoDuration && video.duration) {
      videoDuration = video.duration;
    }

    // 1. UI opacity transitions & video progress run with snappy, responsive 120fps progress tracking
    smoothProgress += (targetProgress - smoothProgress) * 0.20;

    if (content) {
      // Rapid title fade out (disappears completely by 0.055 scroll progress, before Card 1 starts at 0.08)
      const mainOpacity = Math.max(0, 1 - (smoothProgress * 18.0));
      content.style.opacity = mainOpacity;
      content.style.pointerEvents = mainOpacity < 0.15 ? 'none' : 'auto';
    }

    cards.forEach(card => {
      const start = parseFloat(card.getAttribute('data-start'));
      const end = parseFloat(card.getAttribute('data-end'));
      const isActive = smoothProgress >= start && smoothProgress <= end;
      card.classList.toggle('active', isActive);
    });

    if (indicator) {
      indicator.style.opacity = Math.max(0, 1 - (smoothProgress * 10));
    }

    // 2. High-Speed 120 FPS All-Intra Keyframe Seeking (8ms sync with 960 frames)
    if (videoDuration && (now - lastSeekTimestamp >= 8)) {
      targetTime = smoothProgress * videoDuration;
      const diff = targetTime - video.currentTime;
      
      if (!video.seeking && Math.abs(diff) > 0.008) {
        let nextTime = video.currentTime + (diff * 0.70); // High-speed 120fps frame tracking
        
        if (nextTime < 0) nextTime = 0;
        if (nextTime > videoDuration - 0.04) nextTime = videoDuration - 0.04;
        
        // Use Safari fastSeek API if available for GPU-accelerated keyframe jumps
        if (video.fastSeek && typeof video.fastSeek === 'function') {
          video.fastSeek(nextTime);
        } else {
          video.currentTime = nextTime;
        }
        lastSeekTimestamp = now;
      }
    }
    
    requestAnimationFrame(renderFrame);
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
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
