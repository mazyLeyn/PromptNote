document.addEventListener('DOMContentLoaded', () => {
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    const notesGrid = document.getElementById('notes-grid');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileOverlay = document.getElementById('mobile-overlay');

    // Mobil tespiti - ağır animasyonları kapat
    const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent)
        || window.innerWidth <= 900;

    // ==========================================
    // Mobile Sidebar Toggle
    // ==========================================
    function toggleSidebar() {
        sidebar.classList.toggle('open');
        mobileOverlay.classList.toggle('active');
    }

    sidebarToggle.addEventListener('click', toggleSidebar);
    mobileOverlay.addEventListener('click', toggleSidebar);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar.classList.contains('open')) toggleSidebar();
    });

    // ==========================================
    // Auto-resize textarea
    // ==========================================
    noteInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = this.scrollHeight + 'px';
    });

    noteInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim()) noteForm.dispatchEvent(new Event('submit'));
        }
    });

    // ==========================================
    // Notes Data (LocalStorage)
    // ==========================================
    let notes = JSON.parse(localStorage.getItem('promptNotes')) || [];

    function saveNotes() {
        localStorage.setItem('promptNotes', JSON.stringify(notes));
    }

    function formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    // ==========================================
    // Render Notes (DocumentFragment ile)
    // ==========================================
    const trashSVG = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="3 6 5 6 21 6"></polyline>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        <line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>`;

    function renderNotes() {
        const fragment = document.createDocumentFragment();
        notesGrid.innerHTML = '';

        if (notes.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-state';
            emptyEl.innerHTML = 'Henüz not eklenmemiş.<br>İlk notunu yukarıdan ekleyebilirsin!';
            notesGrid.appendChild(emptyEl);
            return;
        }

        const sorted = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        sorted.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.dataset.id = note.id;
            card.innerHTML = `
                <div class="note-content">${escapeHTML(note.content)}</div>
                <div class="note-footer">
                    <span class="note-date">${formatDate(note.createdAt)}</span>
                    <button class="delete-btn" aria-label="Notu Sil" data-id="${note.id}">${trashSVG}</button>
                </div>`;
            fragment.appendChild(card);
        });
        notesGrid.appendChild(fragment);
    }

    // Event delegation - her kart için ayrı listener yok
    notesGrid.addEventListener('click', (e) => {
        const btn = e.target.closest('.delete-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        const card = notesGrid.querySelector(`.note-card[data-id="${id}"]`);
        if (card) {
            card.classList.add('deleting');
            setTimeout(() => {
                notes = notes.filter(n => n.id !== id);
                saveNotes();
                renderNotes();
            }, 280);
        }
    });

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, t =>
            ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[t])
        );
    }

    // ==========================================
    // Add New Note
    // ==========================================
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = noteInput.value.trim();
        if (!content) return;

        notes.unshift({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2),
            content,
            createdAt: new Date().toISOString()
        });
        saveNotes();
        noteInput.value = '';
        noteInput.style.height = 'auto';
        renderNotes();

        // Wax seal bounce
        const seal = document.querySelector('.wax-seal');
        if (seal) {
            seal.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            seal.style.transform = 'translate(-50%, 50%) scale(1.25) rotate(15deg)';
            setTimeout(() => { seal.style.transform = 'translate(-50%, 50%) scale(1) rotate(0deg)'; }, 400);
        }
    });

    renderNotes();

    // ==========================================
    // Service Worker Registration (PWA)
    // ==========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(() => { });
        });
    }

    // ==========================================
    // INTERACTIVE FIDGET TOYS
    // Mobilde canvas & particle kapalı, sadece wax seal + sparkle aktif
    // ==========================================

    // ---- INK TRAIL CANVAS ----
    const inkCanvas = document.getElementById('ink-canvas');
    const inkCtx = inkCanvas ? inkCanvas.getContext('2d') : null;
    let inkTrails = [];
    let inkRafId = null;
    let inkDirty = false;

    if (inkCanvas && !isMobile) {
        function resizeCanvas() {
            inkCanvas.width = window.innerWidth;
            inkCanvas.height = window.innerHeight;
        }
        resizeCanvas();

        // Resize debounce
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(resizeCanvas, 200);
        });

        function drawInkTrails() {
            inkRafId = null;
            inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
            let hasLive = false;

            for (let t = inkTrails.length - 1; t >= 0; t--) {
                const trail = inkTrails[t];
                let allDead = true;

                for (let i = 0; i < trail.points.length; i++) {
                    trail.points[i].age += 0.005;
                    if (trail.points[i].age < 1) allDead = false;
                }

                if (allDead) { inkTrails.splice(t, 1); continue; }
                hasLive = true;

                inkCtx.beginPath();
                inkCtx.strokeStyle = 'rgba(200,160,80,0.6)';
                inkCtx.lineWidth = trail.width;
                inkCtx.lineCap = 'round';
                inkCtx.lineJoin = 'round';

                for (let i = 1; i < trail.points.length; i++) {
                    const p0 = trail.points[i - 1];
                    const p1 = trail.points[i];
                    const alpha = Math.max(0, 1 - Math.max(p0.age, p1.age));
                    if (alpha <= 0) continue;
                    inkCtx.globalAlpha = alpha * 0.7;
                    inkCtx.moveTo(p0.x, p0.y);
                    inkCtx.lineTo(p1.x, p1.y);
                }
                inkCtx.stroke();
                inkCtx.globalAlpha = 1;
            }

            if (hasLive) inkRafId = requestAnimationFrame(drawInkTrails);
            else inkDirty = false;
        }

        function scheduleInkDraw() {
            if (!inkRafId) inkRafId = requestAnimationFrame(drawInkTrails);
        }

        // ---- DRAGGABLE FOUNTAIN PEN ----
        const pen = document.getElementById('fidget-pen');
        let penDragging = false;
        let penOffsetX, penOffsetY;
        let currentTrail = null;
        let penVelX = 0, penVelY = 0;
        let lastPenX = 0, lastPenY = 0;
        let penAnimFrame = null;

        setTimeout(() => pen.classList.add('idle-wobble'), 2000);

        function getPenTipPosition() {
            const rect = pen.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const angle = -35 * Math.PI / 180;
            const oy = rect.height / 2;
            return {
                x: cx - oy * Math.sin(angle),
                y: cy + oy * Math.cos(angle)
            };
        }

        function startPenDrag(clientX, clientY) {
            penDragging = true;
            pen.classList.remove('idle-wobble');
            pen.classList.add('dragging');
            if (penAnimFrame) { cancelAnimationFrame(penAnimFrame); penAnimFrame = null; }

            const rect = pen.getBoundingClientRect();
            penOffsetX = clientX - rect.left;
            penOffsetY = clientY - rect.top;
            lastPenX = clientX; lastPenY = clientY;
            penVelX = 0; penVelY = 0;

            currentTrail = { points: [], width: 2.5 };
            inkTrails.push(currentTrail);
            const tip = getPenTipPosition();
            currentTrail.points.push({ x: tip.x, y: tip.y, age: 0 });
            scheduleInkDraw();
        }

        function movePen(clientX, clientY) {
            if (!penDragging) return;
            penVelX = clientX - lastPenX;
            penVelY = clientY - lastPenY;
            lastPenX = clientX; lastPenY = clientY;

            pen.style.left = (clientX - penOffsetX) + 'px';
            pen.style.top = (clientY - penOffsetY) + 'px';
            pen.style.right = 'auto';
            pen.style.bottom = 'auto';
            pen.style.transform = 'rotate(-35deg)';

            if (currentTrail) {
                const tip = getPenTipPosition();
                const last = currentTrail.points[currentTrail.points.length - 1];
                const dist = Math.hypot(tip.x - last.x, tip.y - last.y);
                if (dist > 4) {
                    currentTrail.points.push({ x: tip.x, y: tip.y, age: 0 });
                    if (currentTrail.points.length > 300) currentTrail.points.shift();
                }
            }
        }

        function endPenDrag() {
            if (!penDragging) return;
            penDragging = false;
            pen.classList.remove('dragging');
            currentTrail = null;

            if (Math.abs(penVelX) > 2 || Math.abs(penVelY) > 2) {
                applyPenMomentum();
            } else {
                setTimeout(() => { if (!penDragging) pen.classList.add('idle-wobble'); }, 1500);
            }
        }

        function applyPenMomentum() {
            const friction = 0.92;
            function step() {
                if (penDragging) return;
                penVelX *= friction; penVelY *= friction;
                pen.style.left = (parseFloat(pen.style.left) + penVelX) + 'px';
                pen.style.top = (parseFloat(pen.style.top) + penVelY) + 'px';
                if (Math.abs(penVelX) > 0.3 || Math.abs(penVelY) > 0.3) {
                    penAnimFrame = requestAnimationFrame(step);
                } else {
                    setTimeout(() => { if (!penDragging) pen.classList.add('idle-wobble'); }, 1000);
                }
            }
            penAnimFrame = requestAnimationFrame(step);
        }

        pen.addEventListener('mousedown', (e) => { e.preventDefault(); startPenDrag(e.clientX, e.clientY); });
        pen.addEventListener('dblclick', () => {
            inkTrails = [];
            inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
        });

        // Tek global mousemove & mouseup listener
        document.addEventListener('mousemove', (e) => {
            if (penDragging) movePen(e.clientX, e.clientY);
        });
        document.addEventListener('mouseup', () => { if (penDragging) endPenDrag(); });

        pen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            startPenDrag(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (penDragging) { e.preventDefault(); movePen(e.touches[0].clientX, e.touches[0].clientY); }
        }, { passive: false });

        document.addEventListener('touchend', () => { if (penDragging) endPenDrag(); });
    } else if (inkCanvas) {
        // Mobilde canvas'ı tamamen gizle
        inkCanvas.style.display = 'none';
        const pen = document.getElementById('fidget-pen');
        if (pen) pen.style.display = 'none';
    }

    // ---- SPINNABLE WAX SEAL ----
    const waxSeal = document.querySelector('.wax-seal');
    if (waxSeal) {
        waxSeal.classList.add('interactive');
        const glowEl = document.createElement('div');
        glowEl.className = 'seal-glow';
        waxSeal.appendChild(glowEl);

        let sealSpinning = false;
        let sealAngle = 0;
        let sealVelocity = 0;
        let sealLastAngle = 0;
        let sealAnimFrame = null;
        const sealInner = waxSeal.querySelector('.seal-inner');

        function getSealCenter() {
            const rect = waxSeal.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
        }

        function getAngle(cx, cy) {
            const c = getSealCenter();
            return Math.atan2(cy - c.y, cx - c.x);
        }

        function startSealSpin(cx, cy) {
            sealSpinning = true;
            waxSeal.classList.add('spinning');
            if (sealAnimFrame) { cancelAnimationFrame(sealAnimFrame); sealAnimFrame = null; }
            sealLastAngle = getAngle(cx, cy);
            sealVelocity = 0;
        }

        function moveSealSpin(cx, cy) {
            if (!sealSpinning) return;
            let delta = getAngle(cx, cy) - sealLastAngle;
            if (delta > Math.PI) delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;
            sealAngle += delta;
            sealVelocity = delta;
            sealLastAngle = getAngle(cx, cy);
            if (sealInner) sealInner.style.transform = `rotate(${sealAngle}rad)`;
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
                sealAngle += sealVelocity;
                if (sealInner) sealInner.style.transform = `rotate(${sealAngle}rad)`;
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
        waxSeal.addEventListener('touchstart', (e) => {
            e.preventDefault(); e.stopPropagation();
            startSealSpin(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: false });

        document.addEventListener('mousemove', (e) => { if (sealSpinning) moveSealSpin(e.clientX, e.clientY); });
        document.addEventListener('mouseup', () => { if (sealSpinning) endSealSpin(); });
        document.addEventListener('touchmove', (e) => {
            if (sealSpinning) moveSealSpin(e.touches[0].clientX, e.touches[0].clientY);
        }, { passive: true });
        document.addEventListener('touchend', () => { if (sealSpinning) endSealSpin(); });
    }

    // ---- SPARKLE STAR PARTICLE BURST ----
    const sparkleStar = document.getElementById('sparkle-star');
    const particleContainer = document.getElementById('particle-container');

    // Mobilde daha az parçacık
    const MAX_PARTICLES = isMobile ? 8 : 20;

    function createParticleBurst(originX, originY, count = MAX_PARTICLES) {
        const colors = ['rgba(229,192,123,0.9)', 'rgba(200,160,80,0.8)', 'rgba(255,215,0,0.7)', 'rgba(218,165,32,0.8)'];

        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            const size = Math.random() * 5 + 2;
            const angle = (Math.PI * 2 * i) / count;
            const speed = Math.random() * 100 + 40;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            const duration = Math.random() * 700 + 500;
            const color = colors[i % colors.length];

            particle.style.cssText = `left:${originX}px;top:${originY}px;width:${size}px;height:${size}px;background:${color};`;
            particleContainer.appendChild(particle);

            const startTime = performance.now();
            function animateParticle(now) {
                const p = (now - startTime) / duration;
                if (p >= 1) { particle.remove(); return; }
                const ep = 1 - Math.pow(1 - p, 3);
                particle.style.transform = `translate(${dx * ep}px,${dy * ep + 25 * p * p}px) scale(${1 - p * 0.5})`;
                particle.style.opacity = 1 - p;
                requestAnimationFrame(animateParticle);
            }
            requestAnimationFrame(animateParticle);
        }
    }

    if (sparkleStar) {
        sparkleStar.addEventListener('click', (e) => {
            const rect = sparkleStar.getBoundingClientRect();
            sparkleStar.classList.remove('burst');
            void sparkleStar.offsetWidth;
            sparkleStar.classList.add('burst');
            createParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, isMobile ? 12 : 24);
            setTimeout(() => sparkleStar.classList.remove('burst'), 500);
        });
    }

    // Masaya tıklama - mobilde devre dışı (performans)
    if (!isMobile) {
        document.querySelector('.leather-desk')?.addEventListener('click', (e) => {
            createParticleBurst(e.clientX, e.clientY, 5);
        });
    }

    // Fidget hint - prefers-reduced-motion'a saygı
    const hint = document.getElementById('fidget-hint');
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (hint && prefersReduced) hint.style.display = 'none';
});
