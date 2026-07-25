/**
 * BAVARIA Hausbau GmbH – In-Place Inline Editor & Storyblok Cloud Sync
 * Enables direct on-page text editing with automatic saving to Storyblok Cloud via Management API.
 */

const STORYBLOK_PAT = 'sb_pat_CiWUt3KtnzGu08jp-6v72SD196aQ6vIMzZDAlN4S6Gs';
const STORYBLOK_SPACE_ID = '294076341539422';

const STORY_MAP = {
  'pulverturm': '201690421508762',
  'neubiberg': '201683968043875'
};

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
    
    // Auto-enable edit mode if inside Storyblok Studio iframe
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
        outline: 2px dashed rgba(197, 168, 128, 0.5);
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
      .cms-syncing-toast {
        position: fixed;
        bottom: 80px;
        right: 24px;
        z-index: 99999;
        background: #008765;
        color: #FFFFFF;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        opacity: 0;
        transition: opacity 0.3s ease;
      }
      .cms-syncing-toast.show {
        opacity: 1;
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

    const toast = document.createElement('div');
    toast.className = 'cms-syncing-toast';
    toast.id = 'cms-toast';
    toast.textContent = '☁️ Speichere in Storyblok Cloud...';
    document.body.appendChild(toast);
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

    this.makeFieldsEditable();
    console.log('✏️ Inline-Bearbeitungsmodus AKTIVIERT. Klicken Sie auf ein beliebiges Wort!');
  }

  disableEditMode() {
    this.isEditMode = false;
    document.body.classList.remove('cms-editable-active');
    
    const badge = document.getElementById('cms-toggle-btn');
    if (badge) {
      badge.classList.remove('active');
      badge.querySelector('.lbl').textContent = 'Direkt-Bearbeitung ✏️';
    }

    document.querySelectorAll('[data-cms-field]').forEach(node => {
      node.removeAttribute('contenteditable');
    });
    console.log('🔒 Inline-Bearbeitungsmodus DEAKTIVIERT.');
  }

  makeFieldsEditable() {
    const editableNodes = document.querySelectorAll('[data-cms-field]');
    
    editableNodes.forEach(node => {
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');

      node.onblur = () => {
        const fieldName = node.getAttribute('data-cms-field');
        const parentProject = node.closest('#pulverturm, #neubiberg, [id]');
        const projectId = parentProject ? parentProject.id : 'pulverturm';
        const newText = node.innerText.trim();

        this.syncToStoryblok(projectId, fieldName, newText);
      };

      node.onkeydown = (e) => {
        if (e.key === 'Enter' && (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.classList.contains('tag-label'))) {
          e.preventDefault();
          node.blur();
        }
      };
    });
  }

  showToast(msg) {
    const toast = document.getElementById('cms-toast');
    if (toast) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2500);
    }
  }

  async syncToStoryblok(projectId, fieldName, text) {
    const storyId = STORY_MAP[projectId];
    if (!storyId || !STORYBLOK_PAT) {
      console.warn('Keine Story ID oder Token vorhanden für', projectId);
      return;
    }

    this.showToast('☁️ Speichere in Storyblok Cloud...');
    console.log(`☁️ Speichere Feld "${fieldName}" von [${projectId}] in Storyblok Cloud: "${text}"`);

    // Prepare Management API PUT payload
    const formatValue = (fieldName === 'description') ? {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: text }] }]
    } : text;

    const payload = {
      story: {
        content: {
          component: 'project',
          [fieldName]: formatValue
        }
      },
      publish: 1
    };

    try {
      const url = `https://mapi.storyblok.com/v1/spaces/${STORYBLOK_SPACE_ID}/stories/${storyId}`;
      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Authorization': STORYBLOK_PAT,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        console.log('✅ Erfolgreich in Storyblok Cloud gespeichert!');
        this.showToast('✅ In Storyblok gespeichert & veröffentlicht!');
      } else {
        const errData = await res.json();
        console.warn('⚠️ Speichern in Storyblok nicht möglich:', errData);
        this.showToast('⚠️ Hinweis beim Speichern');
      }
    } catch (e) {
      console.warn('⚠️ Netzwerkfehler beim Cloud-Speichern:', e);
      this.showToast('⚠️ Offline – Lokal im Browser gemerkt');
    }

    // Backup in LocalStorage
    try {
      const cache = JSON.parse(localStorage.getItem('bavaria_cms_edits') || '{}');
      if (!cache[projectId]) cache[projectId] = {};
      cache[projectId][fieldName] = text;
      localStorage.setItem('bavaria_cms_edits', JSON.stringify(cache));
    } catch (e) {}
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
    } catch (e) {}
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.inlineEditor = new InlineEditor();
  window.inlineEditor.restoreCachedEdits();
});
