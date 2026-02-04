// Settings Module
document.addEventListener('DOMContentLoaded', function() {
    // Get the modal elements
    const modal = document.getElementById('settingsModal');
    const settingsButton = document.getElementById('settingsButton');
    const closeButton = document.querySelector('#settingsModal .close');
    const cancelButton = document.getElementById('cancelSettings');
    const saveButton = document.getElementById('saveSettings');
    const settingsForm = document.getElementById('settingsForm');

    // Avatar and banner elements (optional - may not exist in HTML)
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

        // Helper to set checkbox if element exists
        const setCheckboxIfExists = (id, value) => {
            const el = document.getElementById(id);
            if (el) el.checked = value ?? false;
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
        setValueIfExists('backgroundImage', profile.backgroundImage || '');

        // Display Settings
        setCheckboxIfExists('showYearDots', profile.showYearDots !== false); // Default to true
        setCheckboxIfExists('showGitStats', profile.showGitStats !== false); // Default to true
        setCheckboxIfExists('showTodo', profile.showTodo !== false); // Default to true
        setCheckboxIfExists('showLeetcode', profile.showLeetcode !== false); // Default to true
        setCheckboxIfExists('darkFont', profile.darkFont !== false); // Default to true (dark font)

        // Apply visibility settings immediately when loading settings
        applyYearDotsVisibility(profile.showYearDots !== false);
        applyGitStatsVisibility(profile.showGitStats !== false);
        applyTodoVisibility(profile.showTodo !== false);
        applyLeetcodeVisibility(profile.showLeetcode !== false);
        
        // Apply background image immediately when loading settings
        applyBackgroundImage(profile.backgroundImage || '');
        
        // Apply font color immediately when loading settings
        applyFontColor(profile.darkFont === true);

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
            customQuote: document.getElementById('customQuote')?.value ?? existing.customQuote,
            backgroundImage: document.getElementById('backgroundImage')?.value ?? existing.backgroundImage,
            showYearDots: document.getElementById('showYearDots')?.checked ?? true,
            showGitStats: document.getElementById('showGitStats')?.checked ?? true,
            showTodo: document.getElementById('showTodo')?.checked ?? true,
            showLeetcode: document.getElementById('showLeetcode')?.checked ?? true,
            darkFont: document.getElementById('darkFont')?.checked ?? true
        };

        await window.configManager.setProfile(updatedProfile);
        
        // Apply all visibility settings immediately
        applyYearDotsVisibility(updatedProfile.showYearDots !== false);
        applyGitStatsVisibility(updatedProfile.showGitStats !== false);
        applyTodoVisibility(updatedProfile.showTodo !== false);
        applyLeetcodeVisibility(updatedProfile.showLeetcode !== false);
        
        // Apply background image immediately
        applyBackgroundImage(updatedProfile.backgroundImage || '');
        
        // Apply font color immediately
        applyFontColor(updatedProfile.darkFont === true);
    }

    // Apply year dots visibility based on setting
    function applyYearDotsVisibility(show) {
        const yearDotsWrapper = document.querySelector('.year-dots-wrapper');
        if (yearDotsWrapper) {
            if (show) {
                yearDotsWrapper.classList.remove('hidden');
            } else {
                yearDotsWrapper.classList.add('hidden');
            }
        }
    }

    // Apply Git Stats visibility based on setting
    function applyGitStatsVisibility(show) {
        const gitStatsSection = document.querySelector('.git-stats-section');
        if (gitStatsSection) {
            if (show) {
                gitStatsSection.classList.remove('hidden');
            } else {
                gitStatsSection.classList.add('hidden');
            }
        }
    }

    // Apply Todo visibility based on setting
    function applyTodoVisibility(show) {
        const todoSection = document.querySelector('.todo-section');
        if (todoSection) {
            if (show) {
                todoSection.classList.remove('hidden');
            } else {
                todoSection.classList.add('hidden');
            }
        }
    }

    // Apply LeetCode visibility based on setting
    function applyLeetcodeVisibility(show) {
        const leetcodeSection = document.querySelector('.leetcode-section');
        if (leetcodeSection) {
            if (show) {
                leetcodeSection.classList.remove('hidden');
            } else {
                leetcodeSection.classList.add('hidden');
            }
        }
    }

    // Apply background image based on setting
    function applyBackgroundImage(imageUrl) {
        // Only apply background image on the src/index.html page (minimal dashboard)
        // Check if we're on the minimal dashboard by looking for specific elements
        const isMinimalDashboard = document.querySelector('.year-dots-wrapper') || 
                                   document.querySelector('.leetcode-stats') ||
                                   document.getElementById('searchInput');
        
        if (!isMinimalDashboard) {
            return; // Don't apply background on main index.html
        }
        
        if (imageUrl && imageUrl.trim() !== '') {
            document.body.style.backgroundImage = `url(${imageUrl})`;
        } else {
            document.body.style.backgroundImage = '';
        }
    }

    // Apply font color based on setting
    function applyFontColor(isDark) {
        // Only apply font color on the src/index.html page (minimal dashboard)
        // Check if we're on the minimal dashboard by looking for specific elements
        const isMinimalDashboard = document.querySelector('.year-dots-wrapper') || 
                                   document.querySelector('.leetcode-stats') ||
                                   document.getElementById('searchInput');
        
        if (!isMinimalDashboard) {
            return; // Don't apply font color on main index.html
        }
        
        // Elements outside containers (should change with font color toggle)
        const outsideElements = [
            'body', '.time', '.date', '.quote'
        ];
        
        // Elements inside containers (should always remain black - no changes)
        // These are excluded from font color changes
        
        const iconElements = [
            '.social-icon img', '.settings .social-icon img', 
            '.social-icons-right .social-icon img', '.social-icons-left .social-icon img',
            '.todo-checkbox', '.todo-actions button', '.add-todo-btn'
        ];
        
        // Apply colors to outside elements only
        outsideElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (isDark) {
                    element.classList.remove('light-font');
                    element.classList.add('dark-font');
                } else {
                    element.classList.remove('dark-font');
                    element.classList.add('light-font');
                }
            });
        });

        // Apply icon color changes
        iconElements.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(element => {
                if (isDark) {
                    // Dark font - make icons dark (black/dark gray)
                    if (element.classList.contains('todo-checkbox')) {
                        element.style.borderColor = '#111';
                        element.style.backgroundColor = '#fff';
                    } else if (element.classList.contains('add-todo-btn')) {
                        element.style.color = '#fff';
                        element.style.backgroundColor = '#111';
                    } else if (element.tagName === 'IMG') {
                        element.style.filter = 'brightness(0) saturate(100%)'; // Makes images black
                    } else {
                        element.style.color = '#111';
                    }
                } else {
                    // Light font - make icons light (white)
                    if (element.classList.contains('todo-checkbox')) {
                        element.style.borderColor = '#fff';
                        element.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
                    } else if (element.classList.contains('add-todo-btn')) {
                        element.style.color = '#111';
                        element.style.backgroundColor = '#fff';
                    } else if (element.tagName === 'IMG') {
                        element.style.filter = 'brightness(0) invert(1)'; // Makes images white
                    } else {
                        element.style.color = '#fff';
                    }
                }
            });
        });
    }

    // Apply year dots visibility on page load
    async function applyInitialSettings() {
        if (window.configManager) {
            const cfg = await window.configManager.getConfig();
            const profile = cfg?.profile || {};
            applyYearDotsVisibility(profile.showYearDots !== false);
            applyGitStatsVisibility(profile.showGitStats !== false);
            applyTodoVisibility(profile.showTodo !== false);
            applyLeetcodeVisibility(profile.showLeetcode !== false);
            applyBackgroundImage(profile.backgroundImage || '');
            applyFontColor(profile.darkFont !== false);
        }
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

    // Apply initial settings on page load
    applyInitialSettings();

    // Check for command message from previous session and show it
    const commandMessage = sessionStorage.getItem('commandMessage');
    if (commandMessage) {
        // Show the message after a short delay to ensure page is loaded
        setTimeout(() => {
            showCommandFeedback(commandMessage);
        }, 500);
        // Clear the message after showing it
        sessionStorage.removeItem('commandMessage');
    }

    // Initialize Google Search functionality
    initializeGoogleSearch();

    // No local persistence here; profile is stored in chrome.storage.sync via configManager
});

// Initialize Google Search functionality
function initializeGoogleSearch() {
    const searchInput = document.getElementById('searchInput');
    
    if (searchInput) {
        // Handle Enter key press
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                performGoogleSearch();
            }
        });
        
        // Handle search icon click or other interactions if needed
        searchInput.addEventListener('search', function(event) {
            // This fires when the user clears the search or clicks the clear button
            if (event.target.value.trim() === '') {
                return;
            }
            performGoogleSearch();
        });
    }
}

// Perform Google Search
function performGoogleSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (query) {
        // Check for special commands starting with ">>"
        if (query.startsWith('>>')) {
            handleCommand(query);
            searchInput.value = ''; // Clear input after command
            return;
        }
        
        // Encode the query for URL
        const encodedQuery = encodeURIComponent(query);
        // Open Google search in the same tab
        const googleSearchUrl = `https://www.google.com/search?q=${encodedQuery}`;
        window.location.href = googleSearchUrl;
    }
}

// Handle special commands
function handleCommand(command) {
    const cmd = command.toLowerCase().trim();
    
    if (cmd === '>>run all') {
        // Toggle on all sections
        const yearDotsCheckbox = document.getElementById('showYearDots');
        const gitCheckbox = document.getElementById('showGitStats');
        const leetCheckbox = document.getElementById('showLeetcode');
        const todoCheckbox = document.getElementById('showTodo');
        
        if (yearDotsCheckbox) yearDotsCheckbox.checked = true;
        if (gitCheckbox) gitCheckbox.checked = true;
        if (leetCheckbox) leetCheckbox.checked = true;
        if (todoCheckbox) todoCheckbox.checked = true;
        
        saveAllSettings(true);
        sessionStorage.setItem('commandMessage', 'All sections enabled');
        setTimeout(() => location.reload(), 100);
    } else if (cmd === '>>end all') {
        // Toggle off all sections
        const yearDotsCheckbox = document.getElementById('showYearDots');
        const gitCheckbox = document.getElementById('showGitStats');
        const leetCheckbox = document.getElementById('showLeetcode');
        const todoCheckbox = document.getElementById('showTodo');
        
        if (yearDotsCheckbox) yearDotsCheckbox.checked = false;
        if (gitCheckbox) gitCheckbox.checked = false;
        if (leetCheckbox) leetCheckbox.checked = false;
        if (todoCheckbox) todoCheckbox.checked = false;
        
        saveAllSettings(false);
        sessionStorage.setItem('commandMessage', 'All sections disabled');
        setTimeout(() => location.reload(), 100);
    } else if (cmd === '>>run dots') {
        // Toggle on year dots
        const yearDotsCheckbox = document.getElementById('showYearDots');
        if (yearDotsCheckbox) {
            yearDotsCheckbox.checked = true;
            saveYearDotsSetting(true);
            sessionStorage.setItem('commandMessage', 'Year dots enabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>end dots') {
        // Toggle off year dots
        const yearDotsCheckbox = document.getElementById('showYearDots');
        if (yearDotsCheckbox) {
            yearDotsCheckbox.checked = false;
            saveYearDotsSetting(false);
            sessionStorage.setItem('commandMessage', 'Year dots disabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>run git') {
        // Toggle on git stats
        const gitCheckbox = document.getElementById('showGitStats');
        if (gitCheckbox) {
            gitCheckbox.checked = true;
            saveGitStatsSetting(true);
            sessionStorage.setItem('commandMessage', 'Git stats enabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>end git') {
        // Toggle off git stats
        const gitCheckbox = document.getElementById('showGitStats');
        if (gitCheckbox) {
            gitCheckbox.checked = false;
            saveGitStatsSetting(false);
            sessionStorage.setItem('commandMessage', 'Git stats disabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>run leet') {
        // Toggle on leetcode
        const leetCheckbox = document.getElementById('showLeetcode');
        if (leetCheckbox) {
            leetCheckbox.checked = true;
            saveLeetcodeSetting(true);
            sessionStorage.setItem('commandMessage', 'LeetCode stats enabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>end leet') {
        // Toggle off leetcode
        const leetCheckbox = document.getElementById('showLeetcode');
        if (leetCheckbox) {
            leetCheckbox.checked = false;
            saveLeetcodeSetting(false);
            sessionStorage.setItem('commandMessage', 'LeetCode stats disabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>run todo') {
        // Toggle on todo
        const todoCheckbox = document.getElementById('showTodo');
        if (todoCheckbox) {
            todoCheckbox.checked = true;
            saveTodoSetting(true);
            sessionStorage.setItem('commandMessage', 'Todo enabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>end todo') {
        // Toggle off todo
        const todoCheckbox = document.getElementById('showTodo');
        if (todoCheckbox) {
            todoCheckbox.checked = false;
            saveTodoSetting(false);
            sessionStorage.setItem('commandMessage', 'Todo disabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>dark') {
        // Toggle on dark font color
        const darkFontCheckbox = document.getElementById('darkFont');
        if (darkFontCheckbox) {
            darkFontCheckbox.checked = true;
            saveDarkFontSetting(true);
            sessionStorage.setItem('commandMessage', 'Dark font color enabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd === '>>light') {
        // Toggle off dark font color (enable light font)
        const darkFontCheckbox = document.getElementById('darkFont');
        if (darkFontCheckbox) {
            darkFontCheckbox.checked = false;
            saveDarkFontSetting(false);
            sessionStorage.setItem('commandMessage', 'Light font color enabled');
            setTimeout(() => location.reload(), 100);
        }
    } else if (cmd.startsWith('>>img')) {
        // Set background image or clear if no URL provided
        if (cmd === '>>img') {
            // Clear background image (return to default)
            saveBackgroundImageSetting('');
            sessionStorage.setItem('commandMessage', 'Background image cleared');
            setTimeout(() => location.reload(), 100);
        } else {
            // Set background image from URL
            const urlMatch = command.match(/^>>img\s+"([^"]+)"/);
            if (urlMatch && urlMatch[1]) {
                const imageUrl = urlMatch[1].trim();
                if (imageUrl) {
                    saveBackgroundImageSetting(imageUrl);
                    sessionStorage.setItem('commandMessage', 'Background image updated');
                    setTimeout(() => location.reload(), 100);
                }
            } else {
                showCommandFeedback('Invalid image command format. Use: >>img "URL"');
            }
        }
    } else {
        // Unknown command
        showCommandFeedback('Unknown command: ' + command);
    }
}

// Save year dots setting
async function saveYearDotsSetting(showDots) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            showYearDots: showDots
        };
        
        await window.configManager.setProfile(updatedProfile);
        applyYearDotsVisibility(showDots);
    }
}

// Save git stats setting
async function saveGitStatsSetting(showGit) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            showGitStats: showGit
        };
        
        await window.configManager.setProfile(updatedProfile);
        applyGitStatsVisibility(showGit);
    }
}

// Save leetcode setting
async function saveLeetcodeSetting(showLeet) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            showLeetcode: showLeet
        };
        
        await window.configManager.setProfile(updatedProfile);
        applyLeetcodeVisibility(showLeet);
    }
}

// Save todo setting
async function saveTodoSetting(showTodo) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            showTodo: showTodo
        };
        
        await window.configManager.setProfile(updatedProfile);
        applyTodoVisibility(showTodo);
    }
}

// Save dark font setting
async function saveDarkFontSetting(isDark) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            darkFont: isDark
        };
        
        await window.configManager.setProfile(updatedProfile);
        applyFontColor(isDark);
    }
}

// Save background image setting
async function saveBackgroundImageSetting(imageUrl) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            backgroundImage: imageUrl
        };
        
        await window.configManager.setProfile(updatedProfile);
        applyBackgroundImage(imageUrl);
    }
}

// Save all section settings at once
async function saveAllSettings(showAll) {
    if (window.configManager) {
        const cfg = await window.configManager.getConfig();
        const existing = cfg?.profile || {};
        
        const updatedProfile = {
            ...existing,
            showYearDots: showAll,
            showGitStats: showAll,
            showTodo: showAll,
            showLeetcode: showAll
        };
        
        await window.configManager.setProfile(updatedProfile);
        
        // Apply all visibility settings immediately
        applyYearDotsVisibility(showAll);
        applyGitStatsVisibility(showAll);
        applyTodoVisibility(showAll);
        applyLeetcodeVisibility(showAll);
    }
}

// Show command feedback
function showCommandFeedback(message) {
    // Create a temporary feedback element
    const feedback = document.createElement('div');
    feedback.textContent = message;
    feedback.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #111;
        color: #fff;
        padding: 10px 15px;
        border-radius: 6px;
        font-size: 14px;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    
    document.body.appendChild(feedback);
    
    // Fade in
    setTimeout(() => {
        feedback.style.opacity = '1';
    }, 10);
    
    // Fade out and remove after 2 seconds
    setTimeout(() => {
        feedback.style.opacity = '0';
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 300);
    }, 2000);
}
