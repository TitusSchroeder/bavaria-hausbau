/**
 * BAVARIA Hausbau GmbH – In-Place Inline Editor
 * Enables direct on-page text editing (contenteditable) with live Storyblok & Local Storage sync.
 */

class InlineEditor {
  constructor() {
    this.isStoryblokEditor = (window.self !== window.top) || 
                             window.location.search.includes('_storyblok') || 
                             document.referrer.includes('storyblok');
    
    this.isEditMode = false;
    this.init();
  }

  init() {
    this.injectStyles();
    this.createEditToggle();
    
    // Automatically enable edit mode if inside Storyblok Studio iframe
    if (this.isStoryblokEditor) {
      this.enableEditMode();
    }

    // Keyboard shortcut: Cmd+E or Ctrl+E to toggle inline editing
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.toggleEditMode();
      }
    });
  }

  injectStyles() {
    const style = document.createElement('style');
    style.id = 'inline-editor-styles';
    style.textContent = `
      .cms-editable-active [data-cms-field] {
        outline: 2px dashed rgba(197, 168, 128, 0.4);
        outline-offset: 4px;
        transition: outline 0.2s ease, background-color 0.2s ease;
        cursor: text !important;
      }
      .cms-editable-active [data-cms-field]:hover {
        outline: 2px solid var(--color-accent-gold-dark, #C5A880);
        background-color: rgba(197, 168, 128, 0.08);
        border-radius: 4px;
      }
      .cms-editable-active [data-cms-field]:focus {
        outline: 2px solid #008765 !important;
        background-color: #FFFFFF !important;
        box-shadow: 0 4px 14px rgba(0,0,0,0.1);
        border-radius: 4px;
      }
      .cms-toggle-badge {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 99999;
        background: #0F1E36;
        color: #FFFFFF;
        border: 1px solid rgba(197, 168, 128, 0.6);
        border-radius: 30px;
        padding: 10px 18px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 0.85rem;
        font-weight: 700;
        cursor: pointer;
        box-shadow: 0 8px 24px rgba(0,0,0,0.25);
        display: flex;
        align-items: center;
        gap: 8px;
        transition: transform 0.2s ease, background 0.2s ease;
      }
      .cms-toggle-badge:hover {
        transform: translateY(-2px);
        background: #1E293B;
      }
      .cms-toggle-badge .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #FF4D4D;
      }
      .cms-toggle-badge.active .dot {
        background: #00D09C;
      }
    `;
    document.head.appendChild(style);
  }

  createEditToggle() {
    const badge = document.createElement('button');
    badge.className = 'cms-toggle-badge';
    badge.id = 'cms-toggle-btn';
    badge.innerHTML = `<span class="dot"></span> <span class="lbl">Direkt-Bearbeitung ✏️</span>`;
    badge.title = 'Klicken oder Tastenkombination Cmd+E / Ctrl+E zum Umschalten';
    
    badge.addEventListener('click', () => this.toggleEditMode());
    document.body.appendChild(badge);
  }

  toggleEditMode() {
    this.isEditMode ? this.disableEditMode() : this.enableEditMode();
  }

  enableEditMode() {
    this.isEditMode = true;
    document.body.classList.add('cms-editable-active');
    
    const badge = document.getElementById('cms-toggle-btn');
    if (badge) {
      badge.classList.add('active');
      badge.querySelector('.lbl').textContent = 'Bearbeiten AKTIV ✏️';
    }

    // Make all CMS field elements editable directly on the page
    this.makeFieldsEditable();
    console.log('✏️ Inline-Bearbeitungsmodus AKTIVIERT. Klicken Sie direkt auf jeden Text auf der Website!');
  }

  disableEditMode() {
    this.isEditMode = false;
    document.body.classList.remove('cms-editable-active');
    
    const badge = document.getElementById('cms-toggle-btn');
    if (badge) {
      badge.classList.remove('active');
      badge.querySelector('.lbl').textContent = 'Direkt-Bearbeitung ✏️';
    }

    // Remove contenteditable attributes
    document.querySelectorAll('[data-cms-field]').forEach(node => {
      node.removeAttribute('contenteditable');
    });
    console.log('🔒 Inline-Bearbeitungsmodus DEAKTIVIERT.');
  }

  makeFieldsEditable() {
    // Select all elements tagged for CMS editing
    const editableNodes = document.querySelectorAll('[data-cms-field]');
    
    editableNodes.forEach(node => {
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');

      // Sync changes when user finishes typing
      node.onblur = () => {
        const fieldName = node.getAttribute('data-cms-field');
        const parentProject = node.closest('#pulverturm, #neubiberg, [id]');
        const projectId = parentProject ? parentProject.id : 'global';
        const newText = node.innerText.trim();

        this.syncChange(projectId, fieldName, newText);
      };

      // Optional: Prevent Enter key from inserting breaks in single-line titles
      node.onkeydown = (e) => {
        if (e.key === 'Enter' && (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.classList.contains('tag-label'))) {
          e.preventDefault();
          node.blur();
        }
      };
    });
  }

  syncChange(projectId, fieldName, text) {
    console.log(`💾 Speichere Live-Änderung: [${projectId}] ${fieldName} => "${text}"`);

    // 1. If Storyblok Bridge is available, notify Storyblok
    if (window.storyblok && typeof window.storyblok.send === 'function') {
      window.storyblok.send({
        action: 'input',
        field: fieldName,
        value: text,
        projectId: projectId
      });
    }

    // 2. Save locally in Storage cache for instant persistence across reloads
    try {
      const cache = JSON.parse(localStorage.getItem('bavaria_cms_edits') || '{}');
      if (!cache[projectId]) cache[projectId] = {};
      cache[projectId][fieldName] = text;
      localStorage.setItem('bavaria_cms_edits', JSON.stringify(cache));
    } catch (e) {
      console.warn('LocalStorage Cache notice:', e);
    }
  }

  restoreCachedEdits() {
    try {
      const cache = JSON.parse(localStorage.getItem('bavaria_cms_edits') || '{}');
      Object.keys(cache).forEach(projectId => {
        const fields = cache[projectId];
        const container = projectId === 'global' ? document.body : document.getElementById(projectId);
        if (container) {
          Object.keys(fields).forEach(fieldName => {
            const node = container.querySelector(`[data-cms-field="${fieldName}"]`);
            if (node) node.innerText = fields[fieldName];
          });
        }
      });
    } catch (e) {
      console.warn('Could not restore cached edits:', e);
    }
  }
}

// Instantiate Inline Editor on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  window.inlineEditor = new InlineEditor();
  window.inlineEditor.restoreCachedEdits();
});
