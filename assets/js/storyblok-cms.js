/**
 * BAVARIA Hausbau GmbH – Storyblok Headless CMS & Visual Editor Integration
 * Live rendering of draft & published stories + real-time DOM updates inside Storyblok Visual Editor.
 */

const STORYBLOK_TOKEN = 'Rbc7tdK9ZN6RnXXO8jXUhQtt';

class StoryblokCMS {
  constructor() {
    this.isStoryblokEditor = window.location.search.includes('_storyblok') || Boolean(window.storyblok);
    this.version = this.isStoryblokEditor ? 'draft' : 'published';
    this.apiUrl = `https://api.storyblok.com/v2/cdn/stories?token=${STORYBLOK_TOKEN}&version=${this.version}`;
    this.init();
  }

  async init() {
    if (!STORYBLOK_TOKEN) return;

    try {
      const response = await fetch(this.apiUrl);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();
      
      if (data && data.stories) {
        console.log(`✅ Storyblok Projektdaten (${this.version}) geladen:`, data.stories);
        data.stories.forEach(story => this.updateProjectDOM(story));
      }
    } catch (err) {
      console.warn('⚠️ Storyblok Fetch Hinweis (Verwende Fallback):', err);
    }

    this.initVisualBridge();
  }

  initVisualBridge() {
    if (this.isStoryblokEditor) {
      const script = document.createElement('script');
      script.src = '//app.storyblok.com/f/storyblok-v2-latest.js';
      script.onload = () => {
        if (typeof StoryblokBridge !== 'undefined') {
          const storyblokInstance = new StoryblokBridge();
          storyblokInstance.on(['input', 'published', 'change'], (event) => {
            if (event.story) {
              console.log('⚡ Storyblok Live Event:', event.story.name, event.story.content);
              this.updateProjectDOM(event.story);
            }
          });
        }
      };
      document.head.appendChild(script);
    }
  }

  updateProjectDOM(story) {
    if (!story || !story.content) return;
    const c = story.content;
    const slug = (story.slug || story.name || '').toLowerCase();

    // Map possible slugs to DOM element IDs
    let targetId = null;
    if (slug.includes('pulver')) targetId = 'pulverturm';
    else if (slug.includes('neubiberg') || slug.includes('penthouse')) targetId = 'neubiberg';

    if (!targetId) return;

    const elem = document.getElementById(targetId);
    if (!elem) return;

    // 1. Update Title
    if (c.title) {
      const titleNode = elem.querySelector('h2, h3, .card-title');
      if (titleNode) titleNode.textContent = c.title;
    }

    // 2. Update Tagline / Location
    if (c.tagline) {
      const tagNode = elem.querySelector('.tag-label');
      if (tagNode) tagNode.textContent = c.tagline;
    }

    // 3. Update Lead / Description
    if (c.lead || c.description) {
      const leadNode = elem.querySelector('.lead, .card-text');
      if (leadNode) leadNode.textContent = c.lead || c.description;
    }

    // 4. Update Main Image
    if (c.main_image) {
      const imgUrl = typeof c.main_image === 'string' ? c.main_image : (c.main_image.filename || '');
      if (imgUrl) {
        const imgNode = elem.querySelector('.card-img-wrapper img, .service-image-box img');
        if (imgNode) imgNode.src = imgUrl;
      }
    }

    // 5. Update Gallery Thumbnails if present
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
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.storyblokCMS = new StoryblokCMS();
});
