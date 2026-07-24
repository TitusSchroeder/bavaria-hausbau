/**
 * BAVARIA Hausbau GmbH – Storyblok Headless CMS & Visual Editor Integration
 * Handles real-time live preview inside Storyblok Studio + draft/published story fetching.
 */

const STORYBLOK_TOKEN = 'Rbc7tdK9ZN6RnXXO8jXUhQtt';

class StoryblokCMS {
  constructor() {
    // Detect if page is embedded inside Storyblok Editor iframe
    this.isStoryblokEditor = (window.self !== window.top) || 
                             window.location.search.includes('_storyblok') || 
                             document.referrer.includes('storyblok') ||
                             Boolean(window.storyblok);
    
    this.version = this.isStoryblokEditor ? 'draft' : 'published';
    this.init();
  }

  async init() {
    console.log(`ℹ️ Storyblok Status: Editor-Modus=${this.isStoryblokEditor}, Version=${this.version}`);

    // Always initialize Visual Bridge if in Editor iframe
    if (this.isStoryblokEditor) {
      this.initVisualBridge();
    }

    if (!STORYBLOK_TOKEN || STORYBLOK_TOKEN === 'YOUR_STORYBLOK_PUBLIC_TOKEN') return;

    try {
      const url = `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&version=${this.version}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data && data.stories) {
          console.log(`✅ Storyblok Projektdaten geladen:`, data.stories);
          data.stories.forEach(story => this.updateProjectDOM(story));
        }
      }
    } catch (err) {
      console.warn('⚠️ Storyblok Fetch Hinweis (Verwende Fallback):', err);
    }
  }

  initVisualBridge() {
    const loadBridge = () => {
      if (typeof StoryblokBridge !== 'undefined') {
        console.log('⚡ StoryblokBridge bereit. Registriere Live-Events...');
        const storyblokInstance = new StoryblokBridge();
        
        storyblokInstance.on(['input', 'published', 'change'], (event) => {
          if (event.story) {
            console.log('⚡ Live Event empfangen für:', event.story.name, event.story.content);
            this.updateProjectDOM(event.story);
          }
        });
      } else {
        setTimeout(loadBridge, 200);
      }
    };

    if (!document.getElementById('storyblok-bridge-script')) {
      const script = document.createElement('script');
      script.id = 'storyblok-bridge-script';
      script.src = '//app.storyblok.com/f/storyblok-v2-latest.js';
      script.onload = loadBridge;
      document.head.appendChild(script);
    } else {
      loadBridge();
    }
  }

  // Helper to extract text from string or Storyblok Rich Text object
  parseText(val) {
    if (!val) return '';
    if (typeof val === 'string') return val;
    if (typeof val === 'object' && val.content && Array.isArray(val.content)) {
      return val.content.map(block => {
        if (block.content && Array.isArray(block.content)) {
          return block.content.map(inline => inline.text || '').join('');
        }
        return '';
      }).filter(Boolean).join('\n\n');
    }
    return String(val);
  }

  updateProjectDOM(story) {
    if (!story || !story.content) return;
    const c = story.content;
    const slug = (story.slug || story.name || '').toLowerCase();

    // Map story slug to target element ID(s)
    let targetIds = [];
    if (slug.includes('pulver')) targetIds.push('pulverturm');
    if (slug.includes('neubiberg') || slug.includes('penthouse')) targetIds.push('neubiberg');
    
    // If slug doesn't match specific name, try both
    if (targetIds.length === 0) targetIds = ['pulverturm', 'neubiberg'];

    targetIds.forEach(targetId => {
      const elem = document.getElementById(targetId);
      if (!elem) return;

      console.log(`🔄 Aktualisiere DOM für #${targetId} mit Storyblok-Daten:`, c);

      // 1. Title
      const titleText = this.parseText(c.title);
      if (titleText) {
        const titleNode = elem.querySelector('h2, h3, .card-title');
        if (titleNode) titleNode.textContent = titleText;
      }

      // 2. Tagline
      const tagText = this.parseText(c.tagline);
      if (tagText) {
        const tagNode = elem.querySelector('.tag-label');
        if (tagNode) tagNode.textContent = tagText;
      }

      // 3. Lead / Short Description
      const leadText = this.parseText(c.lead);
      if (leadText) {
        const leadNode = elem.querySelector('.lead, .card-text');
        if (leadNode) leadNode.textContent = leadText;
      }

      // 4. Full Description
      const descText = this.parseText(c.description);
      if (descText) {
        const descNodes = elem.querySelectorAll('p:not(.lead):not(.card-text)');
        if (descNodes.length > 0) {
          descNodes[0].textContent = descText;
        }
      }

      // 5. Main Image
      if (c.main_image) {
        const imgUrl = typeof c.main_image === 'string' ? c.main_image : (c.main_image.filename || '');
        if (imgUrl) {
          const imgNode = elem.querySelector('.card-img-wrapper img, .service-image-box img');
          if (imgNode) imgNode.src = imgUrl;
        }
      }

      // 6. Gallery Thumbnails
      if (c.gallery && Array.isArray(c.gallery) && c.gallery.length > 0) {
        const galleryGrid = elem.querySelector('.project-gallery-grid');
        if (galleryGrid) {
          const mainImgId = targetId === 'pulverturm' ? 'gallery-main-pulverturm' : 'gallery-main-neubiberg';
          let html = '';
          c.gallery.forEach(item => {
            const src = typeof item === 'string' ? item : item.filename;
            const alt = item.alt || 'Projektbild';
            if (src) {
              html += `
                <div class="gallery-thumbnail" style="border-radius: var(--radius-sm); overflow: hidden; cursor: pointer;" onclick="document.getElementById('${mainImgId}').src='${src}'">
                  <img src="${src}" alt="${alt}" style="width: 100%; height: 65px; object-fit: cover;">
                </div>`;
            }
          });
          if (html) galleryGrid.innerHTML = html;
        }
      }
    });
  }
}

// Instantiate CMS handler
document.addEventListener('DOMContentLoaded', () => {
  window.storyblokCMS = new StoryblokCMS();
});
