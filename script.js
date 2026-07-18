/* ============================================
   PHANIC COMPUTER HUB — ID CARD GENERATOR
   ============================================ */

/* ----------------------------------------------------------
   LIVE SITE QR VERIFICATION SNIPPET
   Paste this into your live index.html before </body>:
   
   <script>
   (function(){
     const p = new URLSearchParams(location.search);
     if (p.get('verify') !== 'student') return;

     const studentName = decodeURIComponent(p.get('name') || 'Unknown Student');
     const studentId = decodeURIComponent(p.get('sid') || 'Unknown ID');
     const photo = p.get('photo') || '';
     const hasPhoto = Boolean(photo && /^data:image\//.test(photo));

     document.getElementById('verifyModal')?.remove();
     document.getElementById('verifyOverlay')?.remove();

     const overlay = document.createElement('div');
     overlay.id = 'verifyOverlay';
     overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(5px);z-index:9998;';

     const modal = document.createElement('div');
     modal.id = 'verifyModal';
     modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:24px;padding:2.5rem;width:90%;max-width:420px;z-index:9999;box-shadow:0 25px 50px rgba(0,0,0,0.3);text-align:center;font-family:Satoshi,Inter,sans-serif;';
     if (document.documentElement.getAttribute('data-theme') === 'dark') {
       modal.style.background = '#1a1a1a';
       modal.style.color = '#f9fafb';
     }

     modal.innerHTML = `
       <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#059669;">
         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
       </div>
       <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:.75rem;">Student Verified</h3>
       <p style="font-size:1rem;line-height:1.7;color:#4b5563;margin-bottom:1.25rem;">
         <strong style="color:#111827;">${studentName}</strong><br />
         ID <strong style="color:#b91c3c;">${studentId}</strong><br />
         is a student of <strong style="color:#111827;">Phanic Computer Hub</strong>.
       </p>
       ${hasPhoto ? `<img src="${photo}" alt="Student passport" style="width:96px;height:96px;object-fit:cover;border-radius:18px;border:2px solid #fde2e8;margin:0 auto 1rem;display:block;" />` : ''}
       <button id="closeVerify" style="padding:.875rem 1.75rem;background:linear-gradient(135deg,#9e1b32,#b91c3c);color:#fff;border:none;border-radius:12px;font-weight:700;font-size:.95rem;cursor:pointer;">Close Verification</button>
     `;

     document.body.appendChild(overlay);
     document.body.appendChild(modal);
     document.getElementById('closeVerify').onclick = () => {
       overlay.remove(); modal.remove();
       window.history.replaceState({}, '', location.pathname);
     };
   })();
   </script>
   ---------------------------------------------------------- */

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vSJQD5afdvI_-8W-2m3lqfuXU76v8TYDm7YfZfIzI0s5VYLwbkx2yXmmMB6MvkLk0us1rREgoq5rCTH/pub?output=csv';
const SUGGESTED_ID_COUNT = 9999;

const els = {
  studentName: document.getElementById('studentName'),
  studentId: document.getElementById('studentId'),
  studentIdList: document.getElementById('studentIdList'),
  studentEmail: document.getElementById('studentEmail'),
  studentAddress: document.getElementById('studentAddress'),
  orientationSelect: document.getElementById('orientationSelect'),
  verifyBtn: document.getElementById('verifyBtn'),
  verificationStatus: document.getElementById('verificationStatus'),
  photoInput: document.getElementById('photoInput'),
  uploadZone: document.getElementById('uploadZone'),
  thumbPreview: document.getElementById('thumbPreview'),
  cardPhoto: document.getElementById('cardPhoto'),
  photoPlaceholder: document.getElementById('photoPlaceholder'),
  dispName: document.getElementById('dispName'),
  dispId: document.getElementById('dispId'),
  dispAddress: document.getElementById('dispAddress'),
  qrBox: document.getElementById('qrBox'),
  idCardFront: document.getElementById('idCardFront'),
  idCardBack: document.getElementById('idCardBack'),
  profileSelect: document.getElementById('profileSelect'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),
  downloadPdfBtn: document.getElementById('downloadPdfBtn'),
  statusBadge: document.getElementById('statusBadge'),
  updateBtn: document.getElementById('updateBtn'),
  downloadFrontBtn: document.getElementById('downloadFrontBtn'),
  downloadBackBtn: document.getElementById('downloadBackBtn'),
  printBtn: document.getElementById('printBtn'),
  shareBtn: document.getElementById('shareBtn'),
  shareOverlay: document.getElementById('shareOverlay'),
  shareModal: document.getElementById('shareModal'),
  closeShare: document.getElementById('closeShare'),
  shareWhatsApp: document.getElementById('shareWhatsApp'),
  shareEmail: document.getElementById('shareEmail'),
  shareCopy: document.getElementById('shareCopy'),
  shareNative: document.getElementById('shareNative'),
  photoActions: document.getElementById('photoActions'),
  cropPhotoBtn: document.getElementById('cropPhotoBtn'),
  clearPhotoBtn: document.getElementById('clearPhotoBtn'),
  cropOverlay: document.getElementById('cropOverlay'),
  cropModal: document.getElementById('cropModal'),
  closeCrop: document.getElementById('closeCrop'),
  cropCanvas: document.getElementById('cropCanvas'),
  cropZoom: document.getElementById('cropZoom'),
  applyCropBtn: document.getElementById('applyCropBtn'),
  cancelCropBtn: document.getElementById('cancelCropBtn'),
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMsg'),
};

let photoDataUrl = null;
let currentQR = null;
let cropState = null;
let sheetRows = [];
let sheetLoaded = false;
let authState = {
  verified: false,
  studentId: null,
  email: null,
};

/* ============================================
   INIT
   ============================================ */
const STORAGE_KEY = 'phanic-id-profiles';

function init() {
  populateIdSuggestions();
  loadSavedProfiles();
  attachListeners();
  setCardOrientation();
  setUnverifiedState('Loading student database...');
  updatePreview();
  updateSaveProfileButton();
  loadSheetData();
}

function setCardOrientation() {
  const orientation = els.orientationSelect?.value || 'landscape';
  document.body.classList.toggle('orientation-portrait', orientation === 'portrait');
}

function populateIdSuggestions() {
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= SUGGESTED_ID_COUNT; i++) {
    const opt = document.createElement('option');
    opt.value = `PHA${String(i).padStart(3, '0')}`;
    frag.appendChild(opt);
  }
  els.studentIdList.appendChild(frag);
}

async function loadSheetData() {
  try {
    const response = await fetch(SHEET_CSV_URL, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Sheet CSV request failed: ${response.status}`);
    }
    const csvText = await response.text();
    const rows = parseCsv(csvText);
    if (rows.length < 2) {
      throw new Error('Sheet CSV contains no data');
    }

    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const emailIndex = headers.findIndex((text) => /email/.test(text));
    const regIndex = headers.findIndex((text) => /(reg(?:istration)?\s*number|registration|student\s*id|id|reg\s*no|regno|registration\s*no)/.test(text));
    if (emailIndex === -1 || regIndex === -1) {
      throw new Error('Sheet CSV is missing required email or registration columns');
    }

    sheetRows = rows.slice(1).map((row) => ({
      email: String(row[emailIndex] || '').trim().toLowerCase(),
      studentId: normalizeStudentId(String(row[regIndex] || '').trim()),
    })).filter((entry) => entry.email && entry.studentId);

    sheetLoaded = true;
    els.verifyBtn.disabled = false;
    setUnverifiedState('Ready to verify');
  } catch (error) {
    console.error(error);
    sheetLoaded = false;
    els.verifyBtn.disabled = true;
    setUnverifiedState('Unable to load student database');
  }
}

function parseCsv(text) {
  const rows = [];
  const lines = text.replace(/\r/g, '').split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current);
    rows.push(values);
  }
  return rows;
}

/* ============================================
   LISTENERS
   ============================================ */
function attachListeners() {
  [els.studentName, els.studentAddress, els.studentId].forEach(el => {
    el.addEventListener('input', updatePreview);
  });

  [els.studentId, els.studentEmail].forEach(el => {
    el.addEventListener('input', () => {
      if (authState.verified) {
        setUnverifiedState('Student data changed. Please verify again.');
      }
    });
  });

  els.verifyBtn.addEventListener('click', verifyStudent);
  els.photoInput.addEventListener('change', (e) => handlePhoto(e.target.files[0]));
  
  ['dragenter','dragover','dragleave','drop'].forEach(evt => {
    els.uploadZone.addEventListener(evt, (e) => { e.preventDefault(); e.stopPropagation(); });
  });
  ['dragenter','dragover'].forEach(evt => {
    els.uploadZone.addEventListener(evt, () => els.uploadZone.classList.add('dragover'));
  });
  ['dragleave','drop'].forEach(evt => {
    els.uploadZone.addEventListener(evt, () => els.uploadZone.classList.remove('dragover'));
  });
  els.uploadZone.addEventListener('drop', (e) => handlePhoto(e.dataTransfer.files[0]));

  els.orientationSelect.addEventListener('change', () => {
    setCardOrientation();
    updatePreview();
  });

  els.saveProfileBtn.addEventListener('click', saveProfile);
  els.profileSelect.addEventListener('change', loadProfileFromSelect);

  [els.studentName, els.studentAddress, els.studentId, els.studentEmail].forEach(el => {
    el.addEventListener('input', updateSaveProfileButton);
  });

  els.updateBtn.addEventListener('click', () => {
    if (!authState.verified) {
      showToast('Verify student ID before updating the ID card.');
      return;
    }
    els.updateBtn.classList.add('loading');
    setTimeout(() => { updatePreview(); els.updateBtn.classList.remove('loading'); showToast('Preview refreshed'); }, 300);
  });

  els.downloadFrontBtn.addEventListener('click', () => downloadSide('front'));
  els.downloadBackBtn.addEventListener('click', () => downloadSide('back'));
  els.downloadPdfBtn.addEventListener('click', downloadCombinedPdf);
  els.printBtn.addEventListener('click', printCards);
  els.shareBtn.addEventListener('click', openShare);

  els.closeShare.addEventListener('click', closeShareModal);
  els.shareOverlay.addEventListener('click', closeShareModal);
  els.shareWhatsApp.addEventListener('click', shareToWhatsApp);
  els.shareEmail.addEventListener('click', shareToEmail);
  els.shareCopy.addEventListener('click', shareToClipboard);
  els.shareNative.addEventListener('click', shareNative);

  els.cropPhotoBtn.addEventListener('click', () => {
    if (!authState.verified) {
      showToast('Verify student ID before cropping the photo.');
      return;
    }
    if (photoDataUrl) initCropper(photoDataUrl);
    else showToast('Upload a photo first');
  });

  els.clearPhotoBtn.addEventListener('click', clearPhoto);
  els.cropOverlay.addEventListener('click', closeCropModal);
  els.closeCrop.addEventListener('click', closeCropModal);
  els.cancelCropBtn.addEventListener('click', closeCropModal);
  els.applyCropBtn.addEventListener('click', applyCrop);
  els.cropZoom.addEventListener('input', (event) => updateCropZoom(Number(event.target.value)));
  els.cropCanvas.addEventListener('pointerdown', startCropDrag);
  document.addEventListener('pointermove', moveCropDrag);
  document.addEventListener('pointerup', stopCropDrag);
  els.cropCanvas.addEventListener('touchstart', startCropDrag, { passive: false });
  document.addEventListener('touchmove', moveCropDrag, { passive: false });
  document.addEventListener('touchend', stopCropDrag);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeShareModal();
      closeCropModal();
    }
  });
}

/* ============================================
   PHOTO
   ============================================ */
function handlePhoto(file) {
  if (!authState.verified) {
    showToast('Verify student ID before uploading a photo.');
    return;
  }
  if (!file || !file.type.startsWith('image/')) {
    showToast('Please upload a valid image');
    return;
  }
  if (file.size > 5 * 1024 * 1024) {
    showToast('Image must be under 5 MB');
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    photoDataUrl = e.target.result;
    els.cardPhoto.src = photoDataUrl;
    els.cardPhoto.classList.add('visible');
    els.photoPlaceholder.style.display = 'none';
    els.thumbPreview.src = photoDataUrl;
    els.thumbPreview.classList.add('visible');
    els.photoActions.hidden = false;
    showToast('Photo uploaded');
    updatePreview();
    initCropper(photoDataUrl);
  };
  reader.readAsDataURL(file);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function initCropper(src) {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => {
    const canvas = els.cropCanvas;
    const cropSize = Math.min(canvas.width, canvas.height);
    const coverScale = Math.max(cropSize / img.width, cropSize / img.height);

    cropState = {
      image: img,
      scale: coverScale,
      minScale: 0.5,
      maxScale: 3,
      x: (canvas.width - img.width * coverScale) / 2,
      y: (canvas.height - img.height * coverScale) / 2,
      dragging: false,
      startX: 0,
      startY: 0,
      offsetX: 0,
      offsetY: 0,
    };

    els.cropZoom.min = cropState.minScale.toFixed(2);
    els.cropZoom.max = cropState.maxScale.toFixed(2);
    els.cropZoom.value = cropState.scale.toFixed(2);
    renderCropCanvas();
    openCropModal();
  };
  img.src = src;
}

function openCropModal() {
  els.cropOverlay.classList.add('active');
  els.cropModal.classList.add('active');
  els.cropModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeCropModal() {
  els.cropOverlay.classList.remove('active');
  els.cropModal.classList.remove('active');
  els.cropModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function updateCropZoom(value) {
  if (!cropState) return;
  const canvas = els.cropCanvas;
  const oldScale = cropState.scale;
  const newScale = clamp(value, cropState.minScale, cropState.maxScale);
  
  if (oldScale === 0) return;
  
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const imageWidth = cropState.image.width * oldScale;
  const imageHeight = cropState.image.height * oldScale;
  
  const anchorX = centerX - cropState.x;
  const anchorY = centerY - cropState.y;
  
  const scaleFactor = newScale / oldScale;
  const newAnchorX = anchorX * scaleFactor;
  const newAnchorY = anchorY * scaleFactor;
  
  cropState.scale = newScale;
  cropState.x = centerX - newAnchorX;
  cropState.y = centerY - newAnchorY;
  
  clampCropPosition();
  renderCropCanvas();
}

function clampCropPosition() {
  const canvas = els.cropCanvas;
  const width = cropState.image.width * cropState.scale;
  const height = cropState.image.height * cropState.scale;
  const minX = Math.min(0, canvas.width - width);
  const maxX = Math.max(0, canvas.width - width);
  const minY = Math.min(0, canvas.height - height);
  const maxY = Math.max(0, canvas.height - height);

  cropState.x = clamp(cropState.x, minX, 0);
  cropState.y = clamp(cropState.y, minY, 0);
}

function renderCropCanvas() {
  if (!cropState) return;
  const canvas = els.cropCanvas;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#f3f4f6';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    cropState.image,
    cropState.x,
    cropState.y,
    cropState.image.width * cropState.scale,
    cropState.image.height * cropState.scale
  );
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4);
}

function applyCrop() {
  if (!cropState) return;
  const canvas = document.createElement('canvas');
  canvas.width = 360;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(
    cropState.image,
    cropState.x,
    cropState.y,
    cropState.image.width * cropState.scale,
    cropState.image.height * cropState.scale
  );

  photoDataUrl = canvas.toDataURL('image/png');
  els.cardPhoto.src = photoDataUrl;
  els.thumbPreview.src = photoDataUrl;
  els.cardPhoto.classList.add('visible');
  els.thumbPreview.classList.add('visible');
  closeCropModal();
  showToast('Photo cropped');
  updatePreview();
}

function clearPhoto() {
  photoDataUrl = null;
  els.cardPhoto.src = '';
  els.cardPhoto.classList.remove('visible');
  els.photoPlaceholder.style.display = '';
  els.thumbPreview.src = '';
  els.thumbPreview.classList.remove('visible');
  els.photoActions.hidden = true;
  showToast('Photo removed');
}

function getCanvasPointerPosition(event) {
  const rect = els.cropCanvas.getBoundingClientRect();
  let clientX = event.clientX;
  let clientY = event.clientY;

  if (event.touches && event.touches[0]) {
    clientX = event.touches[0].clientX;
    clientY = event.touches[0].clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

function startCropDrag(event) {
  if (!cropState) return;
  event.preventDefault();
  cropState.dragging = true;
  const pos = getCanvasPointerPosition(event);
  cropState.startX = pos.x;
  cropState.startY = pos.y;
  cropState.offsetX = cropState.x;
  cropState.offsetY = cropState.y;
  els.cropCanvas.style.cursor = 'grabbing';
}

function moveCropDrag(event) {
  if (!cropState || !cropState.dragging) return;
  event.preventDefault();
  const pos = getCanvasPointerPosition(event);
  cropState.x = cropState.offsetX + (pos.x - cropState.startX);
  cropState.y = cropState.offsetY + (pos.y - cropState.startY);
  clampCropPosition();
  renderCropCanvas();
}

function stopCropDrag() {
  if (!cropState) return;
  cropState.dragging = false;
  els.cropCanvas.style.cursor = 'grab';
}


/* ============================================
   PREVIEW & QR
   ============================================ */
function updatePreview() {
  const name = (els.studentName.value.trim() || 'STUDENT NAME').toUpperCase();
  const rawId = els.studentId.value.trim().toUpperCase();
  const id = normalizeStudentId(rawId) || rawId || 'PHA001';
  const addr = (els.studentAddress.value.trim() || 'ADDRESS LINE').toUpperCase();
  const displayId = authState.verified ? id : maskStudentId(id);

  els.dispName.textContent = name;
  els.dispId.textContent = displayId;
  els.dispAddress.textContent = addr;
  document.getElementById('backRegNumber').textContent = displayId;

  if (authState.verified) {
    void generateQR();
  } else {
    els.qrBox.innerHTML = '';
  }

  els.statusBadge.textContent = 'Updated';
  setTimeout(() => els.statusBadge.textContent = 'Ready', 1200);
}

function maskStudentId(id) {
  const raw = String(id || 'PHA001').toUpperCase();
  if (!raw.startsWith('PHA') || raw.length <= 6) {
    return raw.replace(/.(?=.{2})/g, '*');
  }
  const visible = raw.slice(0, 5);
  const masked = '*'.repeat(raw.length - visible.length);
  return `${visible}${masked}`;
}

function normalizeStudentId(value) {
  if (!value || typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase().replace(/\s+/g, '');
  if (!trimmed.startsWith('PHA')) return null;
  const digits = trimmed.slice(3).replace(/^0+/, '');
  if (!/^[0-9]+$/.test(digits)) return null;
  return digits.length <= 3 ? `PHA${digits.padStart(3, '0')}` : `PHA${digits}`;
}

function validateEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function setVerifiedState(studentId, email) {
  authState.verified = true;
  authState.studentId = studentId;
  authState.email = email;
  updateVerificationStatus();
  toggleFormControls(true);
}

function setUnverifiedState(message = 'Not verified') {
  authState.verified = false;
  authState.studentId = null;
  authState.email = null;
  updateVerificationStatus(message);
  toggleFormControls(false);
}

function updateVerificationStatus(message) {
  if (authState.verified) {
    els.verificationStatus.textContent = `Verified — ${authState.studentId}`;
    els.verificationStatus.classList.add('verified');
  } else {
    els.verificationStatus.textContent = message || 'Not verified';
    els.verificationStatus.classList.remove('verified');
  }
}

function toggleFormControls(enabled) {
  [els.studentName, els.studentAddress, els.photoInput, els.updateBtn, els.downloadFrontBtn, els.downloadBackBtn, els.downloadPdfBtn, els.printBtn, els.shareBtn, els.cropPhotoBtn].forEach(el => {
    if (!el) return;
    el.disabled = !enabled;
  });
}

async function verifyStudent() {
  const rawId = els.studentId.value;
  const email = els.studentEmail.value.trim().toLowerCase();
  const normalizedId = normalizeStudentId(rawId);

  if (!normalizedId || !validateEmail(email)) {
    showToast('Enter a valid PHA ID and email');
    return;
  }

  if (!sheetLoaded) {
    showToast('Student database not loaded yet');
    return;
  }

  els.studentId.value = normalizedId;
  updateVerificationStatus('Verifying...');
  els.verifyBtn.disabled = true;

  try {
    const match = sheetRows.some((record) => record.email === email && record.studentId === normalizedId);
    if (match) {
      setVerifiedState(normalizedId, email);
      showToast('Student verified successfully');
    } else {
      setUnverifiedState('Invalid ID or email');
      showToast('Student ID and email do not match our records');
    }
  } catch (error) {
    console.error(error);
    setUnverifiedState('Verification error');
    showToast('Unable to verify student at this time');
  } finally {
    els.verifyBtn.disabled = false;
  }
}

async function buildVerifyUrl() {
  const base = 'https://phanicglobal.com/';
  const params = new URLSearchParams({
    verify: 'student',
    name: els.studentName.value.trim() || 'Student',
    sid: normalizeStudentId(els.studentId.value) || 'PHA001',
  });

  const photoParam = await getQrPhotoParam();
  if (photoParam) {
    params.set('photo', photoParam);
  }

  return `${base}?${params.toString()}`;
}

function getQrPhotoParam() {
  if (!photoDataUrl || !photoDataUrl.startsWith('data:image/')) {
    return Promise.resolve('');
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const sizes = [48, 32, 24];
      const qualities = [0.45, 0.3, 0.2];
      const targetMaxLength = 1200;

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      for (const size of sizes) {
        const scale = Math.min(1, size / Math.max(img.width, img.height));
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        for (const quality of qualities) {
          const compactPhoto = canvas.toDataURL('image/jpeg', quality);
          if (compactPhoto.length <= targetMaxLength) {
            resolve(compactPhoto);
            return;
          }
        }
      }

      resolve('');
    };
    img.onerror = () => resolve('');
    img.src = photoDataUrl;
  });
}

function getStoredProfiles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveProfiles(profiles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch (error) {
    console.error('Unable to save profiles', error);
  }
}

function loadSavedProfiles() {
  const profiles = getStoredProfiles();
  const frag = document.createDocumentFragment();
  const emptyOption = document.createElement('option');
  emptyOption.value = '';
  emptyOption.textContent = 'Select saved profile';
  frag.appendChild(emptyOption);

  profiles.forEach((profile, index) => {
    const option = document.createElement('option');
    option.value = profile.id || `profile-${index}`;
    option.textContent = `${profile.studentId} — ${profile.studentName}`;
    option.dataset.profileIndex = index;
    frag.appendChild(option);
  });

  els.profileSelect.innerHTML = '';
  els.profileSelect.appendChild(frag);
}

function updateSaveProfileButton() {
  const hasName = Boolean(els.studentName.value.trim());
  const hasId = Boolean(els.studentId.value.trim());
  els.saveProfileBtn.disabled = !(hasName && hasId);
}

function saveProfile() {
  const studentId = normalizeStudentId(els.studentId.value.trim());
  const studentName = els.studentName.value.trim();
  const studentAddress = els.studentAddress.value.trim();
  const orientation = els.orientationSelect.value;
  const photo = photoDataUrl || '';

  if (!studentId || !studentName) {
    showToast('Name and student ID are required');
    return;
  }

  const profiles = getStoredProfiles();
  const profileId = studentId;
  const existingIndex = profiles.findIndex((profile) => profile.id === profileId);
  const record = {
    id: profileId,
    studentId,
    studentName,
    studentAddress,
    orientation,
    photoDataUrl: photo,
    savedAt: new Date().toISOString(),
  };

  if (existingIndex > -1) {
    profiles[existingIndex] = record;
  } else {
    profiles.push(record);
  }

  saveProfiles(profiles);
  loadSavedProfiles();
  els.profileSelect.value = profileId;
  showToast('Profile saved');
}

function loadProfileFromSelect() {
  const selectedValue = els.profileSelect.value;
  if (!selectedValue) return;

  const profiles = getStoredProfiles();
  const profile = profiles.find((p) => p.id === selectedValue);
  if (!profile) {
    showToast('Saved profile not found');
    return;
  }

  els.studentId.value = profile.studentId || '';
  els.studentEmail.value = '';
  els.studentName.value = profile.studentName || '';
  els.studentAddress.value = profile.studentAddress || '';
  if (profile.orientation) {
    els.orientationSelect.value = profile.orientation;
    setCardOrientation();
  }
  if (profile.photoDataUrl) {
    photoDataUrl = profile.photoDataUrl;
    els.cardPhoto.src = photoDataUrl;
    els.cardPhoto.classList.add('visible');
    els.photoPlaceholder.style.display = 'none';
    els.thumbPreview.src = photoDataUrl;
    els.thumbPreview.classList.add('visible');
    els.photoActions.hidden = false;
  }

  setUnverifiedState('Loaded profile. Verify before export.');
  updatePreview();
  updateSaveProfileButton();
}

async function downloadCombinedPdf() {
  if (!authState.verified) {
    showToast('Verify student ID before downloading a combined PDF.');
    return;
  }

  if (!els.studentName.value.trim()) {
    showToast('Enter student name first.');
    els.studentName.focus();
    return;
  }

  if (!photoDataUrl) {
    showToast('Upload a photo before downloading.');
    return;
  }

  const btn = els.downloadPdfBtn;
  btn.classList.add('loading');

  try {
    await generateQR();
    await new Promise((resolve) => setTimeout(resolve, 350));

    const frontCanvas = await html2canvas(els.idCardFront, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      logging: false,
    });

    const backCanvas = await html2canvas(els.idCardBack, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      logging: false,
    });

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      showToast('Unable to create PDF. Library not loaded.');
      return;
    }

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 30;
    const maxWidth = pageWidth - margin * 2;

    const frontRatio = frontCanvas.width / frontCanvas.height;
    const frontHeight = maxWidth / frontRatio;
    doc.addImage(frontCanvas.toDataURL('image/png'), 'PNG', margin, margin, maxWidth, frontHeight);

    doc.addPage();
    const backRatio = backCanvas.width / backCanvas.height;
    const backHeight = maxWidth / backRatio;
    doc.addImage(backCanvas.toDataURL('image/png'), 'PNG', margin, margin, maxWidth, backHeight);

    const safeName = (els.studentName.value.trim() || 'Student').replace(/\s+/g, '-');
    doc.save(`Phanic-ID-${els.studentId.value}-${safeName}.pdf`);
    showToast('Combined PDF downloaded');
  } catch (err) {
    console.error(err);
    showToast('PDF export failed. Try again.');
  } finally {
    btn.classList.remove('loading');
  }
}

/* ============================================
   REMOTE VERIFY MODAL SNIPPET
   Copy this to phanicglobal.com to show confirmation when scanning the QR code.
============================================ */
function attachVerifyModalSnippet() {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(location.search);
  if (params.get('verify') !== 'student') return;

  const studentName = decodeURIComponent(params.get('name') || 'Unknown Student');
  const studentId = decodeURIComponent(params.get('sid') || 'Unknown ID');
  const photo = params.get('photo') || '';
  const hasPhoto = Boolean(photo && /^data:image\//.test(photo));

  const overlay = document.createElement('div');
  overlay.id = 'verifyOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.12);backdrop-filter:blur(3px);z-index:9998;pointer-events:none;';

  const modal = document.createElement('div');
  modal.id = 'verifyModal';
  modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:24px;padding:2.5rem;width:90%;max-width:420px;z-index:9999;box-shadow:0 25px 50px rgba(0,0,0,0.18);text-align:center;font-family:Satoshi,Inter,sans-serif;';
  modal.innerHTML = `
    <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#059669;">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
    </div>
    <h3 style="font-size:1.3rem;font-weight:800;margin-bottom:0.85rem;color:#111827;">Student Verified</h3>
    <p style="font-size:1rem;line-height:1.75;color:#374151;margin-bottom:1.25rem;">
      <strong style="color:#111827;">${studentName}</strong><br />
      ID <strong style="color:#b91c3c;">${studentId}</strong><br />
      is a bonafide student of <strong>Phanic Computer Hub</strong>.
    </p>
    ${hasPhoto ? `<img src="${photo}" alt="Student passport" style="width:96px;height:96px;object-fit:cover;border-radius:18px;border:2px solid #fde2e8;margin:0 auto 1rem;display:block;" />` : ''}
    <button id="closeVerify" style="padding:0.9rem 1.75rem;background:linear-gradient(135deg,#9e1b32,#b91c3c);color:#fff;border:none;border-radius:14px;font-weight:700;font-size:0.95rem;cursor:pointer;">Close</button>
  `;

  document.body.appendChild(overlay);
  document.body.appendChild(modal);
  document.getElementById('closeVerify').onclick = () => {
    overlay.remove();
    modal.remove();
    window.history.replaceState({}, '', location.pathname);
  };
}

document.addEventListener('DOMContentLoaded', attachVerifyModalSnippet);

async function generateQR() {
  els.qrBox.innerHTML = '';
  const url = await buildVerifyUrl();
  currentQR = new QRCode(els.qrBox, {
    text: url,
    width: 120,
    height: 120,
    colorDark: '#000000',
    colorLight: '#ffffff',
    correctLevel: QRCode.CorrectLevel.H,
  });
}

/* ============================================
   DOWNLOAD (Front / Back separately)
   ============================================ */
async function downloadSide(side) {
  if (!authState.verified) {
    showToast('Verify student ID before downloading.');
    return;
  }

  if (!els.studentName.value.trim()) {
    showToast('Enter student name first');
    els.studentName.focus();
    return;
  }

  if (!photoDataUrl) {
    showToast('Upload a photo before downloading');
    return;
  }

  const target = side === 'front' ? els.idCardFront : els.idCardBack;
  const btn = side === 'front' ? els.downloadFrontBtn : els.downloadBackBtn;
  
  btn.classList.add('loading');
  try {
    await generateQR();
    await new Promise(r => setTimeout(r, 350));

    const canvas = await html2canvas(target, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
      scrollX: -window.scrollX,
      scrollY: -window.scrollY,
      logging: false,
    });

    const link = document.createElement('a');
    const safeName = (els.studentName.value.trim() || 'Student').replace(/\s+/g, '-');
    link.download = `Phanic-ID-${side}-${els.studentId.value}-${safeName}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast(`${side === 'front' ? 'Front' : 'Back'} side downloaded`);
  } catch (err) {
    console.error(err);
    showToast('Download failed. Try Print instead.');
  } finally {
    btn.classList.remove('loading');
  }
}

/* ============================================
   PRINT
   ============================================ */
function printCards() {
  if (!authState.verified) {
    showToast('Verify student ID before printing.');
    return;
  }
  if (!els.studentName.value.trim()) {
    showToast('Enter student name first');
    els.studentName.focus();
    return;
  }
  if (!photoDataUrl) {
    showToast('Upload a photo before printing');
    return;
  }

  // Force a quick preview update so both cards are current before printing.
  updatePreview();
  window.print();
}

/* ============================================
   SHARE
   ============================================ */
function openShare() {
  if (!authState.verified) {
    showToast('Verify student ID before sharing.');
    return;
  }
  els.shareOverlay.classList.add('active');
  els.shareModal.classList.add('active');
  els.shareModal.setAttribute('aria-hidden', 'false');
}

function closeShareModal() {
  els.shareOverlay.classList.remove('active');
  els.shareModal.classList.remove('active');
  els.shareModal.setAttribute('aria-hidden', 'true');
}

async function getShareData() {
  const name = els.studentName.value.trim() || 'Student';
  const sid = els.studentId.value;
  const url = await buildVerifyUrl();
  return {
    title: `Phanic Computer Hub — ${name}`,
    text: `Verify student: ${name} (${sid}) at Phanic Computer Hub.`,
    url,
  };
}

async function shareToWhatsApp() {
  const { text, url } = await getShareData();
  const msg = encodeURIComponent(`${text}\n\n${url}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
  closeShareModal();
}

async function shareToEmail() {
  const { title, text, url } = await getShareData();
  const body = encodeURIComponent(`${text}\n\n${url}`);
  window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${body}`;
  closeShareModal();
}

async function shareToClipboard() {
  try {
    const { url } = await getShareData();
    await navigator.clipboard.writeText(url);
    showToast('Verification link copied');
  } catch {
    showToast('Unable to copy');
  }
  closeShareModal();
}

async function shareNative() {
  const data = getShareData();
  if (navigator.share) {
    try {
      await navigator.share(data);
      showToast('Shared successfully');
    } catch {
      showToast('Share cancelled');
    }
  } else {
    showToast('Native sharing not supported');
  }
  closeShareModal();
}

/* ============================================
   TOAST
   ============================================ */
function showToast(msg) {
  els.toastMsg.textContent = msg;
  els.toast.classList.add('show');
  setTimeout(() => els.toast.classList.remove('show'), 2800);
}

/* ============================================
   BOOT
   ============================================ */
document.addEventListener('DOMContentLoaded', init);