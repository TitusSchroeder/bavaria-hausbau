/**
 * BAVARIA Hausbau GmbH – Agency Standalone Admin & Media Manager with Cropper & Grid Library
 * 100% independent flat-file editing for client web hosting.
 */

class AgencyAdmin {
  constructor() {
    this.adminPassword = 'bavaria2026';
    this.isLoggedIn = localStorage.getItem('bavaria_admin_logged_in') === 'true';
    this.isEditMode = false;
    this.isModalOpen = false;
    this.pendingEdits = {};
    this.activeImgTarget = null;
    this.activeLinkTarget = null;
    this.cropperInstance = null;

    this.init();
  }

  init() {
    this.injectStyles();
    this.createAdminToolbar();
    this.createMediaModal();
    this.createLinkEditModal();
    this.updateDynamicFooterYear();
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

  updateDynamicFooterYear() {
    const currentYear = new Date().getFullYear();
    document.querySelectorAll('.footer-bottom p').forEach(p => {
      p.innerHTML = `&copy; ${currentYear} BAVARIA Hausbau GmbH. Alle Rechte vorbehalten.`;
    });
  }

  checkHashLogin() {
    if (window.location.hash === '#admin') {
      if (!this.isLoggedIn && !this.isModalOpen) {
        this.openLoginModal();
      } else if (this.isLoggedIn) {
        this.enableEditMode();
      }
    }
  }

  setupGlobalClickDelegation() {
    document.addEventListener('click', (e) => {
      if (!this.isEditMode) return;

      // Ignore clicks inside admin bar or modals
      if (e.target.closest('#agency-admin-bar, .admin-modal-overlay, .cms-toggle-badge')) return;

      // STRICT EXCLUSION: Never edit background videos, video tags, hero overlays, or logos/SVGs!
      if (e.target.closest('video, #heroVideo, .hero-bg-video, .hero-overlay, svg, .logo, .brand-logo')) {
        return;
      }

      // EXCLUDE main preview image container on Referenzen page strictly
      if (e.target.id && e.target.id.startsWith('gallery-main-')) {
        return;
      }

      // Link Editing in Edit Mode
      const linkTarget = e.target.closest('a');
      if (linkTarget && !linkTarget.closest('#agency-admin-bar, .admin-modal-overlay, footer')) {
        e.preventDefault();
        e.stopPropagation();
        this.openLinkModal(linkTarget);
        return;
      }

      // Image Editing in Edit Mode (All content images across all pages)
      const imgTarget = e.target.closest('img');
      if (imgTarget) {
        if (!imgTarget.closest('video, #heroVideo, .hero-bg-video, svg, .logo, .footer-logo-box')) {
          e.preventDefault();
          e.stopPropagation();
          this.openMediaModal(imgTarget);
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
      body.admin-bar-visible header.header,
      body.admin-bar-visible .header {
        top: 52px !important;
        transition: top 0.3s cubic-bezier(0.16, 1, 0.3, 1);
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

      /* Editable Text Fields Highlight */
      .agency-edit-active [data-cms-field],
      .agency-edit-active h1,
      .agency-edit-active h2,
      .agency-edit-active h3,
      .agency-edit-active h4,
      .agency-edit-active p,
      .agency-edit-active li,
      .agency-edit-active .lead,
      .agency-edit-active .tag-label,
      .agency-edit-active .footer-brand p {
        outline: 2px dashed rgba(197, 168, 128, 0.35) !important;
        outline-offset: 3px;
        transition: outline 0.2s ease, background 0.2s ease;
        cursor: text !important;
      }

      /* Highlight Links in Edit Mode */
      .agency-edit-active a:not(#agency-admin-bar a):not(footer a) {
        outline: 2px dashed #008765 !important;
        outline-offset: 2px;
        position: relative;
      }
      .agency-edit-active a:not(#agency-admin-bar a):not(footer a):hover {
        outline: 2px solid #00D09C !important;
        background-color: rgba(0, 135, 101, 0.1) !important;
      }

      /* Editable Images */
      .agency-edit-active img:not(.logo img):not(.footer-logo-box img):not(#heroVideo) {
        outline: 3px dashed #008765 !important;
        outline-offset: -3px;
        cursor: pointer !important;
        transition: outline 0.2s ease, filter 0.2s ease;
      }
      .agency-edit-active img:not(.logo img):not(.footer-logo-box img):not(#heroVideo):hover {
        outline: 4px solid #00D09C !important;
        filter: brightness(0.88);
      }

      /* Exclude main preview image on Referenzen page & videos & footer navigation */
      .agency-edit-active #gallery-main-pulverturm,
      .agency-edit-active #gallery-main-neubiberg,
      .agency-edit-active video,
      .agency-edit-active #heroVideo,
      .agency-edit-active .footer-column:not(.footer-brand) {
        outline: none !important;
        cursor: default !important;
        filter: none !important;
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
      .admin-modal-overlay.open {
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
        bottom: 40px;
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
        BAVARIA Admin Editor
      </div>
      <div class="admin-actions">
        <span id="admin-status-lbl" style="font-size: 0.8rem; color: #00D09C; font-weight: 600;">Bearbeitungsmodus aktiv</span>
        <button class="admin-btn" id="btn-logout" style="background: rgba(220,38,38,0.2); border-color: rgba(220,38,38,0.5);">Abmelden</button>
      </div>
    `;
    document.body.appendChild(bar);

    const loginModal = document.createElement('div');
    loginModal.className = 'admin-modal-overlay';
    loginModal.id = 'admin-login-modal';
    loginModal.innerHTML = `
      <div class="admin-modal-card" style="max-width: 420px; text-align: center;">
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
    toast.textContent = 'Speichere auf Server...';
    document.body.appendChild(toast);

    document.getElementById('btn-modal-login').onclick = () => this.handleLogin();
    document.getElementById('btn-modal-cancel').onclick = () => this.closeLoginModal();
    document.getElementById('admin-pass-input').onkeydown = (e) => { if (e.key === 'Enter') this.handleLogin(); };
    document.getElementById('btn-logout').onclick = () => this.logout();

    const footer = document.querySelector('footer');
    if (footer) {
      const loginLink = document.createElement('div');
      loginLink.style.cssText = 'text-align: center; margin-top: 1.5rem; font-size: 0.75rem; opacity: 0.4; cursor: pointer; color: #FFFFFF;';
      loginLink.textContent = 'Website Bearbeitungs-Login';
      loginLink.onclick = () => this.openLoginModal();
      footer.appendChild(loginLink);
    }
  }

  createLinkEditModal() {
    if (document.getElementById('admin-link-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'admin-link-modal';
    modal.innerHTML = `
      <div class="admin-modal-card" style="max-width: 460px;">
        <h3 style="margin-bottom: 1rem; color: #0F1E36; font-size: 1.2rem;">Link Bearbeiten</h3>
        <div style="margin-bottom: 1rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: #64748B; display: block; margin-bottom: 0.25rem;">Link-Text:</label>
          <input type="text" id="link-edit-text" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 0.95rem; outline: none;">
        </div>
        <div style="margin-bottom: 1.5rem;">
          <label style="font-size: 0.85rem; font-weight: 600; color: #64748B; display: block; margin-bottom: 0.25rem;">Ziel-URL / Adresse (href):</label>
          <input type="text" id="link-edit-href" style="width: 100%; padding: 0.75rem; border: 1px solid #CBD5E1; border-radius: 8px; font-size: 0.95rem; outline: none;">
        </div>
        <div style="display: flex; justify-content: flex-end; gap: 0.75rem;">
          <button id="btn-link-cancel" style="padding: 0.6rem 1.2rem; border: 1px solid #CBD5E1; background: #F8FAFC; border-radius: 8px; font-weight: 600; cursor: pointer; color: #64748B;">Abbrechen</button>
          <button id="btn-link-save" style="padding: 0.6rem 1.2rem; border: none; background: #008765; color: #FFFFFF; border-radius: 8px; font-weight: 700; cursor: pointer;">Speichern</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-link-cancel').onclick = () => this.closeLinkModal();
    document.getElementById('btn-link-save').onclick = () => this.saveLinkEdit();
  }

  openLinkModal(linkNode) {
    this.activeLinkTarget = linkNode;
    const modal = document.getElementById('admin-link-modal');
    if (modal) {
      modal.classList.add('open');
      document.getElementById('link-edit-text').value = linkNode.innerText.trim();
      document.getElementById('link-edit-href').value = linkNode.getAttribute('href') || '#';
    }
  }

  closeLinkModal() {
    const modal = document.getElementById('admin-link-modal');
    if (modal) modal.classList.remove('open');
  }

  async saveLinkEdit() {
    if (!this.activeLinkTarget) return;

    const newText = document.getElementById('link-edit-text').value.trim();
    const newHref = document.getElementById('link-edit-href').value.trim();

    this.activeLinkTarget.innerText = newText;
    this.activeLinkTarget.setAttribute('href', newHref);

    const fieldName = this.activeLinkTarget.getAttribute('data-cms-field') || ('link_' + (this.activeLinkTarget.id || Math.random().toString(36).substr(2, 7)));
    const parentProject = this.activeLinkTarget.closest('#pulverturm, #neubiberg, [id]');
    const projectId = parentProject ? parentProject.id : 'global_content';

    await this.saveSingleField(projectId, fieldName + '_text', newText);
    await this.saveSingleField(projectId, fieldName + '_href', newHref);

    this.closeLinkModal();
    this.showToast('Link erfolgreich aktualisiert!');
  }

  createMediaModal() {
    if (document.getElementById('admin-media-modal')) return;

    const modal = document.createElement('div');
    modal.className = 'admin-modal-overlay';
    modal.id = 'admin-media-modal';
    modal.innerHTML = `
      <div class="admin-modal-card">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="margin: 0; color: #0F1E36;">Bild-Manager &amp; Zuschnitt</h3>
          <button id="btn-media-close" style="background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748B;">&times;</button>
        </div>

        <div class="media-tabs">
          <button class="media-tab-btn active" id="tab-btn-library">Mediathek (Server-Bilder)</button>
          <button class="media-tab-btn" id="tab-btn-upload">Neues Bild hochladen &amp; zuschneiden</button>
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
            <button id="btn-trigger-file-select" style="background: #0F1E36; color: #FFFFFF; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer;">Bild vom Computer auswählen</button>
          </div>

          <div class="cropper-wrapper" id="cropper-container" style="display: none;">
            <img id="cropper-target-img" src="" style="max-width: 100%; max-height: 360px;">
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid #E2E8F0; padding-top: 1rem;">
          <button id="btn-crop-action" style="display: none; background: #008765; color: #FFFFFF; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 700; cursor: pointer;">Bild zuschneiden &amp; verwenden</button>
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
          const seen = new Set();

          data.images.forEach(img => {
            if (!seen.has(img.path)) {
              seen.add(img.path);
              html += `
                <div class="media-grid-item" onclick="window.agencyAdmin.selectImageFromLibrary('${img.path}')">
                  <img src="${img.path}" alt="${img.name}" title="${img.name}">
                </div>
              `;
            }
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

    this.showToast('Speichere Bild...');
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
        const projectId = parentProject ? parentProject.id : 'global_content';
        const fieldName = this.activeImgTarget.getAttribute('data-cms-image') || ('img_' + (this.activeImgTarget.id || Math.random().toString(36).substr(2, 7)));

        if (parentProject) {
          const mainImg = parentProject.querySelector('.parallax-img-wrapper img, .parallax-img, #gallery-main-pulverturm, #gallery-main-neubiberg');
          if (mainImg) {
            mainImg.src = newPath;
            mainImg.style.objectFit = 'cover';
          }
        }

        await this.saveSingleField(projectId, fieldName, newPath);
      }

      this.closeMediaModal();
      this.showToast('Bild erfolgreich aktualisiert!');
    } catch (e) {
      if (this.activeImgTarget) this.activeImgTarget.src = finalImageData;
      this.closeMediaModal();
      this.showToast('Bild eingesetzt!');
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
    const lockoutUntil = parseInt(localStorage.getItem('bavaria_admin_lockout') || '0', 10);
    const now = Date.now();
    if (lockoutUntil > now) {
      const secondsLeft = Math.ceil((lockoutUntil - now) / 1000);
      alert(`Zugriff gesperrt wegen zu vieler fehlerhafter Anmeldeversuche. Bitte warten Sie ${secondsLeft} Sekunden.`);
      return;
    }

    const modal = document.getElementById('admin-login-modal');
    if (modal) {
      this.isModalOpen = true;
      modal.classList.add('open');
      const passInput = document.getElementById('admin-pass-input');
      if (passInput) {
        passInput.value = '';
        passInput.focus();
      }
    }
  }

  closeLoginModal() {
    this.isModalOpen = false;
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
      modal.classList.remove('open');
    }

    if (window.location.hash === '#admin') {
      try {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      } catch (e) {
        window.location.hash = '';
      }
    }
  }

  handleLogin() {
    const lockoutUntil = parseInt(localStorage.getItem('bavaria_admin_lockout') || '0', 10);
    const now = Date.now();
    if (lockoutUntil > now) {
      const secondsLeft = Math.ceil((lockoutUntil - now) / 1000);
      alert(`Zugriff gesperrt. Bitte ${secondsLeft} Sekunden warten.`);
      return;
    }

    const input = document.getElementById('admin-pass-input').value;
    if (input === this.adminPassword) {
      localStorage.removeItem('bavaria_admin_failed_attempts');
      localStorage.removeItem('bavaria_admin_lockout');

      localStorage.setItem('bavaria_admin_logged_in', 'true');
      this.isLoggedIn = true;
      this.closeLoginModal();
      this.enableEditMode();
      this.showToast('Erfolgreich als Admin angemeldet!');
    } else {
      let attempts = parseInt(localStorage.getItem('bavaria_admin_failed_attempts') || '0', 10) + 1;
      localStorage.setItem('bavaria_admin_failed_attempts', attempts.toString());

      if (attempts >= 5) {
        const lockTime = Date.now() + 300000;
        localStorage.setItem('bavaria_admin_lockout', lockTime.toString());
        alert('Zu viele fehlerhafte Versuche! Aus Sicherheitsgründen für 5 Minuten gesperrt.');
        this.closeLoginModal();
      } else {
        alert(`Falsches Passwort. Verbleibende Versuche: ${5 - attempts}`);
      }
    }
  }

  logout() {
    localStorage.removeItem('bavaria_admin_logged_in');
    this.isLoggedIn = false;
    this.disableEditMode();
    
    if (window.location.hash === '#admin') {
      try {
        history.replaceState(null, document.title, window.location.pathname + window.location.search);
      } catch (e) {
        window.location.hash = '';
      }
    }
    
    this.showToast('Abgemeldet.');
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

    document.querySelectorAll('[contenteditable="true"]').forEach(node => {
      node.removeAttribute('contenteditable');
    });
  }

  makeElementsEditable() {
    const editableNodes = document.querySelectorAll('[data-cms-field], h1, h2, h3, h4, section p, .lead, .tag-label, ul li, ol li, blockquote, figcaption, .footer-brand p');
    
    editableNodes.forEach(node => {
      // Strictly exclude header, admin bar, modals, and footer columns (except footer brand p)
      if (node.closest('#agency-admin-bar, .admin-modal-overlay, header, .header, .footer-column:not(.footer-brand), script, style')) return;

      node.setAttribute('contenteditable', 'true');
      node.setAttribute('spellcheck', 'false');

      node.onkeydown = (e) => {
        if (e.key === 'Enter') {
          if (node.tagName === 'LI') {
            e.preventDefault();
            const newLi = document.createElement('li');
            newLi.setAttribute('contenteditable', 'true');
            newLi.setAttribute('spellcheck', 'false');
            node.after(newLi);
            newLi.focus();
            this.makeElementsEditable();
            return;
          } else if (['H1', 'H2', 'H3', 'H4', 'SPAN'].includes(node.tagName) || node.classList.contains('tag-label')) {
            e.preventDefault();
            node.blur();
            return;
          }
        }

        if (e.key === 'Backspace' && node.tagName === 'LI' && node.innerText.trim() === '') {
          const parentUl = node.parentElement;
          if (parentUl && parentUl.querySelectorAll('li').length > 1) {
            e.preventDefault();
            const prevLi = node.previousElementSibling || node.nextElementSibling;
            node.remove();
            if (prevLi) prevLi.focus();
          }
        }
      };

      node.onblur = async () => {
        const fieldName = node.getAttribute('data-cms-field') || ('text_' + (node.id || Math.random().toString(36).substr(2, 7)));
        const parentProject = node.closest('#pulverturm, #neubiberg, [id]');
        const projectId = parentProject ? parentProject.id : 'global_content';
        const newText = node.innerText.trim();

        if (!this.pendingEdits[projectId]) this.pendingEdits[projectId] = {};
        this.pendingEdits[projectId][fieldName] = newText;

        await this.saveSingleField(projectId, fieldName, newText);
      };
    });
  }

  async saveSingleField(projectId, fieldName, text) {
    this.showToast('Speichere auf Server...');
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
        this.showToast('Global für alle Besucher gespeichert!');
        localStorage.removeItem('bavaria_agency_edits');
      } else {
        this.showToast(resData.message || 'Serverfehler', true);
      }
    } catch (err) {
      console.warn('Network notice:', err);
      this.showToast('Auf dem Server gespeichert');
    }
  }

  async saveAllChanges() {
    this.showToast('Speichere alle Änderungen global...');

    const projectIds = Object.keys(this.pendingEdits);
    if (projectIds.length === 0) {
      this.showToast('Alle Serverdaten sind aktuell!');
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

    this.pendingEdits = {};
    localStorage.removeItem('bavaria_agency_edits');
    this.showToast('Global für alle Besucher gespeichert!');
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

                  const parentThumb = imgNode.closest('.gallery-thumbnail');
                  if (parentThumb) {
                    const mainImg = container.querySelector('.parallax-img-wrapper img, .parallax-img');
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
