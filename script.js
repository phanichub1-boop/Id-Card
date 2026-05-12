/* ============================================
   PHANIC COMPUTER HUB — ID CARD GENERATOR
   ============================================ */

/* ----------------------------------------------------------
   LIVE SITE QR VERIFICATION SNIPPET
   Paste this into your live index.html before </body>:
   
   <script>
   (function(){
     const p = new URLSearchParams(location.search);
     if(p.get('verify') !== 'student') return;
     const studentName = decodeURIComponent(p.get('name') || 'Unknown Student');
     const studentId   = decodeURIComponent(p.get('sid')  || 'Unknown ID');
     
     document.getElementById('verifyModal')?.remove();
     document.getElementById('verifyOverlay')?.remove();
     
     const overlay = document.createElement('div');
     overlay.id = 'verifyOverlay';
     overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(5px);z-index:9998;';
     
     const modal = document.createElement('div');
     modal.id = 'verifyModal';
     modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#fff;border-radius:24px;padding:2.5rem;width:90%;max-width:420px;z-index:9999;box-shadow:0 25px 50px rgba(0,0,0,0.3);text-align:center;font-family:Satoshi,Inter,sans-serif;';
     if(document.documentElement.getAttribute('data-theme')==='dark'){ modal.style.background='#1a1a1a'; modal.style.color='#f9fafb'; }
     
     modal.innerHTML = `
       <div style="width:64px;height:64px;background:#d1fae5;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 1rem;color:#059669;">
         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
       </div>
       <h3 style="font-size:1.25rem;font-weight:800;margin-bottom:.75rem;">Student Verified</h3>
       <p style="font-size:1rem;line-height:1.7;color:#4b5563;margin-bottom:1.75rem;">
         Student name <strong style="color:#111827;">${studentName}</strong> with student id <strong style="color:#b91c3c;">${studentId}</strong> is a student of <strong style="color:#111827;">Phanic Computer Hub</strong>.
       </p>
       <button id="closeVerify" style="padding:.875rem 1.75rem;background:linear-gradient(135deg,#9e1b32,#b91c3c);color:#fff;border:none;border-radius:12px;font-weight:700;font-size:.95rem;cursor:pointer;">Close Verification</button>
     `;
     
     document.body.appendChild(overlay);
     document.body.appendChild(modal);
     document.getElementById('closeVerify').onclick = () => {
       overlay.remove(); modal.remove();
       window.history.replaceState({},'',location.pathname);
     };
   })();
   </script>
   ---------------------------------------------------------- */

const els = {
  studentName: document.getElementById('studentName'),
  studentId: document.getElementById('studentId'),
  studentAddress: document.getElementById('studentAddress'),
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
  toast: document.getElementById('toast'),
  toastMsg: document.getElementById('toastMsg'),
};

let photoDataUrl = null;
let currentQR = null;

/* ============================================
   INIT
   ============================================ */
function init() {
  populateIds();
  attachListeners();
  updatePreview();
}

function populateIds() {
  const frag = document.createDocumentFragment();
  for (let i = 1; i <= 1000; i++) {
    const opt = document.createElement('option');
    const num = String(i).padStart(3, '0');
    opt.value = `STU${num}`;
    opt.textContent = `STU${num}`;
    frag.appendChild(opt);
  }
  els.studentId.appendChild(frag);
  els.studentId.value = 'STU005';
}

/* ============================================
   LISTENERS
   ============================================ */
function attachListeners() {
  [els.studentName, els.studentId, els.studentAddress].forEach(el => {
    el.addEventListener('input', updatePreview);
  });

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

  els.updateBtn.addEventListener('click', () => {
    els.updateBtn.classList.add('loading');
    setTimeout(() => { updatePreview(); els.updateBtn.classList.remove('loading'); showToast('Preview refreshed'); }, 300);
  });

  els.downloadFrontBtn.addEventListener('click', () => downloadSide('front'));
  els.downloadBackBtn.addEventListener('click', () => downloadSide('back'));
  els.printBtn.addEventListener('click', printCards);
  els.shareBtn.addEventListener('click', openShare);

  els.closeShare.addEventListener('click', closeShareModal);
  els.shareOverlay.addEventListener('click', closeShareModal);
  els.shareWhatsApp.addEventListener('click', shareToWhatsApp);
  els.shareEmail.addEventListener('click', shareToEmail);
  els.shareCopy.addEventListener('click', shareToClipboard);
  els.shareNative.addEventListener('click', shareNative);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeShareModal();
  });
}

/* ============================================
   PHOTO
   ============================================ */
function handlePhoto(file) {
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
    showToast('Photo uploaded');
    updatePreview();
  };
  reader.readAsDataURL(file);
}

/* ============================================
   PREVIEW & QR
   ============================================ */
function updatePreview() {
  const name = (els.studentName.value.trim() || 'EMEKA ALIFO').toUpperCase();
  const id = els.studentId.value;
  const addr = (els.studentAddress.value.trim() || '35 OKEYE STREET').toUpperCase();

  els.dispName.textContent = name;
  els.dispId.textContent = id;
  els.dispAddress.textContent = addr;

  generateQR();
  els.statusBadge.textContent = 'Updated';
  setTimeout(() => els.statusBadge.textContent = 'Ready', 1200);
}

function buildVerifyUrl() {
  const base = 'https://phanichub1-boop.github.io/Phanic-Website-/';
  const params = new URLSearchParams({
    verify: 'student',
    name: els.studentName.value.trim() || 'Student',
    sid: els.studentId.value,
  });
  return `${base}?${params.toString()}`;
}

function generateQR() {
  els.qrBox.innerHTML = '';
  const url = buildVerifyUrl();
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
  if (!els.studentName.value.trim()) {
    showToast('Enter student name first');
    els.studentName.focus();
    return;
  }

  const target = side === 'front' ? els.idCardFront : els.idCardBack;
  const btn = side === 'front' ? els.downloadFrontBtn : els.downloadBackBtn;
  
  btn.classList.add('loading');
  try {
    generateQR();
    await new Promise(r => setTimeout(r, 350));

    const canvas = await html2canvas(target, {
      scale: 3,
      useCORS: true,
      backgroundColor: '#ffffff',
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
  if (!els.studentName.value.trim()) {
    showToast('Enter student name first');
    els.studentName.focus();
    return;
  }
  window.print();
}

/* ============================================
   SHARE
   ============================================ */
function openShare() {
  els.shareOverlay.classList.add('active');
  els.shareModal.classList.add('active');
  els.shareModal.setAttribute('aria-hidden', 'false');
}

function closeShareModal() {
  els.shareOverlay.classList.remove('active');
  els.shareModal.classList.remove('active');
  els.shareModal.setAttribute('aria-hidden', 'true');
}

function getShareData() {
  const name = els.studentName.value.trim() || 'Student';
  const sid = els.studentId.value;
  const url = buildVerifyUrl();
  return {
    title: `Phanic Computer Hub — ${name}`,
    text: `Verify student: ${name} (${sid}) at Phanic Computer Hub.`,
    url,
  };
}

function shareToWhatsApp() {
  const { text, url } = getShareData();
  const msg = encodeURIComponent(`${text}\n\n${url}`);
  window.open(`https://wa.me/?text=${msg}`, '_blank');
  closeShareModal();
}

function shareToEmail() {
  const { title, text, url } = getShareData();
  const body = encodeURIComponent(`${text}\n\n${url}`);
  window.location.href = `mailto:?subject=${encodeURIComponent(title)}&body=${body}`;
  closeShareModal();
}

async function shareToClipboard() {
  try {
    await navigator.clipboard.writeText(getShareData().url);
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