// Settings Module
document.addEventListener('DOMContentLoaded', function() {
    // Get the modal elements
    const modal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.querySelector('#settingsModal .close');
    const cancelButton = document.getElementById('cancelSettings');
    const saveButton = document.getElementById('saveSettings');
    const settingsForm = document.getElementById('settingsForm');

    const avatarUpload = document.getElementById('avatarUpload');
    const resetAvatarButton = document.getElementById('resetAvatar');
    const avatarPreview = document.getElementById('avatarPreview');

    const bannerUpload = document.getElementById('bannerUpload');
    const resetBannerButton = document.getElementById('resetBanner');
    const bannerPreview = document.getElementById('bannerPreview');

    const avatarCropModal = document.getElementById('avatarCropModal');
    const avatarCropCanvas = document.getElementById('avatarCropCanvas');
    const avatarCropZoom = document.getElementById('avatarCropZoom');
    const avatarCropSave = document.getElementById('avatarCropSave');
    const avatarCropCancel = document.getElementById('avatarCropCancel');
    const avatarCropClose = document.getElementById('avatarCropClose');

    const bannerCropModal = document.getElementById('bannerCropModal');
    const bannerCropCanvas = document.getElementById('bannerCropCanvas');
    const bannerCropZoom = document.getElementById('bannerCropZoom');
    const bannerCropSave = document.getElementById('bannerCropSave');
    const bannerCropCancel = document.getElementById('bannerCropCancel');
    const bannerCropClose = document.getElementById('bannerCropClose');

    if (!window.configManager) {
        return;
    }

    const setAvatarPreview = (imageUrl) => {
        if (!avatarPreview) return;
        if (imageUrl) {
            avatarPreview.style.backgroundImage = `url(${imageUrl})`;
        } else {
            avatarPreview.style.backgroundImage = '';
        }
    };

    const setBannerPreview = (imageUrl) => {
        if (!bannerPreview) return;
        if (imageUrl) {
            bannerPreview.style.backgroundImage = `url(${imageUrl})`;
        } else {
            bannerPreview.style.backgroundImage = '';
        }
    };

    const readFileAsDataUrl = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result || ''));
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    };

    const loadImage = (dataUrl) => {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error('Invalid image'));
            img.src = dataUrl;
        });
    };

    const cropState = {
        img: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragStartOffsetX: 0,
        dragStartOffsetY: 0,
        sourceDataUrl: ''
    };

    const bannerCropState = {
        img: null,
        zoom: 1,
        offsetX: 0,
        offsetY: 0,
        dragging: false,
        dragStartX: 0,
        dragStartY: 0,
        dragStartOffsetX: 0,
        dragStartOffsetY: 0,
        sourceDataUrl: ''
    };

    const getCropGeometry = () => {
        const canvas = avatarCropCanvas;
        const w = canvas?.width || 260;
        const h = canvas?.height || 260;

        const cropSize = Math.floor(Math.min(w, h) * 0.77); // ~200 on 260
        const cropX = Math.floor((w - cropSize) / 2);
        const cropY = Math.floor((h - cropSize) / 2);
        const cropR = cropSize / 2;

        return {
            w,
            h,
            cropSize,
            cropX,
            cropY,
            cx: cropX + cropR,
            cy: cropY + cropR,
            r: cropR
        };
    };

    const computeDrawParams = () => {
        if (!cropState.img || !avatarCropCanvas) return null;

        const g = getCropGeometry();
        const img = cropState.img;

        const baseScale = Math.max(g.cropSize / img.width, g.cropSize / img.height);
        const scale = baseScale * cropState.zoom;

        const dw = img.width * scale;
        const dh = img.height * scale;

        const dx = g.cx - dw / 2 + cropState.offsetX;
        const dy = g.cy - dh / 2 + cropState.offsetY;

        return { g, img, scale, dx, dy, dw, dh };
    };

    const renderCropCanvas = () => {
        if (!avatarCropCanvas) return;
        const ctx = avatarCropCanvas.getContext('2d');
        if (!ctx) return;

        const params = computeDrawParams();
        const g = getCropGeometry();

        ctx.clearRect(0, 0, g.w, g.h);

        // background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, 0, g.w, g.h);

        if (!params) return;

        // dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(0, 0, g.w, g.h);

        // draw image clipped to circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.clearRect(g.cropX, g.cropY, g.cropSize, g.cropSize);
        ctx.drawImage(params.img, params.dx, params.dy, params.dw, params.dh);
        ctx.restore();

        // circle border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, g.r, 0, Math.PI * 2);
        ctx.stroke();
    };

    const openAvatarCropper = async (file) => {
        if (!avatarCropModal || !avatarCropCanvas) {
            return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        const img = await loadImage(dataUrl);

        cropState.img = img;
        cropState.zoom = 1;
        cropState.offsetX = 0;
        cropState.offsetY = 0;
        cropState.dragging = false;
        cropState.sourceDataUrl = dataUrl;

        if (avatarCropZoom) {
            avatarCropZoom.value = '1';
        }

        avatarCropModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        renderCropCanvas();
    };

    const closeAvatarCropper = () => {
        if (!avatarCropModal) return;
        avatarCropModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        cropState.img = null;
        cropState.sourceDataUrl = '';
    };

    const computeBannerDrawParams = () => {
        if (!bannerCropState.img || !bannerCropCanvas) return null;

        const img = bannerCropState.img;
        const w = bannerCropCanvas.width;
        const h = bannerCropCanvas.height;

        const baseScale = Math.max(w / img.width, h / img.height);
        const scale = baseScale * bannerCropState.zoom;

        const dw = img.width * scale;
        const dh = img.height * scale;

        const dx = (w - dw) / 2 + bannerCropState.offsetX;
        const dy = (h - dh) / 2 + bannerCropState.offsetY;

        return { img, w, h, dx, dy, dw, dh };
    };

    const renderBannerCropCanvas = () => {
        if (!bannerCropCanvas) return;
        const ctx = bannerCropCanvas.getContext('2d');
        if (!ctx) return;

        const p = computeBannerDrawParams();
        ctx.clearRect(0, 0, bannerCropCanvas.width, bannerCropCanvas.height);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
        ctx.fillRect(0, 0, bannerCropCanvas.width, bannerCropCanvas.height);

        if (!p) return;

        ctx.drawImage(p.img, p.dx, p.dy, p.dw, p.dh);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.lineWidth = 2;
        ctx.strokeRect(0.5, 0.5, bannerCropCanvas.width - 1, bannerCropCanvas.height - 1);
    };

    const openBannerCropper = async (file) => {
        if (!bannerCropModal || !bannerCropCanvas) {
            return;
        }

        const dataUrl = await readFileAsDataUrl(file);
        const img = await loadImage(dataUrl);

        bannerCropState.img = img;
        bannerCropState.zoom = 1;
        bannerCropState.offsetX = 0;
        bannerCropState.offsetY = 0;
        bannerCropState.dragging = false;
        bannerCropState.sourceDataUrl = dataUrl;

        if (bannerCropZoom) {
            bannerCropZoom.value = '1';
        }

        bannerCropModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        renderBannerCropCanvas();
    };

    const closeBannerCropper = () => {
        if (!bannerCropModal) return;
        bannerCropModal.style.display = 'none';
        document.body.style.overflow = 'auto';
        bannerCropState.img = null;
        bannerCropState.sourceDataUrl = '';
    };

    const exportCroppedBanner = (wOut = 1200, hOut = 300) => {
        const p = computeBannerDrawParams();
        if (!p) return '';

        const out = document.createElement('canvas');
        out.width = wOut;
        out.height = hOut;
        const ctx = out.getContext('2d');
        if (!ctx) return '';

        const scaleX = wOut / p.w;
        const scaleY = hOut / p.h;
        const dxOut = p.dx * scaleX;
        const dyOut = p.dy * scaleY;
        const dwOut = p.dw * scaleX;
        const dhOut = p.dh * scaleY;

        ctx.clearRect(0, 0, wOut, hOut);
        ctx.drawImage(p.img, dxOut, dyOut, dwOut, dhOut);
        return out.toDataURL('image/jpeg', 0.85);
    };

    const exportCroppedAvatar = (sizePx = 96) => {
        const params = computeDrawParams();
        if (!params) return '';

        const { g } = params;
        const out = document.createElement('canvas');
        out.width = sizePx;
        out.height = sizePx;

        const ctx = out.getContext('2d');
        if (!ctx) return '';

        const scaleOut = sizePx / g.cropSize;
        const dxOut = (params.dx - g.cropX) * scaleOut;
        const dyOut = (params.dy - g.cropY) * scaleOut;
        const dwOut = params.dw * scaleOut;
        const dhOut = params.dh * scaleOut;

        ctx.clearRect(0, 0, sizePx, sizePx);
        ctx.drawImage(params.img, dxOut, dyOut, dwOut, dhOut);
        return out.toDataURL('image/jpeg', 0.85);
    };

    // Load current settings into the form
    async function loadSettings() {
        const cfg = await window.configManager.getConfig();
        const profile = cfg?.profile || {};

        // Helper to set value if element exists
        const setValueIfExists = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.value = value ?? '';
        };

        // Personal Information
        setValueIfExists('name', profile.name);
        setValueIfExists('title', profile.title);
        setValueIfExists('location', profile.location);
        
        // Social Links
        setValueIfExists('githubUsername', profile.githubUsername);
        setValueIfExists('linkedinUrl', profile.linkedinUrl);
        setValueIfExists('leetcodeUsername', profile.leetcodeUsername);

        setValueIfExists('customQuote', profile.customQuote || '');

        setAvatarPreview(cfg?.avatarImage || '');
        setBannerPreview(cfg?.bannerImage || '');
    }

    // Save settings from the form to config.js
    async function saveSettings() {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};

        const updatedProfile = {
            ...existing,
            name: document.getElementById('name')?.value ?? existing.name,
            title: document.getElementById('title')?.value ?? existing.title,
            location: document.getElementById('location')?.value ?? existing.location,
            githubUsername: document.getElementById('githubUsername')?.value ?? existing.githubUsername,
            linkedinUrl: document.getElementById('linkedinUrl')?.value ?? existing.linkedinUrl,
            leetcodeUsername: document.getElementById('leetcodeUsername')?.value ?? existing.leetcodeUsername,
            customQuote: document.getElementById('customQuote')?.value ?? existing.customQuote
        };

        await window.configManager.setProfile(updatedProfile);
    }

    async function saveAvatarDataUrl(dataUrl) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};

        await window.configManager.setProfile({
            ...existing,
            avatarImage: dataUrl
        });
    }

    async function saveBannerDataUrl(dataUrl) {
        const cfg = await window.configManager.getConfig();
        const existingAssets = cfg?.assets || {};
        await window.configManager.setAssets({
            ...existingAssets,
            bannerImage: dataUrl
        });
    }

    // Event Listeners
    settingsButton.addEventListener('click', function() {
        // Toggle behavior: if open, close; if closed, open and load
        const isOpen = modal.style.display === 'block';
        if (isOpen) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        } else {
            loadSettings().then(() => {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            });
        }
    });

    closeButton.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    cancelButton.addEventListener('click', function() {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    saveButton.addEventListener('click', function() {
        saveSettings().then(() => {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
    });

    if (avatarUpload) {
        avatarUpload.addEventListener('change', async (e) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            try {
                await openAvatarCropper(file);
            } catch (err) {
                console.error('Avatar upload failed:', err);
            } finally {
                avatarUpload.value = '';
            }
        });
    }

    if (avatarCropZoom) {
        avatarCropZoom.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            cropState.zoom = Number.isFinite(v) ? v : 1;
            renderCropCanvas();
        });
    }

    if (bannerCropZoom) {
        bannerCropZoom.addEventListener('input', (e) => {
            const v = parseFloat(e.target.value);
            bannerCropState.zoom = Number.isFinite(v) ? v : 1;
            renderBannerCropCanvas();
        });
    }

    if (avatarCropCanvas) {
        const getPoint = (evt) => {
            const rect = avatarCropCanvas.getBoundingClientRect();
            const x = (evt.clientX ?? 0) - rect.left;
            const y = (evt.clientY ?? 0) - rect.top;
            return { x, y };
        };

        avatarCropCanvas.addEventListener('pointerdown', (evt) => {
            if (!cropState.img) return;
            avatarCropCanvas.setPointerCapture(evt.pointerId);
            cropState.dragging = true;
            const p = getPoint(evt);
            cropState.dragStartX = p.x;
            cropState.dragStartY = p.y;
            cropState.dragStartOffsetX = cropState.offsetX;
            cropState.dragStartOffsetY = cropState.offsetY;
        });

        avatarCropCanvas.addEventListener('pointermove', (evt) => {
            if (!cropState.dragging) return;
            const p = getPoint(evt);
            cropState.offsetX = cropState.dragStartOffsetX + (p.x - cropState.dragStartX);
            cropState.offsetY = cropState.dragStartOffsetY + (p.y - cropState.dragStartY);
            renderCropCanvas();
        });

        const endDrag = () => {
            cropState.dragging = false;
        };

        avatarCropCanvas.addEventListener('pointerup', endDrag);
        avatarCropCanvas.addEventListener('pointercancel', endDrag);
        avatarCropCanvas.addEventListener('pointerleave', endDrag);
    }

    if (bannerCropCanvas) {
        const getPoint = (evt) => {
            const rect = bannerCropCanvas.getBoundingClientRect();
            const x = (evt.clientX ?? 0) - rect.left;
            const y = (evt.clientY ?? 0) - rect.top;
            return { x, y };
        };

        bannerCropCanvas.addEventListener('pointerdown', (evt) => {
            if (!bannerCropState.img) return;
            bannerCropCanvas.setPointerCapture(evt.pointerId);
            bannerCropState.dragging = true;
            const p = getPoint(evt);
            bannerCropState.dragStartX = p.x;
            bannerCropState.dragStartY = p.y;
            bannerCropState.dragStartOffsetX = bannerCropState.offsetX;
            bannerCropState.dragStartOffsetY = bannerCropState.offsetY;
        });

        bannerCropCanvas.addEventListener('pointermove', (evt) => {
            if (!bannerCropState.dragging) return;
            const p = getPoint(evt);
            bannerCropState.offsetX = bannerCropState.dragStartOffsetX + (p.x - bannerCropState.dragStartX);
            bannerCropState.offsetY = bannerCropState.dragStartOffsetY + (p.y - bannerCropState.dragStartY);
            renderBannerCropCanvas();
        });

        const endDrag = () => {
            bannerCropState.dragging = false;
        };

        bannerCropCanvas.addEventListener('pointerup', endDrag);
        bannerCropCanvas.addEventListener('pointercancel', endDrag);
        bannerCropCanvas.addEventListener('pointerleave', endDrag);
    }

    if (avatarCropSave) {
        avatarCropSave.addEventListener('click', () => {
            const dataUrl = exportCroppedAvatar(96);
            if (!dataUrl) {
                closeAvatarCropper();
                return;
            }

            setAvatarPreview(dataUrl);
            saveAvatarDataUrl(dataUrl).then(() => {
                closeAvatarCropper();
            });
        });
    }

    if (bannerCropSave) {
        bannerCropSave.addEventListener('click', () => {
            const dataUrl = exportCroppedBanner(1200, 300);
            if (!dataUrl) {
                closeBannerCropper();
                return;
            }

            setBannerPreview(dataUrl);
            saveBannerDataUrl(dataUrl).then(() => {
                closeBannerCropper();
            });
        });
    }

    if (avatarCropCancel) {
        avatarCropCancel.addEventListener('click', () => {
            closeAvatarCropper();
        });
    }

    if (bannerCropCancel) {
        bannerCropCancel.addEventListener('click', () => {
            closeBannerCropper();
        });
    }

    if (avatarCropClose) {
        avatarCropClose.addEventListener('click', () => {
            closeAvatarCropper();
        });
    }

    if (bannerCropClose) {
        bannerCropClose.addEventListener('click', () => {
            closeBannerCropper();
        });
    }

    // Close crop modal when clicking outside the content
    window.addEventListener('click', function(event) {
        if (event.target === avatarCropModal) {
            closeAvatarCropper();
        }

        if (event.target === bannerCropModal) {
            closeBannerCropper();
        }
    });

    if (bannerUpload) {
        bannerUpload.addEventListener('change', async (e) => {
            const file = e.target?.files?.[0];
            if (!file) return;

            try {
                await openBannerCropper(file);
            } catch (err) {
                console.error('Banner upload failed:', err);
            } finally {
                bannerUpload.value = '';
            }
        });
    }

    if (resetAvatarButton) {
        resetAvatarButton.addEventListener('click', () => {
            saveAvatarDataUrl('').then(() => {
                window.configManager.getConfig().then((cfg) => {
                    setAvatarPreview(cfg?.avatarImage || '');
                });
            });
        });
    }

    if (resetBannerButton) {
        resetBannerButton.addEventListener('click', () => {
            saveBannerDataUrl('').then(() => {
                window.configManager.getConfig().then((cfg) => {
                    setBannerPreview(cfg?.bannerImage || '');
                });
            });
        });
    }

    // Close modal when clicking outside the content
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && avatarCropModal && avatarCropModal.style.display === 'block') {
            closeAvatarCropper();
            return;
        }

        if (e.key === 'Escape' && bannerCropModal && bannerCropModal.style.display === 'block') {
            closeBannerCropper();
            return;
        }

        if (e.key === 'Escape' && modal.style.display === 'block') {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    // No local persistence here; profile is stored in chrome.storage.sync via configManager
});
