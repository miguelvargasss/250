/* ══════════════════════════════════════════════════════════════
   journey.js  —  Lógica de intro animada + mapa de constelaciones
   ══════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── 1. Intro particles (floating sparks) ─────────────────── */
    const introCanvas = document.getElementById('intro-particles');
    const ictx = introCanvas.getContext('2d');
    let sparks = [];

    function resizeIntroCanvas() {
        introCanvas.width  = window.innerWidth;
        introCanvas.height = window.innerHeight;
    }
    resizeIntroCanvas();
    window.addEventListener('resize', resizeIntroCanvas);

    function createSpark() {
        return {
            x: Math.random() * introCanvas.width,
            y: Math.random() * introCanvas.height,
            r: 0.5 + Math.random() * 1.5,
            alpha: Math.random(),
            speed: 0.2 + Math.random() * 0.4,
            flicker: Math.random() * Math.PI * 2,
            color: Math.random() > 0.5 ? '#f8b4b4' : '#ffe0a3',
        };
    }

    for (let i = 0; i < 120; i++) sparks.push(createSpark());

    function drawSparks() {
        ictx.clearRect(0, 0, introCanvas.width, introCanvas.height);
        sparks.forEach(s => {
            s.flicker += 0.04;
            s.y -= s.speed;
            if (s.y < 0) { s.y = introCanvas.height; s.x = Math.random() * introCanvas.width; }
            const a = (0.4 + 0.6 * Math.abs(Math.sin(s.flicker)));
            ictx.beginPath();
            ictx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
            ictx.fillStyle = s.color;
            ictx.globalAlpha = a;
            ictx.fill();
        });
        ictx.globalAlpha = 1;
    }

    let introRAF;
    function introLoop() {
        drawSparks();
        introRAF = requestAnimationFrame(introLoop);
    }
    introLoop();

    /* ── 2. Progress bar animation ────────────────────────────── */
    const introBar = document.getElementById('introBar');
    let barPct = 0;
    const barInterval = setInterval(() => {
        barPct += 1.1;
        introBar.style.width = Math.min(barPct, 100) + '%';
        if (barPct >= 100) clearInterval(barInterval);
    }, 30);

    /* ── 3. Hide intro → show journey ────────────────────────── */
    const introOverlay  = document.getElementById('intro-overlay');
    const journeyPage   = document.getElementById('journey-page');

    setTimeout(() => {
        introOverlay.classList.add('fade-out');
        introOverlay.addEventListener('animationend', () => {
            introOverlay.style.display = 'none';
            cancelAnimationFrame(introRAF);
            journeyPage.classList.remove('hidden');
            initConstellation();
        }, { once: true });
    }, 4000);

    /* ══════════════════════════════════════════════════════════
       4. CONSTELLATION MAP
       ══════════════════════════════════════════════════════════ */
    function initConstellation() {
        const canvas  = document.getElementById('sky');
        const ctx     = canvas.getContext('2d');
        const tooltip = document.getElementById('starTooltip');
        const total   = reasonsList.length;

        let W, H, stars = [], bgStars = [], discoveredSet = new Set();
        let hoveredStar = null;
        let animFrame;

        /* ── Resize ─────────────────────────────────────────── */
        function resize() {
            W = canvas.width  = window.innerWidth;
            H = canvas.height = window.innerHeight;
            buildStars();
        }

        /* ── Build background twinkle stars ─────────────────── */
        function buildBgStars() {
            bgStars = [];
            const count = Math.floor((W * H) / 4000);
            for (let i = 0; i < count; i++) {
                bgStars.push({
                    x: Math.random() * W,
                    y: Math.random() * H,
                    r: 0.3 + Math.random() * 0.9,
                    alpha: 0.2 + Math.random() * 0.6,
                    phase: Math.random() * Math.PI * 2,
                    speed: 0.005 + Math.random() * 0.015,
                });
            }
        }

        /* ── Build reason stars (constellation nodes) ───────── */
        function buildStars() {
            buildBgStars();
            stars = [];

            // We create clusters that look like named constellations
            const MARGIN = { top: 80, bottom: 60, left: 40, right: 40 };
            const areaW = W - MARGIN.left - MARGIN.right;
            const areaH = H - MARGIN.top  - MARGIN.bottom;

            // Poisson-disk-lite: place stars with minimum distance
            const minDist = Math.min(W, H) * 0.07;
            const attempts = 60;
            const placed = [];

            for (let i = 0; i < total; i++) {
                let ok = false;
                for (let a = 0; a < attempts; a++) {
                    const cx = MARGIN.left + Math.random() * areaW;
                    const cy = MARGIN.top  + Math.random() * areaH;
                    let valid = true;
                    for (const p of placed) {
                        const dx = p.x - cx, dy = p.y - cy;
                        if (Math.sqrt(dx*dx + dy*dy) < minDist) { valid = false; break; }
                    }
                    if (valid) {
                        placed.push({ x: cx, y: cy });
                        ok = true;
                        break;
                    }
                }
                if (!ok) {
                    // fallback: just place it
                    placed.push({
                        x: MARGIN.left + Math.random() * areaW,
                        y: MARGIN.top  + Math.random() * areaH,
                    });
                }

                const pos = placed[i];
                // size: undiscovered = small, discovered = glowing
                stars.push({
                    index: i,
                    x: pos.x,
                    y: pos.y,
                    baseR: 3.5 + Math.random() * 2.5,
                    phase: Math.random() * Math.PI * 2,
                    twinkleSpeed: 0.02 + Math.random() * 0.03,
                    discovered: false,
                    pulsePhase: 0,
                });
            }

            // Build constellation lines (connect nearby stars for aesthetics)
            buildLines();
        }

        /* ── Constellation lines ────────────────────────────── */
        let lines = [];
        function buildLines() {
            lines = [];
            // Connect each star to 1–2 of its closest neighbours
            for (let i = 0; i < stars.length; i++) {
                const dists = stars
                    .filter((_, j) => j !== i)
                    .map(s => ({ s, d: dist(stars[i], s) }))
                    .sort((a, b) => a.d - b.d);
                const nearest = dists.slice(0, 2);
                nearest.forEach(n => {
                    // Avoid duplicate lines
                    const key = [Math.min(stars[i].index, n.s.index), Math.max(stars[i].index, n.s.index)].join('-');
                    if (!lines.find(l => l.key === key)) {
                        lines.push({ key, a: stars[i], b: n.s });
                    }
                });
            }
        }

        function dist(a, b) {
            const dx = a.x - b.x, dy = a.y - b.y;
            return Math.sqrt(dx*dx + dy*dy);
        }

        /* ── Draw loop ──────────────────────────────────────── */
        function draw(ts) {
            ctx.clearRect(0, 0, W, H);

            // Deep space gradient background
            const grad = ctx.createRadialGradient(W/2, H*0.4, 0, W/2, H/2, Math.max(W,H)*0.8);
            grad.addColorStop(0, '#120820');
            grad.addColorStop(0.5, '#0b0d18');
            grad.addColorStop(1, '#07080f');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, W, H);

            // Background twinkle stars
            bgStars.forEach(s => {
                s.phase += s.speed;
                const a = s.alpha * (0.6 + 0.4 * Math.sin(s.phase));
                ctx.beginPath();
                ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${a})`;
                ctx.fill();
            });

            // Constellation lines
            lines.forEach(l => {
                const aDisc = l.a.discovered, bDisc = l.b.discovered;
                const alpha = (aDisc && bDisc) ? 0.35 : 0.07;
                const color  = (aDisc && bDisc) ? `rgba(248,180,180,${alpha})` : `rgba(180,180,220,${alpha})`;
                ctx.beginPath();
                ctx.moveTo(l.a.x, l.a.y);
                ctx.lineTo(l.b.x, l.b.y);
                ctx.strokeStyle = color;
                ctx.lineWidth = (aDisc && bDisc) ? 0.8 : 0.4;
                ctx.stroke();
            });

            // Reason stars
            stars.forEach(s => {
                s.phase += s.twinkleSpeed;
                const twinkle = 0.75 + 0.25 * Math.sin(s.phase);
                const isHovered = hoveredStar === s;

                if (s.discovered) {
                    // Glowing discovered star
                    const r = s.baseR * twinkle * (isHovered ? 1.4 : 1);
                    // Outer glow
                    const glow = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 5);
                    glow.addColorStop(0, 'rgba(248,180,180,0.5)');
                    glow.addColorStop(0.4, 'rgba(230,125,141,0.15)');
                    glow.addColorStop(1, 'rgba(230,125,141,0)');
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, r * 5, 0, Math.PI * 2);
                    ctx.fillStyle = glow;
                    ctx.fill();
                    // Core
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = '#fff5f7';
                    ctx.fill();
                    // Cross sparkle
                    drawCross(s.x, s.y, r * 3.5, `rgba(248,180,180,${0.6 * twinkle})`);
                } else {
                    // Undiscovered: small dim star
                    const isStart = (s.index === 0);
                    const r = (s.baseR * (isStart ? 1 : 0.55)) * twinkle * (isHovered ? 1.6 : 1);
                    const alpha = (isHovered || isStart) ? 0.9 : (0.35 + 0.25 * Math.sin(s.phase));
                    
                    ctx.beginPath();
                    ctx.arc(s.x, s.y, r, 0, Math.PI * 2);
                    ctx.fillStyle = isStart ? `rgba(248,180,180,${alpha})` : `rgba(200,200,255,${alpha})`;
                    ctx.fill();
                    
                    if (isHovered || isStart) {
                        // Pulse ring on hover or if it's the start node
                        const pulseScale = isStart ? 3.5 + Math.sin(ts / 200) * 0.5 : 3;
                        ctx.beginPath();
                        ctx.arc(s.x, s.y, r * pulseScale, 0, Math.PI * 2);
                        ctx.strokeStyle = isStart ? 'rgba(248,180,180,0.7)' : 'rgba(248,180,180,0.35)';
                        ctx.lineWidth = isStart ? 1.5 : 1;
                        ctx.stroke();
                        
                        if (isStart) {
                            ctx.fillStyle = 'rgba(248,180,180,0.9)';
                            ctx.font = '700 10px Inter';
                            ctx.fillText('INICIO', s.x + 12, s.y + 4);
                        }
                    }
                }
            });

            animFrame = requestAnimationFrame(draw);
        }

        function drawCross(x, y, size, color) {
            ctx.save();
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(x - size, y); ctx.lineTo(x + size, y);
            ctx.moveTo(x, y - size); ctx.lineTo(x, y + size);
            ctx.stroke();
            ctx.restore();
        }

        /* ── Hit test ───────────────────────────────────────── */
        function getHitRadius(s) {
            const base = Math.max(18, s.baseR * 4);
            return isTouchDevice() ? base * 1.8 : base;
        }

        function isTouchDevice() {
            return 'ontouchstart' in window;
        }

        function findStar(x, y) {
            let best = null, bestD = Infinity;
            stars.forEach(s => {
                const d = dist({ x, y }, s);
                if (d < getHitRadius(s) && d < bestD) { bestD = d; best = s; }
            });
            return best;
        }

        /* ── Pointer events ─────────────────────────────────── */
        function getPos(e) {
            if (e.touches) {
                return { x: e.touches[0].clientX, y: e.touches[0].clientY };
            }
            return { x: e.clientX, y: e.clientY };
        }

        canvas.addEventListener('mousemove', e => {
            const { x, y } = getPos(e);
            const s = findStar(x, y);
            hoveredStar = s;
            if (s) {
                canvas.style.cursor = 'pointer';
                const num = String(s.index + 1).padStart(3, '0');
                tooltip.textContent = s.discovered ? `★ RAZÓN ${num}` : `✦ RAZÓN ${num}`;
                const tt = tooltip.getBoundingClientRect();
                tooltip.style.left = Math.min(x + 14, W - tt.width - 10) + 'px';
                tooltip.style.top  = (y - 36) + 'px';
                tooltip.classList.add('visible');
            } else {
                canvas.style.cursor = 'crosshair';
                tooltip.classList.remove('visible');
            }
        });

        canvas.addEventListener('mouseleave', () => {
            hoveredStar = null;
            tooltip.classList.remove('visible');
        });

        canvas.addEventListener('click', e => {
            const { x, y } = getPos(e);
            openStar(findStar(x, y), x, y);
        });

        canvas.addEventListener('touchstart', e => {
            const { x, y } = getPos(e);
            const s = findStar(x, y);
            if (s) { e.preventDefault(); openStar(s, x, y); }
        }, { passive: false });

        /* ── Open a star (show modal) ────────────────────────── */
        let lastOpenedIndex = null;

        function openStar(s, cx, cy) {
            if (!s) return;
            s.discovered = true;
            discoveredSet.add(s.index);
            lastOpenedIndex = s.index;
            updateHeartProgress();

            // Confetti burst from click point
            spawnJourneyConfetti(cx, cy);

            // Populate modal
            document.getElementById('modalNumber').textContent = `RAZÓN ${String(s.index + 1).padStart(3, '0')}`;
            document.getElementById('modalText').textContent   = `"${reasonsList[s.index]}"`;
            document.getElementById('modal-overlay').classList.remove('modal-hidden');
        }

        /* ── Modal close ────────────────────────────────────── */
        document.getElementById('modalClose').addEventListener('click', closeModal);
        document.getElementById('modal-overlay').addEventListener('click', e => {
            if (e.target === document.getElementById('modal-overlay')) closeModal();
        });

        function closeModal() {
            document.getElementById('modal-overlay').classList.add('modal-hidden');
        }

        /* ── Modal "Siguiente estrella" ──────────────────────── */
        document.getElementById('modalNextBtn').addEventListener('click', () => {
            // Find next undiscovered star
            let next = null;
            for (let i = 1; i <= total; i++) {
                const idx = (lastOpenedIndex + i) % total;
                if (!discoveredSet.has(idx)) { next = stars[idx]; break; }
            }
            closeModal();
            if (next) {
                // Scroll/animate to it then open it after a beat
                setTimeout(() => {
                    spawnJourneyConfetti(next.x, next.y);
                    openStar(next, next.x, next.y);
                }, 300);
            } else {
                // All discovered!
                setTimeout(() => showAllDiscovered(), 350);
            }
        });

        /* ── Progress heart fill ────────────────────────────── */
        function updateHeartProgress() {
            const pct = discoveredSet.size / total;
            const fillY = 90 - pct * 90; // SVG fill rect moves up
            document.getElementById('heartFill').setAttribute('y', fillY);
            document.getElementById('progressCount').textContent = `${discoveredSet.size} / ${total}`;
        }

        /* ── All discovered celebration ─────────────────────── */
        function showAllDiscovered() {
            // Update the count dynamically in case the number of reasons changes
            document.getElementById('endReasonCount').textContent = reasonsList.length;

            for (let i = 0; i < 8; i++) {
                setTimeout(() => {
                    spawnJourneyConfetti(
                        W * 0.2 + Math.random() * W * 0.6,
                        H * 0.2 + Math.random() * H * 0.6
                    );
                }, i * 200);
            }

            // Show the end message after the first wave of confetti
            setTimeout(() => {
                document.getElementById('end-overlay').classList.remove('end-hidden');
            }, 1000);
        }

        /* ── Confetti system ─────────────────────────────────── */
        const HEARTS_CF = ['♥', '♡', '❤', '💕', '💖', '✨', '★'];
        const COLORS_CF = ['#f8b4b4', '#e67d8d', '#ff8fab', '#ffb3c6', '#ffe0a3', '#ff4d6d'];

        function spawnJourneyConfetti(cx, cy) {
            const count = 16;
            for (let i = 0; i < count; i++) {
                const el = document.createElement('span');
                el.className = 'heart-particle';
                el.textContent = HEARTS_CF[Math.floor(Math.random() * HEARTS_CF.length)];
                el.style.color = COLORS_CF[Math.floor(Math.random() * COLORS_CF.length)];
                el.style.left  = cx + 'px';
                el.style.top   = cy + 'px';

                const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.9;
                const speed  = 70 + Math.random() * 110;
                const vx     = Math.cos(angle) * speed;
                const vy     = Math.sin(angle) * speed - 55;
                const size   = 0.7 + Math.random() * 1.3;
                const spin   = (Math.random() - 0.5) * 700;
                const dur    = 900 + Math.random() * 500;

                el.style.fontSize = size + 'rem';
                document.body.appendChild(el);

                const start = performance.now();
                const grav  = 160;

                (function anim(now) {
                    const t  = (now - start) / 1000;
                    const p  = t / (dur / 1000);
                    if (p >= 1) { el.remove(); return; }
                    el.style.left      = (cx + vx * t) + 'px';
                    el.style.top       = (cy + vy * t + 0.5 * grav * t * t) + 'px';
                    el.style.opacity   = 1 - p;
                    el.style.transform = `translate(-50%,-50%) rotate(${spin * t}deg) scale(${1 - p * 0.4})`;
                    requestAnimationFrame(anim);
                })(start);
            }
        }

        /* ── Keyboard: Escape closes modal ───────────────────── */
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeModal();
        });

        /* ── Start ──────────────────────────────────────────── */
        resize();
        window.addEventListener('resize', () => { resize(); });
        requestAnimationFrame(draw);
    }

})();
