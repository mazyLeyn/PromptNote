document.addEventListener('DOMContentLoaded', () => {
    const noteForm = document.getElementById('note-form');
    const noteInput = document.getElementById('note-input');
    const notesGrid = document.getElementById('notes-grid');
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileOverlay = document.getElementById('mobile-overlay');

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
        if (e.key === 'Escape' && sidebar.classList.contains('open')) {
            toggleSidebar();
        }
    });

    // ==========================================
    // Auto-resize textarea
    // ==========================================
    noteInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    noteInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (this.value.trim() !== '') {
                noteForm.dispatchEvent(new Event('submit'));
            }
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
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('tr-TR', options);
    }

    // ==========================================
    // Render Notes
    // ==========================================
    function renderNotes() {
        notesGrid.innerHTML = '';

        if (notes.length === 0) {
            const emptyEl = document.createElement('div');
            emptyEl.className = 'empty-state';
            emptyEl.innerHTML = 'Henüz not eklenmemiş.<br>İlk notunu yukarıdan ekleyebilirsin!';
            notesGrid.appendChild(emptyEl);
            return;
        }

        const sortedNotes = [...notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        sortedNotes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'note-card';
            card.dataset.id = note.id;

            card.innerHTML = `
                <div class="note-content">${escapeHTML(note.content)}</div>
                <div class="note-footer">
                    <span class="note-date">${formatDate(note.createdAt)}</span>
                    <button class="delete-btn" aria-label="Notu Sil" onclick="deleteNote('${note.id}')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            <line x1="10" y1="11" x2="10" y2="17"></line>
                            <line x1="14" y1="11" x2="14" y2="17"></line>
                        </svg>
                    </button>
                </div>
            `;
            notesGrid.appendChild(card);
        });
    }

    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag])
        );
    }

    // ==========================================
    // Add New Note
    // ==========================================
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const content = noteInput.value.trim();
        if (!content) return;

        const newNote = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            content: content,
            createdAt: new Date().toISOString()
        };

        notes.unshift(newNote);
        saveNotes();
        
        noteInput.value = '';
        noteInput.style.height = 'auto';
        
        renderNotes();

        // Wax seal bounce on submit
        const seal = document.querySelector('.wax-seal');
        if (seal) {
            seal.style.transition = 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)';
            seal.style.transform = 'translate(-50%, 50%) scale(1.25) rotate(15deg)';
            setTimeout(() => {
                seal.style.transform = 'translate(-50%, 50%) scale(1) rotate(0deg)';
            }, 400);
        }
    });

    // ==========================================
    // Delete Note
    // ==========================================
    window.deleteNote = function(id) {
        const card = document.querySelector(`.note-card[data-id="${id}"]`);
        if (card) {
            card.classList.add('deleting');
            setTimeout(() => {
                notes = notes.filter(n => n.id !== id);
                saveNotes();
                renderNotes();
            }, 300);
        }
    };

    // ==========================================
    // Initial Render
    // ==========================================
    renderNotes();

    // ==========================================
    // Service Worker Registration (PWA)
    // ==========================================
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js')
                .catch(err => console.log('SW registration failed:', err));
        });
    }

    // ==========================================
    //  INTERACTIVE FIDGET TOYS
    // ==========================================

    // ---- INK TRAIL CANVAS ----
    const inkCanvas = document.getElementById('ink-canvas');
    const inkCtx = inkCanvas.getContext('2d');
    let inkTrails = []; // {points: [{x,y,age}], color, width}

    function resizeCanvas() {
        inkCanvas.width = window.innerWidth;
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

            if (allDead) {
                inkTrails.splice(t, 1);
                continue;
            }

            // Draw trail segments
            for (let i = 1; i < trail.points.length; i++) {
                const p0 = trail.points[i - 1];
                const p1 = trail.points[i];
                const alpha = Math.max(0, 1 - Math.max(p0.age, p1.age));
                
                if (alpha <= 0) continue;

                inkCtx.beginPath();
                inkCtx.moveTo(p0.x, p0.y);
                inkCtx.lineTo(p1.x, p1.y);
                inkCtx.strokeStyle = `rgba(200, 160, 80, ${alpha * 0.7})`;
                inkCtx.lineWidth = trail.width * (1 - p1.age * 0.3);
                inkCtx.lineCap = 'round';
                inkCtx.lineJoin = 'round';
                inkCtx.stroke();
            }
        }

        if (inkTrails.length > 0) {
            requestAnimationFrame(drawInkTrails);
        }
    }

    // ---- DRAGGABLE FOUNTAIN PEN ----
    const pen = document.getElementById('fidget-pen');
    let penDragging = false;
    let penStartX, penStartY, penOffsetX, penOffsetY;
    let currentTrail = null;
    let penVelX = 0, penVelY = 0;
    let lastPenX = 0, lastPenY = 0;
    let penAnimFrame = null;

    // Start pen idle wobble
    setTimeout(() => pen.classList.add('idle-wobble'), 2000);

    function getPenTipPosition() {
        const rect = pen.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // The nib tip is at bottom-center in local pen space
        // Offset from center to tip: (0, totalHeight/2)
        const localOffsetX = 0;
        const localOffsetY = rect.height / 2;
        
        // Apply pen rotation (-35 degrees) to get world-space tip position
        const angle = -35 * Math.PI / 180;
        const rotatedX = localOffsetX * Math.cos(angle) - localOffsetY * Math.sin(angle);
        const rotatedY = localOffsetX * Math.sin(angle) + localOffsetY * Math.cos(angle);
        
        return {
            x: centerX + rotatedX,
            y: centerY + rotatedY
        };
    }

    function startPenDrag(clientX, clientY) {
        penDragging = true;
        pen.classList.remove('idle-wobble');
        pen.classList.add('dragging');

        const rect = pen.getBoundingClientRect();
        penOffsetX = clientX - rect.left;
        penOffsetY = clientY - rect.top;
        lastPenX = clientX;
        lastPenY = clientY;
        penVelX = 0;
        penVelY = 0;

        // Start a new ink trail
        currentTrail = { points: [], width: 2.5 };
        inkTrails.push(currentTrail);

        const tip = getPenTipPosition();
        currentTrail.points.push({ x: tip.x, y: tip.y, age: 0 });

        // Start rendering ink if not already
        requestAnimationFrame(drawInkTrails);
    }

    function movePen(clientX, clientY) {
        if (!penDragging) return;

        // Calculate velocity for momentum
        penVelX = clientX - lastPenX;
        penVelY = clientY - lastPenY;
        lastPenX = clientX;
        lastPenY = clientY;

        // Move the pen
        const x = clientX - penOffsetX;
        const y = clientY - penOffsetY;
        pen.style.position = 'fixed';
        pen.style.left = x + 'px';
        pen.style.top = y + 'px';
        pen.style.right = 'auto';
        pen.style.bottom = 'auto';
        pen.style.transform = 'rotate(-35deg)';

        // Add point to ink trail
        if (currentTrail) {
            const tip = getPenTipPosition();
            const lastPoint = currentTrail.points[currentTrail.points.length - 1];
            const dist = Math.hypot(tip.x - lastPoint.x, tip.y - lastPoint.y);
            
            if (dist > 3) {
                currentTrail.points.push({ x: tip.x, y: tip.y, age: 0 });
                // Limit trail length
                if (currentTrail.points.length > 500) {
                    currentTrail.points.shift();
                }
            }
        }
    }

    function endPenDrag() {
        if (!penDragging) return;
        penDragging = false;
        pen.classList.remove('dragging');
        currentTrail = null;

        // Apply momentum
        if (Math.abs(penVelX) > 2 || Math.abs(penVelY) > 2) {
            applyPenMomentum();
        } else {
            setTimeout(() => {
                if (!penDragging) pen.classList.add('idle-wobble');
            }, 1500);
        }
    }

    function applyPenMomentum() {
        const friction = 0.92;
        
        function step() {
            if (penDragging) return;

            penVelX *= friction;
            penVelY *= friction;

            const curLeft = parseFloat(pen.style.left) || 0;
            const curTop = parseFloat(pen.style.top) || 0;

            pen.style.left = (curLeft + penVelX) + 'px';
            pen.style.top = (curTop + penVelY) + 'px';

            if (Math.abs(penVelX) > 0.3 || Math.abs(penVelY) > 0.3) {
                penAnimFrame = requestAnimationFrame(step);
            } else {
                setTimeout(() => {
                    if (!penDragging) pen.classList.add('idle-wobble');
                }, 1000);
            }
        }
        penAnimFrame = requestAnimationFrame(step);
    }

    // Mouse events
    pen.addEventListener('mousedown', (e) => {
        e.preventDefault();
        startPenDrag(e.clientX, e.clientY);
    });
    document.addEventListener('mousemove', (e) => movePen(e.clientX, e.clientY));
    document.addEventListener('mouseup', endPenDrag);

    // Touch events
    pen.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const t = e.touches[0];
        startPenDrag(t.clientX, t.clientY);
    }, { passive: false });
    document.addEventListener('touchmove', (e) => {
        if (penDragging) {
            e.preventDefault();
            const t = e.touches[0];
            movePen(t.clientX, t.clientY);
        }
    }, { passive: false });
    document.addEventListener('touchend', (e) => {
        if (penDragging) endPenDrag();
    });

    // Double-click pen to clear all ink trails
    pen.addEventListener('dblclick', () => {
        inkTrails = [];
        inkCtx.clearRect(0, 0, inkCanvas.width, inkCanvas.height);
    });

    // ---- SPINNABLE WAX SEAL ----
    const waxSeal = document.querySelector('.wax-seal');
    if (waxSeal) {
        waxSeal.classList.add('interactive');
        
        // Add glow element
        const glowEl = document.createElement('div');
        glowEl.className = 'seal-glow';
        waxSeal.appendChild(glowEl);

        let sealSpinning = false;
        let sealAngle = 0;
        let sealVelocity = 0;
        let sealLastAngle = 0;
        let sealCenterX = 0, sealCenterY = 0;
        let sealAnimFrame = null;

        function getSealCenter() {
            const rect = waxSeal.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        }

        function getAngleFromCenter(clientX, clientY) {
            const center = getSealCenter();
            return Math.atan2(clientY - center.y, clientX - center.x);
        }

        function startSealSpin(clientX, clientY) {
            sealSpinning = true;
            waxSeal.classList.add('spinning');
            if (sealAnimFrame) cancelAnimationFrame(sealAnimFrame);
            sealLastAngle = getAngleFromCenter(clientX, clientY);
            sealVelocity = 0;
        }

        function moveSealSpin(clientX, clientY) {
            if (!sealSpinning) return;

            const newAngle = getAngleFromCenter(clientX, clientY);
            let delta = newAngle - sealLastAngle;

            // Handle angle wrapping
            if (delta > Math.PI) delta -= 2 * Math.PI;
            if (delta < -Math.PI) delta += 2 * Math.PI;

            sealAngle += delta;
            sealVelocity = delta;
            sealLastAngle = newAngle;

            const sealInner = waxSeal.querySelector('.seal-inner');
            if (sealInner) {
                sealInner.style.transform = `rotate(${sealAngle}rad)`;
            }

            // Fast spin glow effect
            if (Math.abs(sealVelocity) > 0.1) {
                waxSeal.classList.add('fast-spin');
            } else {
                waxSeal.classList.remove('fast-spin');
            }
        }

        function endSealSpin() {
            if (!sealSpinning) return;
            sealSpinning = false;
            waxSeal.classList.remove('spinning');

            // Apply momentum
            if (Math.abs(sealVelocity) > 0.01) {
                sealMomentum();
            }
        }

        function sealMomentum() {
            const friction = 0.97;

            function step() {
                if (sealSpinning) return;

                sealVelocity *= friction;
                sealAngle += sealVelocity;

                const sealInner = waxSeal.querySelector('.seal-inner');
                if (sealInner) {
                    sealInner.style.transform = `rotate(${sealAngle}rad)`;
                }

                if (Math.abs(sealVelocity) > 0.05) {
                    waxSeal.classList.add('fast-spin');
                } else {
                    waxSeal.classList.remove('fast-spin');
                }

                if (Math.abs(sealVelocity) > 0.002) {
                    sealAnimFrame = requestAnimationFrame(step);
                } else {
                    waxSeal.classList.remove('fast-spin');
                }
            }
            sealAnimFrame = requestAnimationFrame(step);
        }

        // Mouse events for seal
        waxSeal.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            startSealSpin(e.clientX, e.clientY);
        });
        document.addEventListener('mousemove', (e) => moveSealSpin(e.clientX, e.clientY));
        document.addEventListener('mouseup', endSealSpin);

        // Touch events for seal
        waxSeal.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const t = e.touches[0];
            startSealSpin(t.clientX, t.clientY);
        }, { passive: false });
        document.addEventListener('touchmove', (e) => {
            if (sealSpinning) {
                const t = e.touches[0];
                moveSealSpin(t.clientX, t.clientY);
            }
        });
        document.addEventListener('touchend', () => {
            if (sealSpinning) endSealSpin();
        });
    }

    // ---- SPARKLE STAR PARTICLE BURST ----
    const sparkleStar = document.getElementById('sparkle-star');
    const particleContainer = document.getElementById('particle-container');

    function createParticleBurst(originX, originY, count = 20) {
        for (let i = 0; i < count; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';

            const size = Math.random() * 6 + 2;
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const speed = Math.random() * 120 + 40;
            const dx = Math.cos(angle) * speed;
            const dy = Math.sin(angle) * speed;
            const duration = Math.random() * 800 + 600;

            // Random gold/amber colors
            const colors = [
                'rgba(229, 192, 123, 0.9)',
                'rgba(200, 160, 80, 0.8)',
                'rgba(180, 140, 60, 0.9)',
                'rgba(255, 215, 0, 0.7)',
                'rgba(218, 165, 32, 0.8)'
            ];
            const color = colors[Math.floor(Math.random() * colors.length)];

            particle.style.cssText = `
                left: ${originX}px;
                top: ${originY}px;
                width: ${size}px;
                height: ${size}px;
                background: ${color};
                box-shadow: 0 0 ${size * 2}px ${color};
            `;

            particleContainer.appendChild(particle);

            // Animate
            const startTime = performance.now();

            function animateParticle(now) {
                const elapsed = now - startTime;
                const progress = elapsed / duration;

                if (progress >= 1) {
                    particle.remove();
                    return;
                }

                const easedProgress = 1 - Math.pow(1 - progress, 3);
                const x = originX + dx * easedProgress;
                const y = originY + dy * easedProgress + 30 * progress * progress; // gravity
                const opacity = 1 - progress;
                const scale = 1 - progress * 0.5;

                particle.style.transform = `translate(${x - originX}px, ${y - originY}px) scale(${scale})`;
                particle.style.opacity = opacity;

                requestAnimationFrame(animateParticle);
            }

            requestAnimationFrame(animateParticle);
        }
    }

    sparkleStar.addEventListener('click', (e) => {
        const rect = sparkleStar.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;

        sparkleStar.classList.remove('burst');
        void sparkleStar.offsetWidth; // force reflow
        sparkleStar.classList.add('burst');

        createParticleBurst(cx, cy, 24);

        setTimeout(() => sparkleStar.classList.remove('burst'), 500);
    });

    // Also allow clicking anywhere on the desk to create mini sparks
    document.querySelector('.leather-desk').addEventListener('click', (e) => {
        createParticleBurst(e.clientX, e.clientY, 6);
    });
});
