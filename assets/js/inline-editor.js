/**
 * BAVARIA Hausbau GmbH – 100% Unabhängiges Agentur Inline-CMS
 * Echte In-Place Direktbearbeitung ohne externe Drittanbieter/Cloud-Dienste.
 * Speichert Änderungen direkt über api/save.php in assets/data/projects.json.
 */

class InlineEditor {
  constructor() {
    this.isEditMode = false;
    this.init();
  }

  init() {
    this.injectStyles();
    this.createEditToggle();
    this.restoreSavedData();

    // Tastenkombination: Cmd+E (Mac) oder Ctrl+E (Windows)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        this.toggleEditMode();
      }
    });
  }

  injectStyles() {
    if (document.getElementById('inline-editor-styles')) return;
    const style = document.createElement('style');
    style.id = 'inline-editor-styles';
    style.textContent = `
      .cms-editable-active [data-cms-field] {
        outline: 2px dashed rgba(197, 168, 128, 0.5) !important;
        outline-offset: 4px;
        transition: outline 0.2s ease, background-color 0.2s ease;
        cursor: text !important;
      }
      .cms-editable-active [data-cms-field]:hover {
        outline: 2px solid var(--color-accent-gold-dark, #C5A880) !important;
        background-color: rgba(197, 168, 128, 0.08) !important;
        border-radius: 4px;
      }
      .cms-editable-active [data-cms-field]:focus {
        outline: 2px solid #008765 !important;
        background-color: #FFFFFF !important;
        color: #0B1727 !important;
        box-shadow: 0 4px 18px rgba(0,0,0,0.15);
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
    if (document.getElementById('cms-toggle-btn')) return;
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
    toast.textContent = '☁️ Speichere Änderung...';
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
    console.log('✏️ Eigenes Inline-CMS aktiviert: Direkt auf der Website schreiben.');
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

        this.saveToServer(projectId, fieldName, newText);
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

  async saveToServer(projectId, fieldName, text) {
    this.showToast('☁️ Speichere Änderung...');

    try {
      const response = await fetch('api/save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          fields: { [fieldName]: text }
        })
      });

      if (response.ok) {
        this.showToast('✅ Erfolgreich gespeichert!');
      } else {
        this.showToast('ℹ️ Lokal im Browser gemerkt');
      }
    } catch (e) {
      this.showToast('ℹ️ Lokal im Browser gemerkt');
    }

    // Always keep backup in localStorage
    try {
      const cache = JSON.parse(localStorage.getItem('bavaria_agency_edits') || '{}');
      if (!cache[projectId]) cache[projectId] = {};
      cache[projectId][fieldName] = text;
      localStorage.setItem('bavaria_agency_edits', JSON.stringify(cache));
    } catch (e) {}
  }

  restoreSavedData() {
    try {
      const cache = JSON.parse(localStorage.getItem('bavaria_agency_edits') || '{}');
      Object.keys(cache).forEach(projectId => {
        const fields = cache[projectId];
        const container = document.getElementById(projectId) || document.body;
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
});
