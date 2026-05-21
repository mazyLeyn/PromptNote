/**
 * PromptNote — app.js
 * Modüler, vintage temalı not alma uygulaması.
 * Özellikler:
 *  - SPA ekran geçişleri (Ana / Notlarım)
 *  - Pul seçici (CSS tırtıklı kenar, vintage tasarım)
 *  - Zarf galerisi (CSS Grid, pseudo-element katlanma efektleri)
 *  - Zarf açılma animasyonu + parşömen mektup slide-up
 *  - LocalStorage: id, baslik, icerik, tarih, secilenPul
 *  - Tüm mevcut fidget toy özellikleri korundu
 */

document.addEventListener('DOMContentLoaded', () => {

    // =====================================================
    // PUL VERİTABANI
    // Placeholder: gerçek projede bunlar .png/.svg olabilir.
    // Her pul: id, emoji art, ülke, değer, accent rengi
    // =====================================================
    const STAMPS = [
        { id: 'owl',     art: '🦉', country: 'Anadolu',  value: '5 Kr',  accent: '#4a6741' },
        { id: 'rose',    art: '🌹', country: 'İstanbul', value: '10 Kr', accent: '#7a2535' },
        { id: 'anchor',  art: '⚓', country: 'Bosphorus', value: '3 Kr', accent: '#2c4a6e' },
        { id: 'moon',    art: '🌙', country: 'Orient',   value: '8 Kr',  accent: '#5a4030' },
        { id: 'leaf',    art: '🍃', country: 'Anatolia', value: '2 Kr',  accent: '#3a5c38' },
        { id: 'key',     art: '🗝️', country: 'Kapıkule', value: '15 Kr', accent: '#6a5020' },
        { id: 'feather', art: '🪶', country: 'Yazı Ev',  value: '1 Kr',  accent: '#5a4060' },
        { id: 'eye',     art: '🧿', country: 'Nazar',    value: '6 Kr',  accent: '#2a5570' },
        { id: 'flame',   art: '🕯️', country: 'Mektup',   value: '4 Kr',  accent: '#704020' },
    ];

    // =====================================================
    // STATE
    // =====================================================
    let notes          = JSON.parse(localStorage.getItem('promptNotes')) || [];
    let selectedStamp  = null;   // Seçili pul id'si
    let stampPanelOpen = false;  // Pul paneli açık mı?
    let currentScreen  = 'home'; // 'home' | 'gallery'
    let openModalNoteId = null;  // Açık modal not id'si

    // =====================================================
    // DOM REFERANSLARI
    // =====================================================
    const noteForm          = document.getElementById('note-form');
    const noteInput         = document.getElementById('note-input');
    const notesGrid         = document.getElementById('notes-grid');
    const sidebar           = document.getElementById('sidebar');
    const sidebarToggle     = document.getElementById('sidebar-toggle');
    const mobileOverlay     = document.getElementById('mobile-overlay');

    const screenHome        = document.getElementById('screen-home');
    const screenGallery     = document.getElementById('screen-gallery');
    const galleryToggleBtn  = document.getElementById('gallery-toggle-btn');
    const gtbBadge          = document.getElementById('gtb-badge');
    const envelopesGrid     = document.getElementById('envelopes-grid');
    const gallerySubtitle   = document.getElementById('gallery-subtitle');
    const galleryEmpty      = document.getElementById('gallery-empty');

    const stampSelectorArea = document.getElementById('stamp-selector-area');
    const selectedStampSlot = document.getElementById('selected-stamp-slot');
    const stampGalleryPanel = document.getElementById('stamp-gallery-panel');
    const stampGalleryGrid  = document.getElementById('stamp-gallery-grid');

    const modalOverlay      = document.getElementById('envelope-modal-overlay');
    const modalEnvFlap      = document.getElementById('modal-env-flap');
    const modalCloseBtn     = document.getElementById('modal-close-btn');
    const modalStampSlot    = document.getElementById('modal-stamp-slot');
    const modalLetterDate   = document.getElementById('modal-letter-date');
    const modalLetterContent = document.getElementById('modal-letter-content');

    // =====================================================
    // YARDIMCI FONKSİYONLAR
    // =====================================================

    function escapeHTML(str) {
        return String(str).replace(/[&<>'"]/g,
            tag => ({ '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;' }[tag])
        );
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
    }

    function shortDate(dateString) {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    }

    /** Metnin ilk ~40 karakterini başlık olarak döndürür */
    function makeTitle(content) {
        const clean = content.replace(/\n/g, ' ').trim();
        return clean.length > 42 ? clean.slice(0, 42) + '…' : clean;
    }

    function saveNotes() {
        localStorage.setItem('promptNotes', JSON.stringify(notes));
    }

    function getStampById(id) {
        return STAMPS.find(s => s.id === id) || null;
    }

    // =====================================================
    // ROZET GÜNCELLEME
    // =====================================================
    function updateBadge() {
        const count = notes.length;
        gtbBadge.textContent = count;
        gtbBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }

    // =====================================================
    // SPA EKRAN GEÇİŞLERİ
    // =====================================================
    function showScreen(name) {
        currentScreen = name;

        if (name === 'home') {
            screenGallery.classList.add('screen-hidden');
            screenHome.classList.remove('screen-hidden');
            // Buton ikonları
            document.querySelector('.gtb-icon-notebook').style.display = '';
            document.querySelector('.gtb-label-open').style.display    = '';
            document.querySelector('.gtb-icon-close').style.display    = 'none';
            document.querySelector('.gtb-label-close').style.display   = 'none';
        } else {
            screenHome.classList.add('screen-hidden');
            screenGallery.classList.remove('screen-hidden');
            document.querySelector('.gtb-icon-notebook').style.display = 'none';
            document.querySelector('.gtb-label-open').style.display    = 'none';
            document.querySelector('.gtb-icon-close').style.display    = '';
            document.querySelector('.gtb-label-close').style.display   = '';
            renderGallery();
        }
    }

    galleryToggleBtn.addEventListener('click', () => {
        showScreen(currentScreen === 'home' ? 'gallery' : 'home');
    });

    // İlk yüklemede home gizli değil, gallery gizli
    screenGallery.classList.add('screen-hidden');

    // =====================================================
    // PUL SEÇİCİ
    // =====================================================

    /** Pul küçük resim HTML üretici */
    function renderStampThumb(stamp, size = 'normal') {
        const small = size === 'small';
        const w = small ? 42 : 56;
        const h = small ? 52 : 68;
        return `
            <div class="stamp-thumb${selectedStamp === stamp.id ? ' selected' : ''}"
                 data-stamp-id="${stamp.id}"
                 style="width:${w}px;height:${h}px;"
                 title="${stamp.country} · ${stamp.value}">
                <div class="stamp-thumb-inner" style="background:${stamp.accent}18;">
                    <span class="stamp-art">${stamp.art}</span>
                    <span class="stamp-country">${stamp.country}</span>
                    <span class="stamp-value">${stamp.value}</span>
                </div>
            </div>`;
    }

    /** Seçili pul slot'unu güncelle */
    function updateStampSlot() {
        if (!selectedStamp) {
            selectedStampSlot.innerHTML = '<span class="stamp-slot-hint">＋</span>';
            return;
        }
        const stamp = getStampById(selectedStamp);
        if (!stamp) return;
        selectedStampSlot.innerHTML = renderStampThumb(stamp, 'normal');
    }

    /** Pul galerisi panelini doldur */
    function renderStampPanel() {
        stampGalleryGrid.innerHTML = STAMPS.map(s => renderStampThumb(s)).join('');
        // "Pulü kaldır" butonu
        stampGalleryGrid.insertAdjacentHTML('beforeend',
            `<button class="stamp-clear-btn" id="stamp-clear-btn">Pulsuz Gönder</button>`
        );

        // Pul seçme
        stampGalleryGrid.querySelectorAll('.stamp-thumb').forEach(el => {
            el.addEventListener('click', () => {
                selectedStamp = el.dataset.stampId;
                // Seçili class güncelle
                stampGalleryGrid.querySelectorAll('.stamp-thumb').forEach(t => t.classList.remove('selected'));
                el.classList.add('selected');
                updateStampSlot();
                closeStampPanel();
            });
        });

        document.getElementById('stamp-clear-btn').addEventListener('click', () => {
            selectedStamp = null;
            updateStampSlot();
            closeStampPanel();
        });
    }

    function openStampPanel() {
        stampPanelOpen = true;
        stampGalleryPanel.classList.add('open');
        renderStampPanel();
    }

    function closeStampPanel() {
        stampPanelOpen = false;
        stampGalleryPanel.classList.remove('open');
    }

    selectedStampSlot.addEventListener('click', (e) => {
        e.stopPropagation();
        stampPanelOpen ? closeStampPanel() : openStampPanel();
    });

    // Panel dışına tıklayınca kapat
    document.addEventListener('click', (e) => {
        if (stampPanelOpen && !stampSelectorArea.contains(e.target)) {
            closeStampPanel();
        }
    });

    // =====================================================
    // NOT EKLEME
    // =====================================================
    noteInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    noteInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() !== '') noteForm.dispatchEvent(new Event('submit'));
        }
    });

    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = noteInput.value.trim();
        if (!content) return;

        const newNote = {
            id:         Date.now().toString(36) + Math.random().toString(36).slice(2),
            baslik:     makeTitle(content),
            icerik:     content,
            tarih:      new Date().toISOString(),
            secilenPul: selectedStamp || null
        };

        notes.unshift(newNote);
        saveNotes();
        updateBadge();

        noteInput.value = '';
        noteInput.style.height = 'auto';

        renderSidebarNotes();

        // Mühür zıplama
        const seal = document.querySelector('.wax-seal');
        if (seal) {
            seal.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            seal.style.transform  = 'translate(-50%, 50%) scale(1.25) rotate(15deg)';
            setTimeout(() => {
                seal.style.transform = 'translate(-50%, 50%) scale(1) rotate(0deg)';
            }, 400);
        }

        // Küçük konfetti patlaması
        const btnRect = document.getElementById('add-btn').getBoundingClientRect();
        createParticleBurst(btnRect.left + btnRect.width / 2, btnRect.top + btnRect.height / 2, 14);
    });

    // =====================================================
    // SIDEBAR NOT LİSTESİ
    // =====================================================
    function renderSidebarNotes() {
        notesGrid.innerHTML = '';
        if (notes.length === 0) {
            notesGrid.innerHTML = `<div class="empty-state">Henüz not eklenmemiş.<br>İlk notunu yukarıdan ekleyebilirsin!</div>`;
            return;
        }
        const sorted = [...notes].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
        sorted.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.dataset.id = note.id;
            card.innerHTML = `
                <div class="note-content">${escapeHTML(note.icerik)}</div>
                <div class="note-footer">
                    <span class="note-date">${shortDate(note.tarih)}</span>
                    <button class="delete-btn" aria-label="Notu Sil" data-id="${note.id}">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>`;
            notesGrid.appendChild(card);
        });

        notesGrid.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => deleteNote(btn.dataset.id));
        });
    }

    function deleteNote(id) {
        // Sidebar'daki kart
        const card = document.querySelector(`.note-card[data-id="${id}"]`);
        if (card) {
            card.classList.add('deleting');
        }
        // Galeri zarfı
        const envCard = document.querySelector(`.env-card[data-id="${id}"]`);
        if (envCard) {
            envCard.style.transition = 'opacity 0.3s, transform 0.3s';
            envCard.style.opacity = '0';
            envCard.style.transform = 'scale(0.9)';
        }

        setTimeout(() => {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            updateBadge();
            renderSidebarNotes();
            if (currentScreen === 'gallery') renderGallery();
        }, 300);
    }

    // =====================================================
    // GALERİ EKRANI
    // =====================================================
    function buildStampHTML(stampId, size = 'normal') {
        const stamp = getStampById(stampId);
        if (!stamp) return '';
        const small = size === 'small';
        return `
            <div class="env-stamp" style="${small ? 'width:42px;height:52px;' : ''}">
                <div class="env-stamp-inner" style="background:${stamp.accent}22;">
                    <span class="env-stamp-art">${stamp.art}</span>
                    <span class="env-stamp-label">${stamp.value}</span>
                </div>
            </div>`;
    }

    function buildPostmarkHTML(lines = [3,5,4,3]) {
        return `
            <div class="env-postmark">
                <div class="env-postmark-lines">
                    ${lines.map(w => `<span style="width:${w * 5}px;"></span>`).join('')}
                </div>
            </div>`;
    }

    function renderGallery() {
        envelopesGrid.innerHTML = '';
        const count = notes.length;
        gallerySubtitle.textContent = count === 0 ? '0 not' : `${count} mektup`;
        galleryEmpty.style.display = count === 0 ? 'block' : 'none';
        envelopesGrid.style.display = count === 0 ? 'none' : 'grid';

        if (count === 0) return;

        const sorted = [...notes].sort((a, b) => new Date(b.tarih) - new Date(a.tarih));

        sorted.forEach((note, i) => {
            const card = document.createElement('div');
            card.className = 'env-card';
            card.dataset.id = note.id;
            card.style.animationDelay = `${i * 0.06}s`;

            const hasStamp = note.secilenPul && getStampById(note.secilenPul);

            card.innerHTML = `
                <div class="env-body">
                    <div class="env-stitching"></div>
                    <div class="env-flap"></div>

                    ${buildPostmarkHTML()}

                    <div class="env-stamp-slot">
                        ${hasStamp ? buildStampHTML(note.secilenPul, 'small') : ''}
                    </div>

                    <div class="env-date-stamp">${shortDate(note.tarih).toUpperCase()}</div>

                    <div class="env-label-strip">
                        <div class="env-title">${escapeHTML(note.baslik)}</div>
                    </div>

                    <button class="env-delete-btn" data-id="${note.id}" title="Notu Sil">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        </svg>
                        Sil
                    </button>
                </div>`;

            // Zarfa tıklama → modal aç
            card.querySelector('.env-body').addEventListener('click', (e) => {
                if (e.target.closest('.env-delete-btn')) return;
                openEnvelopeModal(note);
            });

            // Sil butonu
            card.querySelector('.env-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });

            envelopesGrid.appendChild(card);
        });
    }

    // =====================================================
    // ZARF AÇILMA MODAL
    // =====================================================
    function openEnvelopeModal(note) {
        openModalNoteId = note.id;

        // İçerikleri doldur
        modalLetterDate.textContent = formatDate(note.tarih);
        modalLetterContent.textContent = note.icerik;

        // Pul
        modalStampSlot.innerHTML = '';
        if (note.secilenPul && getStampById(note.secilenPul)) {
            const stamp = getStampById(note.secilenPul);
            modalStampSlot.innerHTML = `
                <div class="env-stamp" style="width:48px;height:58px;">
                    <div class="env-stamp-inner" style="background:${stamp.accent}22;">
                        <span class="env-stamp-art" style="font-size:1.5rem;">${stamp.art}</span>
                        <span class="env-stamp-label">${stamp.country}</span>
                        <span class="env-stamp-label">${stamp.value}</span>
                    </div>
                </div>`;
        }

        // Overlay açılış
        modalOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeEnvelopeModal() {
        modalOverlay.classList.remove('open');
        document.body.style.overflow = '';
        openModalNoteId = null;
    }

    modalCloseBtn.addEventListener('click', closeEnvelopeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeEnvelopeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && openModalNoteId) closeEnvelopeModal();
    });

    // =====================================================
    // MOBİL SİDEBAR
    // =====================================================
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        mobileOverlay.classList.toggle('active');
    }
    sidebarToggle.addEventListener('click', toggleSidebar);
    mobileOverlay.addEventListener('click', () => {
        if (sidebar.classList.contains('open')) toggleSidebar();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) toggleSidebar();
    });

    // =====================================================
    // İLK RENDER
    // =====================================================
    renderSidebarNotes();
    updateBadge();

    // =====================================================
    // SERVICE WORKER
    // =====================================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => {});
        });
    }

    // =========================================================
    // ↓↓↓  MEVCUT FİDGET TOY KODEKLERİ (aynen korundu)  ↓↓↓
    // =========================================================

    // ---- INK TRAIL CANVAS ----
    const inkCanvas = document.getElementById('ink-canvas');
    const inkCtx    = inkCanvas.getContext('2d');
    let inkTrails   = [];

    function resizeCanvas() {
        inkCanvas.width  = window.innerWidth;
        inkCanvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    function drawInkTrails() {
        inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
        for (let t = inkTrails.length - 1; t >= 0; t--) {
            const trail = inkTrails[t];
            let allDead = true;
            for (let i = 0; i < trail.points.length; i++) {
                trail.points[i].age += 0.004;
                if (trail.points[i].age < 1) allDead = false;
            }
            if (allDead) { inkTrails.splice(t, 1); continue; }
            for (let i = 1; i < trail.points.length; i++) {
                const p0 = trail.points[i - 1];
                const p1 = trail.points[i];
                const alpha = Math.max(0, 1 - Math.max(p0.age, p1.age));
                if (alpha <= 0) continue;
                inkCtx.beginPath();
                inkCtx.moveTo(p0.x, p0.y);
                inkCtx.lineTo(p1.x, p1.y);
                inkCtx.strokeStyle = `rgba(200, 160, 80, ${alpha * 0.7})`;
                inkCtx.lineWidth   = trail.width * (1 - p1.age * 0.3);
                inkCtx.lineCap     = 'round';
                inkCtx.lineJoin    = 'round';
                inkCtx.stroke();
            }
        }
        if (inkTrails.length > 0) requestAnimationFrame(drawInkTrails);
    }

    // ---- DRAGGABLE FOUNTAIN PEN ----
    const pen = document.getElementById('fidget-pen');
    let penDragging  = false;
    let penOffX = 0, penOffY = 0;
    let penX, penY;
    let currentTrail = null;
    const penInitBottom = 32, penInitRight = 96;

    function getPenPos() {
        const rect = pen.getBoundingClientRect();
        return { x: rect.left + rect.width / 2, y: rect.bottom };
    }

    function startPenDrag(clientX, clientY) {
        penDragging = true;
        pen.classList.add('dragging');
        pen.classList.remove('idle-wobble');
        const rect = pen.getBoundingClientRect();
        penOffX = clientX - rect.left;
        penOffY = clientY - rect.top;
        pen.style.transition = 'none';
        currentTrail = { points: [], width: 2.5 };
        inkTrails.push(currentTrail);
        if (inkTrails.length === 1) requestAnimationFrame(drawInkTrails);
    }

    function movePenDrag(clientX, clientY) {
        if (!penDragging) return;
        penX = clientX - penOffX;
        penY = clientY - penOffY;
        pen.style.left   = penX + 'px';
        pen.style.top    = penY + 'px';
        pen.style.right  = 'auto';
        pen.style.bottom = 'auto';
        if (currentTrail) {
            const nibPos = getPenPos();
            currentTrail.points.push({ x: nibPos.x, y: nibPos.y, age: 0 });
            if (currentTrail.points.length > 200) currentTrail.points.shift();
        }
    }

    function endPenDrag() {
        if (!penDragging) return;
        penDragging  = false;
        currentTrail = null;
        pen.classList.remove('dragging');
        pen.style.transition = 'filter 0.2s';
        setTimeout(() => pen.classList.add('idle-wobble'), 1000);
    }

    pen.addEventListener('mousedown', (e) => { e.preventDefault(); startPenDrag(e.clientX, e.clientY); });
    document.addEventListener('mousemove', (e) => movePenDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', () => { if (penDragging) endPenDrag(); });

    pen.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        startPenDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (penDragging) {
            const t = e.touches[0];
            movePenDrag(t.clientX, t.clientY);
        }
    }, { passive: false });
    document.addEventListener('touchend', () => { if (penDragging) endPenDrag(); });

    pen.addEventListener('dblclick', () => {
        inkTrails = [];
        inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    });

    setTimeout(() => pen.classList.add('idle-wobble'), 2000);

    // ---- SPINNABLE WAX SEAL ----
    const waxSeal = document.querySelector('.wax-seal');
    if (waxSeal) {
        waxSeal.classList.add('interactive');
        const glowEl = document.createElement('div');
        glowEl.className = 'seal-glow';
        waxSeal.appendChild(glowEl);

        let sealSpinning = false, sealAngle = 0, sealVelocity = 0, sealLastAngle = 0;
        let sealAnimFrame = null;

        function getSealCenter() {
            const rect = waxSeal.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }
        function getAngleFromCenter(cx, cy) {
            const c = getSealCenter();
            return Math.atan2(cy - c.y, cx - c.x);
        }
        function startSealSpin(cx, cy) {
            sealSpinning = true;
            waxSeal.classList.add('spinning');
            if (sealAnimFrame) cancelAnimationFrame(sealAnimFrame);
            sealLastAngle = getAngleFromCenter(cx, cy);
            sealVelocity  = 0;
        }
        function moveSealSpin(cx, cy) {
            if (!sealSpinning) return;
            const newAngle = getAngleFromCenter(cx, cy);
            let delta = newAngle - sealLastAngle;
            if (delta > Math.PI)  delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;
            sealAngle    += delta;
            sealVelocity  = delta;
            sealLastAngle = newAngle;
            const si = waxSeal.querySelector('.seal-inner');
            if (si) si.style.transform = `rotate(${sealAngle}rad)`;
            waxSeal.classList.toggle('fast-spin', Math.abs(sealVelocity) > 0.1);
        }
        function endSealSpin() {
            if (!sealSpinning) return;
            sealSpinning = false;
            waxSeal.classList.remove('spinning');
            if (Math.abs(sealVelocity) > 0.01) sealMomentum();
        }
        function sealMomentum() {
            function step() {
                if (sealSpinning) return;
                sealVelocity *= 0.97;
                sealAngle    += sealVelocity;
                const si = waxSeal.querySelector('.seal-inner');
                if (si) si.style.transform = `rotate(${sealAngle}rad)`;
                waxSeal.classList.toggle('fast-spin', Math.abs(sealVelocity) > 0.05);
                if (Math.abs(sealVelocity) > 0.002) {
                    sealAnimFrame = requestAnimationFrame(step);
                } else {
                    waxSeal.classList.remove('fast-spin');
                }
            }
            sealAnimFrame = requestAnimationFrame(step);
        }
        waxSeal.addEventListener('mousedown', (e) => { e.preventDefault(); e.stopPropagation(); startSealSpin(e.clientX, e.clientY); });
        document.addEventListener('mousemove', (e) => moveSealSpin(e.clientX, e.clientY));
        document.addEventListener('mouseup', endSealSpin);
        waxSeal.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation();
            startSealSpin(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (sealSpinning) moveSealSpin(e.touches[0].clientX, e.touches[0].clientY);
        });
        document.addEventListener('touchend', () => { if (sealSpinning) endSealSpin(); });
    }

    // ---- SPARKLE STAR PARTICLE BURST ----
    const sparkleStar        = document.getElementById('sparkle-star');
    const particleContainer  = document.getElementById('particle-container');

    function createParticleBurst(originX, originY, count = 20) {
        const colors = [
            'rgba(229,192,123,0.9)', 'rgba(200,160,80,0.8)',
            'rgba(180,140,60,0.9)',  'rgba(255,215,0,0.7)',
            'rgba(218,165,32,0.8)'
        ];
        for (let i = 0; i < count; i++) {
            const particle  = document.createElement('div');
            particle.className = 'particle';
            const size      = Math.random() * 6 + 2;
            const angle     = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed     = Math.random() * 120 + 40;
            const dx        = Math.cos(angle) * speed;
            const dy        = Math.sin(angle) * speed;
            const duration  = Math.random() * 800 + 600;
            const color     = colors[Math.floor(Math.random() * colors.length)];
            particle.style.cssText = `left:${originX}px;top:${originY}px;width:${size}px;height:${size}px;background:${color};box-shadow:0 0 ${size*2}px ${color};`;
            particleContainer.appendChild(particle);
            const startTime = performance.now();
            function animateParticle(now) {
                const elapsed  = now - startTime;
                const progress = elapsed / duration;
                if (progress >= 1) { particle.remove(); return; }
                const ease = 1 - Math.pow(1 - progress, 3);
                const x = originX + dx * ease;
                const y = originY + dy * ease + 30 * progress * progress;
                particle.style.transform = `translate(${x - originX}px,${y - originY}px) scale(${1 - progress * 0.5})`;
                particle.style.opacity   = 1 - progress;
                requestAnimationFrame(animateParticle);
            }
            requestAnimationFrame(animateParticle);
        }
    }

    sparkleStar.addEventListener('click', (e) => {
        const rect = sparkleStar.getBoundingClientRect();
        sparkleStar.classList.remove('burst');
        void sparkleStar.offsetWidth;
        sparkleStar.classList.add('burst');
        createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 24);
        setTimeout(() => sparkleStar.classList.remove('burst'), 500);
    });

    document.querySelector('.leather-desk').addEventListener('click', (e) => {
        createParticleBurst(e.clientX, e.clientY, 6);
    });

    // =====================================================
    // window.deleteNote — geriye dönük uyumluluk
    // =====================================================
    window.deleteNote = deleteNote;
});
