/**
 * BAVARIA Hausbau GmbH – Storyblok Headless CMS & Visual Editor Integration
 * Handles live preview inside Storyblok Studio + fetching published stories from Storyblok CDN.
 * Falls back gracefully to local static projects.json if token is not set.
 */

// Official Storyblok Public API Token for BAVARIA Hausbau GmbH
const STORYBLOK_TOKEN = 'Rbc7tdK9ZN6RnXXO8jXUhQtt';
const STORYBLOK_API_URL = `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&version=published`;

class StoryblokCMS {
  constructor() {
    this.isConfigured = STORYBLOK_TOKEN && STORYBLOK_TOKEN !== 'YOUR_STORYBLOK_PUBLIC_TOKEN';
    this.init();
  }

  async init() {
    if (!this.isConfigured) {
      console.log('ℹ️ Storyblok Token nicht gesetzt. Verwendungsmodus: Lokale statische Projektdaten (Fallback).');
      return;
    }

    try {
      const response = await fetch(STORYBLOK_API_URL);
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();

      if (data && data.stories && data.stories.length > 0) {
        console.log('✅ Projektexposés erfolgreich von Storyblok Headless CMS geladen:', data.stories);
        this.renderProjects(data.stories);
      }
    } catch (err) {
      console.warn('⚠️ Fehler beim Abrufen der Storyblok-Daten (Verwende Fallback):', err);
    }

    this.initVisualBridge();
  }

  initVisualBridge() {
    // Check if running inside Storyblok Visual Editor iframe
    if (window.location.search.includes('_storyblok') || window.storyblok) {
      const script = document.createElement('script');
      script.src = '//app.storyblok.com/f/storyblok-v2-latest.js';
      script.onload = () => {
        const storyblokInstance = new StoryblokBridge();
        storyblokInstance.on(['input', 'published', 'change'], (event) => {
          if (event.action === 'input' || event.action === 'change') {
            console.log('⚡ Storyblok Live Event empfangen:', event.story);
            window.location.reload();
          }
        });
      };
      document.head.appendChild(script);
    }
  }

  renderProjects(stories) {
    // Map Storyblok stories to DOM components on index.html or referenzen.html
    stories.forEach(story => {
      const content = story.content;
      const slug = story.slug || content.id;

      // Update DOM element for this project if present
      const projectElem = document.getElementById(slug);
      if (projectElem) {
        if (content.title) {
          const titleElem = projectElem.querySelector('h2, h3');
          if (titleElem) titleElem.textContent = content.title;
        }
        if (content.lead) {
          const leadElem = projectElem.querySelector('.lead, .card-text');
          if (leadElem) leadElem.textContent = content.lead;
        }
        if (content.main_image && content.main_image.filename) {
          const imgElem = projectElem.querySelector('.card-img-wrapper img, .service-image-box img');
          if (imgElem) imgElem.src = content.main_image.filename;
        }
      }
    });
  }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.storyblokCMS = new StoryblokCMS();
});
