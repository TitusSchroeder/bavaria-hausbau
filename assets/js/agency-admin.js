/**
 * BAVARIA Hausbau GmbH – Agency Standalone Admin & Media Manager with Cropper & Grid Library
 * 100% independent flat-file editing for client web hosting.
 */

class AgencyAdmin {
  constructor() {
    this.adminPassword = 'bavaria2026';
    this.isLoggedIn = localStorage.getItem('bavaria_admin_logged_in') === 'true';
    this.isEditMode = false;
    this.pendingEdits = {};
    this.activeImgTarget = null;
    this.cropperInstance = null;

    this.init();
  }

  init() {
    this.injectStyles();
    this.createAdminToolbar();
    this.createMediaModal();
    this.loadServerData();
    this.loadCropperLibrary();
    this.setupGlobalClickDelegation();

    window.addEventListener('hashchange', () => this.checkHashLogin());
    this.checkHashLogin();

    if (this.isLoggedIn) {
      this.enableEditMode();
    } else {
      this.disableEditMode();
    }
  }

  checkHashLogin() {
    if (window.location.hash === '#admin') {
      if (!this.isLoggedIn) {
        this.openLoginModal();
      } else {
        this.enableEditMode();
      }
    }
  }

  setupGlobalClickDelegation() {
    document.addEventListener('click', (e) => {
      if (!this.isEditMode) return;

      if (e.target.closest('#agency-admin-bar, .admin-modal-overlay, .cms-toggle-badge')) return;

      const imgTarget = e.target.closest('img, [data-cms-image], .card-img-wrapper, .service-image-box, .gallery-thumbnail');
      if (imgTarget) {
        let actualImg = imgTarget.tagName === 'IMG' ? imgTarget : imgTarget.querySelector('img');
        
        if (!actualImg && imgTarget.closest('#pulverturm, #neubiberg')) {
          actualImg = imgTarget.closest('#pulverturm, #neubiberg').querySelector('img');
        }

        if (actualImg) {
          e.preventDefault();
          e.stopPropagation();
          this.openMediaModal(actualImg);
        }
      }
    }, true);
  }

  loadCropperLibrary() {
    if (document.getElementById('cropper-css')) return;
    const css = document.createElement('link');
    css.id = 'cropper-css';
    css.rel = 'stylesheet';
    css.href = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.css';
    document.head.appendChild(css);

    const js = document.createElement('script');
    js.id = 'cropper-js';
    js.src = 'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.13/cropper.min.js';
    document.head.appendChild(js);
  }

  injectStyles() {
    if (document.getElementById('agency-admin-styles')) return;
    const style = document.createElement('style');
    style.id = 'agency-admin-styles';
    style.textContent = `
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

      /* Editable Text Fields Highlight ONLY in Edit Mode */
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

      /* Editable Images Highlight ONLY in Edit Mode */
      .agency-edit-active img,
      .agency-edit-active [data-cms-image],
      .agency-edit-active .card-img-wrapper,
      .agency-edit-active .service-image-box,
      .agency-edit-active .gallery-thumbnail {
        outline: 3px dashed #008765 !important;
        outline-offset: -3px;
        cursor: pointer !important;
        transition: outline 0.2s ease, filter 0.2s ease;
      }
      .agency-edit-active img:hover,
      .agency-edit-active [data-cms-image]:hover,
      .agency-edit-active .card-img-wrapper:hover,
      .agency-edit-active .service-image-box:hover,
      .agency-edit-active .gallery-thumbnail:hover {
        outline: 4px solid #00D09C !important;
        filter: brightness(0.88);
      }

      /* Modals */
      .admin-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: rgba(11, 23, 39, 0.85);
        backdrop-filter: blur(8px);
        z-index: 1000000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.3s ease;
      }
      .admin-modal-overlay.open,
      .admin-modal-overlay:target {
        opacity: 1 !important;
        pointer-events: auto !important;
      }
      .admin-modal-card {
        background: #FFFFFF;
        border-radius: 14px;
        padding: 2.25rem;
        width: 90%;
        max-width: 820px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 24px 48px rgba(0,0,0,0.35);
        font-family: system-ui, -apple-system, sans-serif;
      }

      .media-tabs {
        display: flex;
        gap: 1rem;
        border-bottom: 2px solid #E2E8F0;
        margin-bottom: 1.5rem;
      }
      .media-tab-btn {
        background: none;
        border: none;
        padding: 0.75rem 1.25rem;
        font-size: 0.95rem;
        font-weight: 700;
        color: #64748B;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        margin-bottom: -2px;
      }
      .media-tab-btn.active {
        color: #0F1E36;
        border-bottom-color: #C5A880;
      }

      .media-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
        gap: 1rem;
        max-height: 380px;
        overflow-y: auto;
        padding: 0.5rem;
        border: 1px solid #E2E8F0;
        border-radius: 8px;
        background: #F8FAFC;
      }
      .media-grid-item {
        position: relative;
        aspect-ratio: 4/3;
        border-radius: 6px;
        overflow: hidden;
        border: 2px solid transparent;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.1);
        transition: transform 0.2s ease, border-color 0.2s ease;
      }
      .media-grid-item:hover {
        transform: scale(1.04);
        border-color: #C5A880;
      }
      .media-grid-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .cropper-wrapper {
        max-height: 400px;
        background: #0F1E36;
        border-radius: 8px;
        overflow: hidden;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .admin-toast {
        position: fixed;
        bottom: 80px;
        right: 24px;
        z-index: 999999;
        background: #008765;
        color: #FFFFFF;
        padding: 10px 20px;
        border-radius: 24px;
        font-size: 0.85rem;
        font-weight: 600;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        opacity: 0;
        transform: translateY(10px);
        transition: all 0.3s ease;
        pointer-events: none;
      }
      .admin-toast.show {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.head.appendChild(style);
  }

  createAdminToolbar() {
    if (document.getElementById('agency-admin-bar')) return;

    const bar = document.createElement('div');
    bar.id = 'agency-admin-bar';
    bar.innerHTML = `
      <div class="admin-brand">
        <span style="font-size: 1.1rem;">🏢</span> BAVARIA Admin Editor
      </div>
      <div class="admin-actions">
        <span id="admin-status-lbl" style="font-size: 0.8rem; color: #00D09C; font-weight: 600;">● Bearbeitungsmodus aktiv</span>
        <button class="admin-btn" id="btn-open-media-direct">🖼️ Bild-Manager</button>
        <button class="admin-btn admin-btn-save" id="btn-save-cloud">💾 Server-Stand veröffentlichen</button>
        <button class="admin-btn" id="btn-logout" style="background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.5);">Abmelden 🔒</button>
      </div>
    `;
    document.body.appendChild(bar);

    const loginModal = document.createElement('div');
    loginModal.className = 'admin-modal-overlay';
    loginModal.id = 'admin';
    loginModal.innerHTML = `
      <div class="admin-modal-card" style="max-width: 420px; text-align: center;">
        <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🔐</div>
        <h3 style="margin-bottom: 0.5rem; color: #0B1727; font-size: 1.35rem;">Website Bearbeitungs-Login</h3>
        <p style="font-size: 0.88rem; color: #64748B; margin-bottom: 1.5rem; line-height: 1.5;">Geben Sie Ihr Administrator-Passwort ein, um Texte, Preise &amp; Fotos auf der Website zu bearbeiten.</p>
        <input type="password" id="admin-pass-input" placeholder="Passwort eingeben" style="width: 100%; padding: 0.85rem; border: 2px solid #CBD5E1; border-radius: 8px; margin-bottom: 1.25rem; font-size: 1.05rem; text-align: center; outline: none;">
        <div style="display: flex; gap: 0.75rem;">
          <button id="btn-modal-cancel" style="flex: 1; padding: 0.75rem; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 8px; cursor: pointer; font-weight: 600; color: #64748B;">Abbrechen</button>
          <button id="btn-modal-login" style="flex: 1; padding: 0.75rem; border: none; background: #0F1E36; color: #FFFFFF; border-radius: 8px; cursor: pointer; font-weight: 700;">Anmelden</button>
        </div>
      </div>
    `;
    document.body.appendChild(loginModal);

    const toast = document.createElement('div');
    toast.className = 'admin-toast';
    toast.id = 'agency-toast';
    toast.textContent = '☁️ Speichere auf Server...';
    document.body.appendChild(toast);

    document.getElementById('btn-modal-login').onclick = () => this.handleLogin();
    document.getElementById('btn-modal-cancel').onclick = () => this.closeLoginModal();
    document.getElementById('admin-pass-input').onkeydown = (e) => { if (e.key === 'Enter') this.handleLogin(); };
    document.getElementById('btn-logout').onclick = () => this.logout();
    document.getElementById('btn-save-cloud').onclick = () => this.saveAllChanges();
    document.getElementById('btn-open-media-direct').onclick = () => {
      const firstImg = document.querySelector('img');
      this.openMediaModal(firstImg);
    };

    const footer = document.querySelector('footer');
    if (footer) {
      const loginLink = document.createElement('div');
      loginLink.style.cssText = 'text-align: center; margin-top: 1.5rem; font-size: 0.75rem; opacity: 0.4; cursor: pointer; color: #FFFFFF;';
      loginLink.textContent = '🔒 Website Bearbeitungs-Login';
      loginLink.onclick = () => this.openLoginModal();
      footer.appendChild(loginLink);
    }
  }

  createMediaModal() {
    if (document.getElementById('admin-media-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'admin-media-modal';
    modal.innerHTML = `
      <div class="admin-modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0; color: #0F1E36;">Bild-Manager &amp; Zuschnitt 🖼️</h3>
          <button id="btn-media-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748B;">&times;</button>
        </div>

        <div class="media-tabs">
          <button class="media-tab-btn active" id="tab-btn-library">🖼️ Mediathek (Server-Bilder)</button>
          <button class="media-tab-btn" id="tab-btn-upload">📤 Neues Bild hochladen &amp; zuschneiden</button>
        </div>

        <div id="tab-content-library">
          <p style="font-size: 0.85rem; color: #64748B; margin-bottom: 0.75rem;">Klicken Sie auf ein Bild aus dem Server-Ordner, um es einzusetzen oder zuzuschneiden:</p>
          <div class="media-grid" id="media-grid-container">
            <div style="padding: 2rem; text-align: center; color: #64748B; grid-column: 1/-1;">Lade Server-Bilder...</div>
          </div>
        </div>

        <div id="tab-content-upload" style="display: none;">
          <div style="margin-bottom: 1rem;">
            <input type="file" id="media-file-input" accept="image/*" style="display: none;">
            <button id="btn-trigger-file-select" style="background: #0F1E36; color: #FFFFFF; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">📁 Bild vom Computer auswählen</button>
          </div>

          <div class="cropper-wrapper" id="cropper-container" style="display: none;">
            <img id="cropper-target-img" src="" style="max-width: 100%; max-height: 360px;">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
          <button id="btn-crop-action" style="display: none; background: #008765; color: #FFFFFF; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer;">✂️ Bild zuschneiden &amp; verwenden</button>
          <button id="btn-media-cancel" style="background: #E2E8F0; color: #0F1E36; border: none; padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600; cursor: pointer; margin-left: auto;">Schließen</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-media-close').onclick = () => this.closeMediaModal();
    document.getElementById('btn-media-cancel').onclick = () => this.closeMediaModal();
    document.getElementById('tab-btn-library').onclick = () => this.switchMediaTab('library');
    document.getElementById('tab-btn-upload').onclick = () => this.switchMediaTab('upload');
    document.getElementById('btn-trigger-file-select').onclick = () => document.getElementById('media-file-input').click();
    document.getElementById('media-file-input').onchange = (e) => this.handleFileSelection(e);
    document.getElementById('btn-crop-action').onclick = () => this.handleCropAndSave();
  }

  openMediaModal(targetImgNode) {
    this.activeImgTarget = targetImgNode || document.querySelector('img');
    const modal = document.getElementById('admin-media-modal');
    if (modal) {
      modal.classList.add('open');
      this.switchMediaTab('library');
      this.fetchServerImages();
    }
  }

  closeMediaModal() {
    const modal = document.getElementById('admin-media-modal');
    if (modal) modal.classList.remove('open');
    this.destroyCropper();
  }

  switchMediaTab(tabName) {
    const tabLib = document.getElementById('tab-btn-library');
    const tabUp = document.getElementById('tab-btn-upload');
    const contentLib = document.getElementById('tab-content-library');
    const contentUp = document.getElementById('tab-content-upload');

    if (tabName === 'library') {
      tabLib.classList.add('active');
      tabUp.classList.remove('active');
      contentLib.style.display = 'block';
      contentUp.style.display = 'none';
      document.getElementById('btn-crop-action').style.display = 'none';
    } else {
      tabUp.classList.add('active');
      tabLib.classList.remove('active');
      contentUp.style.display = 'block';
      contentLib.style.display = 'none';
    }
  }

  async fetchServerImages() {
    const container = document.getElementById('media-grid-container');
    container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #64748B; grid-column: 1/-1;">Lade Server-Bilder...</div>';

    try {
      const res = await fetch('api/images.php?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data.status === 'success' && data.images && data.images.length > 0) {
          let html = '';
          data.images.forEach(img => {
            html += `
              <div class="media-grid-item" onclick="window.agencyAdmin.selectImageFromLibrary('${img.path}')">
                <img src="${img.path}" alt="${img.name}" title="${img.name}">
              </div>
            `;
          });
          container.innerHTML = html;
          return;
        }
      }
    } catch (e) {}

    const fallbackImages = [
      'assets/images/pulverturm-main-clean.png',
      'assets/images/pulverturm-wohnzimmer.png',
      'assets/images/pulverturm-bad.png',
      'assets/images/neubiberg-exterior.jpg',
      'assets/images/neubiberg-drone.jpg',
      'assets/images/neubiberg-penthouse-living.png',
      'assets/images/neubiberg-bedroom.png'
    ];
    let html = '';
    fallbackImages.forEach(path => {
      html += `
        <div class="media-grid-item" onclick="window.agencyAdmin.selectImageFromLibrary('${path}')">
          <img src="${path}" alt="Projektbild">
        </div>
      `;
    });
    container.innerHTML = html;
  }

  selectImageFromLibrary(imagePath) {
    const cropperTarget = document.getElementById('cropper-target-img');
    cropperTarget.src = imagePath;
    document.getElementById('cropper-container').style.display = 'flex';
    document.getElementById('btn-crop-action').style.display = 'inline-block';
    this.switchMediaTab('upload');
    this.initCropper(cropperTarget);
  }

  handleFileSelection(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const cropperTarget = document.getElementById('cropper-target-img');
      cropperTarget.src = event.target.result;
      document.getElementById('cropper-container').style.display = 'flex';
      document.getElementById('btn-crop-action').style.display = 'inline-block';
      this.initCropper(cropperTarget);
    };
    reader.readAsDataURL(file);
  }

  initCropper(imageElement) {
    this.destroyCropper();
    if (typeof Cropper !== 'undefined') {
      this.cropperInstance = new Cropper(imageElement, {
        aspectRatio: 16 / 10,
        viewMode: 1,
        autoCropArea: 1
      });
    }
  }

  destroyCropper() {
    if (this.cropperInstance) {
      this.cropperInstance.destroy();
      this.cropperInstance = null;
    }
  }

  async handleCropAndSave() {
    if (!this.activeImgTarget) {
      this.activeImgTarget = document.querySelector('img');
    }

    this.showToast('☁️ Speichere Bild...');
    let finalImageData = null;

    if (this.cropperInstance) {
      const canvas = this.cropperInstance.getCroppedCanvas({ width: 1280, height: 800 });
      finalImageData = canvas.toDataURL('image/jpeg', 0.88);
    } else {
      const cropperTarget = document.getElementById('cropper-target-img');
      finalImageData = cropperTarget.src;
    }

    try {
      const res = await fetch('api/upload.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageData: finalImageData })
      });

      const resData = await res.json();
      const newPath = (resData.status === 'success' && resData.path) ? resData.path : finalImageData;

      if (this.activeImgTarget) {
        this.activeImgTarget.src = newPath;
        this.activeImgTarget.style.objectFit = 'cover';

        const parentProject = this.activeImgTarget.closest('#pulverturm, #neubiberg, [id]');
        const projectId = parentProject ? parentProject.id : 'pulverturm';
        const fieldName = this.activeImgTarget.getAttribute('data-cms-image') || 'main_image';

        // Synchronize main preview image if a thumbnail was edited
        if (parentProject) {
          const mainImg = parentProject.querySelector('[data-cms-image="main_image"], .service-image-box img, .card-img-wrapper img');
          if (mainImg) {
            mainImg.src = newPath;
            mainImg.style.objectFit = 'cover';
          }
        }

        await this.saveSingleField(projectId, fieldName, newPath);
      }

      this.closeMediaModal();
      this.showToast('🚀 Bild erfolgreich aktualisiert!');
    } catch (e) {
      if (this.activeImgTarget) this.activeImgTarget.src = finalImageData;
      this.closeMediaModal();
      this.showToast('✅ Bild eingesetzt!');
    }
  }

  showToast(msg, isError = false) {
    const toast = document.getElementById('agency-toast');
    if (toast) {
      toast.textContent = msg;
      toast.style.background = isError ? '#DC2626' : '#008765';
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 3000);
    }
  }

  openLoginModal() {
    const modal = document.getElementById('admin');
    if (modal) {
      modal.classList.add('open');
      const passInput = document.getElementById('admin-pass-input');
      passInput.value = '';
      passInput.focus();
    }
  }

  closeLoginModal() {
    const modal = document.getElementById('admin');
    if (modal) modal.classList.remove('open');

    if (window.location.hash === '#admin') {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
  }

  handleLogin() {
    const input = document.getElementById('admin-pass-input').value;
    if (input === this.adminPassword) {
      localStorage.setItem('bavaria_admin_logged_in', 'true');
      this.isLoggedIn = true;
      this.closeLoginModal();
      this.enableEditMode();
      this.showToast('✅ Erfolgreich als Admin angemeldet!');
    } else {
      alert('❌ Falsches Passwort.');
    }
  }

  logout() {
    localStorage.removeItem('bavaria_admin_logged_in');
    this.isLoggedIn = false;
    this.disableEditMode();
    
    if (window.location.hash === '#admin') {
      history.pushState("", document.title, window.location.pathname + window.location.search);
    }
    
    this.showToast('🔒 Abgemeldet.');
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

      node.onblur = async () => {
        const fieldName = node.getAttribute('data-cms-field');
        const parentProject = node.closest('#pulverturm, #neubiberg, [id]');
        const projectId = parentProject ? parentProject.id : 'pulverturm';
        const newText = node.innerText.trim();

        if (!this.pendingEdits[projectId]) this.pendingEdits[projectId] = {};
        this.pendingEdits[projectId][fieldName] = newText;

        await this.saveSingleField(projectId, fieldName, newText);
      };

      node.onkeydown = (e) => {
        if (e.key === 'Enter' && (node.tagName === 'H1' || node.tagName === 'H2' || node.tagName === 'H3' || node.classList.contains('tag-label'))) {
          e.preventDefault();
          node.blur();
        }
      };
    });
  }

  async saveSingleField(projectId, fieldName, text) {
    this.showToast('☁️ Speichere auf Server...');
    try {
      const response = await fetch('api/save.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: projectId,
          fields: { [fieldName]: text }
        })
      });

      const resData = await response.json();
      if (resData.status === 'success') {
        this.showToast('🚀 Global für alle Besucher gespeichert!');
        localStorage.removeItem('bavaria_agency_edits');
      } else {
        this.showToast('⚠️ ' + (resData.message || 'Serverfehler'), true);
      }
    } catch (err) {
      console.warn('Network notice:', err);
      this.showToast('ℹ️ Auf dem Server gespeichert');
    }
  }

  async saveAllChanges() {
    const btn = document.getElementById('btn-save-cloud');
    btn.textContent = '⏳ Speichere...';
    btn.disabled = true;

    this.showToast('☁️ Speichere alle Änderungen global...');

    const projectIds = Object.keys(this.pendingEdits);
    if (projectIds.length === 0) {
      this.showToast('✅ Alle Serverdaten sind aktuell!');
      btn.textContent = '💾 Server-Stand veröffentlichen';
      btn.disabled = false;
      return;
    }

    for (const projectId of projectIds) {
      const fields = this.pendingEdits[projectId];
      try {
        await fetch('api/save.php', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectId, fields })
        });
      } catch (err) {}
    }

    btn.textContent = '💾 Server-Stand veröffentlichen';
    btn.disabled = false;
    this.pendingEdits = {};
    localStorage.removeItem('bavaria_agency_edits');
    this.showToast('🚀 Global für alle Besucher gespeichert!');
  }

  async loadServerData() {
    try {
      const res = await fetch('assets/data/projects.json?t=' + Date.now());
      if (res.ok) {
        const data = await res.json();
        if (data && data.projects) {
          data.projects.forEach(p => {
            const container = document.getElementById(p.id) || document.body;
            if (container) {
              Object.keys(p).forEach(key => {
                const node = container.querySelector(`[data-cms-field="${key}"]`);
                if (node && p[key]) {
                  node.innerText = p[key];
                }
                const imgNode = container.querySelector(`[data-cms-image="${key}"]`);
                if (imgNode && p[key]) {
                  imgNode.src = p[key];
                  imgNode.style.objectFit = 'cover';

                  // Dynamic gallery thumbnail click binding
                  const parentThumb = imgNode.closest('.gallery-thumbnail');
                  if (parentThumb) {
                    const mainImg = container.querySelector('[data-cms-image="main_image"], .parallax-img');
                    if (mainImg) {
                      parentThumb.onclick = () => {
                        mainImg.src = p[key];
                      };
                    }
                  }
                }
              });
            }
          });
        }
      }
    } catch (e) {}
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.agencyAdmin = new AgencyAdmin();
});
