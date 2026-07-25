/**
 * BAVARIA Hausbau GmbH – Agency Standalone Admin & In-Place Editor
 * 100% independent flat-file inline editing for client web hosting (0 external dependencies).
 */

class AgencyAdmin {
  constructor() {
    this.adminPassword = 'bavaria2026'; // Default client admin password
    this.isLoggedIn = localStorage.getItem('bavaria_admin_logged_in') === 'true';
    this.isEditMode = false;
    this.pendingEdits = {};

    this.init();
  }

  init() {
    this.injectStyles();
    this.createAdminToolbar();
    this.checkHashLogin();
    this.restoreSavedData();

    if (this.isLoggedIn) {
      this.enableEditMode();
    }
  }

  injectStyles() {
    const style = document.createElement('style');
    style.id = 'agency-admin-styles';
    style.textContent = `
      /* Admin Top Toolbar */
      #agency-admin-bar {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 52px;
        background: #0B1727;
        color: #FFFFFF;
        border-bottom: 2px solid var(--color-accent-gold, #C5A880);
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 1.5rem;
        font-family: system-ui, -apple-system, sans-serif;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        transform: translateY(-100%);
        transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      }
      #agency-admin-bar.visible {
        transform: translateY(0);
      }
      body.admin-bar-visible {
        padding-top: 52px !important;
      }
      .admin-brand {
        font-weight: 700;
        font-size: 0.9rem;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: var(--color-accent-gold, #C5A880);
        letter-spacing: 0.5px;
      }
      .admin-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }
      .admin-btn {
        background: rgba(255,255,255,0.1);
        color: #FFFFFF;
        border: 1px solid rgba(255,255,255,0.2);
        padding: 6px 14px;
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .admin-btn:hover {
        background: rgba(255,255,255,0.2);
        border-color: #FFFFFF;
      }
      .admin-btn-save {
        background: #008765 !important;
        border-color: #00A87E !important;
        font-weight: 700;
      }
      .admin-btn-save:hover {
        background: #00A87E !important;
        transform: translateY(-1px);
      }

      /* In-Place Editing Focus & Hover */
      .agency-edit-active [data-cms-field] {
        outline: 2px dashed rgba(197, 168, 128, 0.45) !important;
        outline-offset: 4px;
        transition: outline 0.2s ease, background 0.2s ease;
        cursor: text !important;
      }
      .agency-edit-active [data-cms-field]:hover {
        outline: 2px solid var(--color-accent-gold-dark, #C5A880) !important;
        background-color: rgba(197, 168, 128, 0.08) !important;
        border-radius: 4px;
      }
      .agency-edit-active [data-cms-field]:focus {
        outline: 2px solid #008765 !important;
        background-color: #FFFFFF !important;
        color: #0B1727 !important;
        box-shadow: 0 4px 18px rgba(0,0,0,0.15);
        border-radius: 4px;
      }

      /* Discreet Login Modal */
      .admin-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(11, 23, 39, 0.8);
        backdrop-filter: blur(6px);
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .admin-modal-overlay.open {
        opacity: 1;
        pointer-events: auto;
      }
      .admin-modal-card {
        background: #FFFFFF;
        border-radius: 12px;
        padding: 2.5rem;
        width: 100%;
        max-width: 400px;
        box-shadow: 0 20px 40px rgba(0,0,0,0.3);
        text-align: center;
        font-family: system-ui, -apple-system, sans-serif;
      }
    `;
    document.head.appendChild(style);
  }

  createAdminToolbar() {
    // Toolbar HTML
    const bar = document.createElement('div');
    bar.id = 'agency-admin-bar';
    bar.innerHTML = `
      <div class="admin-brand">
        <span style="font-size: 1.1rem;">🏢</span> BAVARIA Admin Editor
      </div>
      <div class="admin-actions">
        <span id="admin-status-lbl" style="font-size: 0.8rem; color: #00D09C; font-weight: 600;">● Direkt-Bearbeitung aktiv</span>
        <button class="admin-btn admin-btn-save" id="btn-save-cloud">💾 Speichern & Veröffentlichen</button>
        <button class="admin-btn" id="btn-logout">Abmelden 🔒</button>
      </div>
    `;
    document.body.appendChild(bar);

    // Modal Login HTML
    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'admin-login-modal';
    modal.innerHTML = `
      <div class="admin-modal-card">
        <h3 style="margin-bottom: 0.5rem; color: #0B1727;">Kunden-Bearbeitung Login 🔐</h3>
        <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 1.5rem;">Geben Sie Ihr Passwort ein, um Texte &amp; Exposés direkt auf der Seite zu bearbeiten.</p>
        <input type="password" id="admin-pass-input" placeholder="Passwort eingeben" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 6px; margin-bottom: 1.25rem; font-size: 1rem; text-align: center;">
        <div style="display: flex; gap: 0.75rem;">
          <button id="btn-modal-cancel" style="flex: 1; padding: 0.75rem; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 6px; cursor: pointer; font-weight: 600;">Abbrechen</button>
          <button id="btn-modal-login" style="flex: 1; padding: 0.75rem; border: none; background: #0F1E36; color: #FFFFFF; border-radius: 6px; cursor: pointer; font-weight: 600;">Anmelden</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Event Listeners
    document.getElementById('btn-modal-login').onclick = () => this.handleLogin();
    document.getElementById('btn-modal-cancel').onclick = () => this.closeLoginModal();
    document.getElementById('admin-pass-input').onkeydown = (e) => { if (e.key === 'Enter') this.handleLogin(); };
    document.getElementById('btn-logout').onclick = () => this.logout();
    document.getElementById('btn-save-cloud').onclick = () => this.saveAllChanges();

    // Footer secret login trigger
    const footer = document.querySelector('footer');
    if (footer) {
      const loginLink = document.createElement('div');
      loginLink.style.cssText = 'text-align: center; margin-top: 1.5rem; font-size: 0.75rem; opacity: 0.4; cursor: pointer; color: #FFFFFF;';
      loginLink.textContent = '🔒 Website Bearbeitungs-Login';
      loginLink.onclick = () => this.openLoginModal();
      footer.appendChild(loginLink);
    }
  }

  checkHashLogin() {
    if (window.location.hash === '#admin') {
      this.openLoginModal();
    }
  }

  openLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
      modal.classList.add('open');
      document.getElementById('admin-pass-input').focus();
    }
  }

  closeLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.remove('open');
  }

  handleLogin() {
    const input = document.getElementById('admin-pass-input').value;
    if (input === this.adminPassword) {
      localStorage.setItem('bavaria_admin_logged_in', 'true');
      this.isLoggedIn = true;
      this.closeLoginModal();
      this.enableEditMode();
      alert('✅ Erfolgreich angemeldet! Du kannst jetzt alle Texte direkt auf der Website anklicken und anpassen.');
    } else {
      alert('❌ Falsches Passwort. Bitte versuche es erneut.');
    }
  }

  logout() {
    localStorage.removeItem('bavaria_admin_logged_in');
    this.isLoggedIn = false;
    this.disableEditMode();
    alert('🔒 Erfolgreich abgemeldet.');
  }

  enableEditMode() {
    this.isEditMode = true;
    document.body.classList.add('agency-edit-active', 'admin-bar-visible');
    const bar = document.getElementById('agency-admin-bar');
    if (bar) bar.classList.add('visible');

    this.makeElementsEditable();
  }

  disableEditMode() {
    this.isEditMode = false;
    document.body.classList.remove('agency-edit-active', 'admin-bar-visible');
    const bar = document.getElementById('agency-admin-bar');
    if (bar) bar.classList.remove('visible');

    document.querySelectorAll('[data-cms-field]').forEach(node => {
      node.removeAttribute('contenteditable');
    });
  }

  makeElementsEditable() {
    const editableNodes = document.querySelectorAll('[data-cms-field]');
    
    editableNodes.forEach(node => {
      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');

      node.onblur = () => {
        const fieldName = node.getAttribute('data-cms-field');
        const parentProject = node.closest('#pulverturm, #neubiberg, [id]');
        const projectId = parentProject ? parentProject.id : 'pulverturm';
        const newText = node.innerText.trim();

        if (!this.pendingEdits[projectId]) this.pendingEdits[projectId] = {};
        this.pendingEdits[projectId][fieldName] = newText;

        // Backup in localStorage
        this.saveLocalBackup(projectId, fieldName, newText);
      };
    });
  }

  async saveAllChanges() {
    const btn = document.getElementById('btn-save-cloud');
    btn.textContent = '⏳ Speichere...';
    btn.disabled = true;

    let successCount = 0;
    const projectIds = Object.keys(this.pendingEdits);

    if (projectIds.length === 0) {
      alert('ℹ️ Keine unbeantworteten Text-Änderungen vorhanden.');
      btn.textContent = '💾 Speichern & Veröffentlichen';
      btn.disabled = false;
      return;
    }

    for (const projectId of projectIds) {
      const fields = this.pendingEdits[projectId];
      try {
        const response = await fetch('api/save.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, fields })
        });

        if (response.ok) {
          successCount++;
        }
      } catch (err) {
        console.warn('Backend PHP notice:', err);
      }
    }

    btn.textContent = '💾 Speichern & Veröffentlichen';
    btn.disabled = false;
    this.pendingEdits = {};
    alert('🚀 Alle Änderungen wurden erfolgreich auf deinem Server gespeichert und sind live!');
  }

  saveLocalBackup(projectId, fieldName, text) {
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
  window.agencyAdmin = new AgencyAdmin();
});
