
    // ----------------------------------------------------
    // Web Audio Synthesizer Class
    // ----------------------------------------------------
    class CosmicSynth {
      constructor() {
        this.ctx = null;
        this.osc1 = null;
        this.osc2 = null;
        this.filter = null;
        this.delay = null;
        this.delayFeedback = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.lfo = null;
        this.lfoGain = null;
      }
      
      init() {
        if (this.ctx) return;
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
        
        // Osc 1 - Deep pad
        this.osc1 = this.ctx.createOscillator();
        this.osc1.type = 'triangle';
        this.osc1.frequency.setValueAtTime(110, this.ctx.currentTime); // A2
        
        // Osc 2 - Harmony pad (Perfect fifth + octave)
        this.osc2 = this.ctx.createOscillator();
        this.osc2.type = 'sine';
        this.osc2.frequency.setValueAtTime(165, this.ctx.currentTime); // E3 (fifth)
        
        // Lowpass filter to keep it warm and ambient
        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.setValueAtTime(450, this.ctx.currentTime);
        this.filter.Q.setValueAtTime(4, this.ctx.currentTime);
        
        // Delay Line for space reverb
        this.delay = this.ctx.createDelay(2.0);
        this.delay.delayTime.setValueAtTime(0.65, this.ctx.currentTime);
        
        this.delayFeedback = this.ctx.createGain();
        this.delayFeedback.gain.setValueAtTime(0.45, this.ctx.currentTime);
        
        // Main volume gain
        this.gainNode = this.ctx.createGain();
        this.gainNode.gain.setValueAtTime(0, this.ctx.currentTime); // Silent initially
        
        // Connect Oscillators to Filter
        this.osc1.connect(this.filter);
        this.osc2.connect(this.filter);
        
        // Connect Filter to main volume and delay
        this.filter.connect(this.gainNode);
        this.filter.connect(this.delay);
        
        // Connect Delay loop
        this.delay.connect(this.delayFeedback);
        this.delayFeedback.connect(this.delay);
        this.delay.connect(this.gainNode);
        
        // Connect to Speakers
        this.gainNode.connect(this.ctx.destination);
        
        // Start Sound Sources
        this.osc1.start(0);
        this.osc2.start(0);
        
        // LFO to slowly sweep filter frequency (creats breathing effect)
        this.lfo = this.ctx.createOscillator();
        this.lfo.type = 'sine';
        this.lfo.frequency.setValueAtTime(0.04, this.ctx.currentTime); // Very slow cycle (25s)
        
        this.lfoGain = this.ctx.createGain();
        this.lfoGain.gain.setValueAtTime(250, this.ctx.currentTime);
        
        this.lfo.connect(this.lfoGain);
        this.lfoGain.connect(this.filter.frequency);
        this.lfo.start(0);
      }
      
      start() {
        this.init();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.gainNode.gain.linearRampToValueAtTime(0.12, this.ctx.currentTime + 3.0);
        this.isPlaying = true;
      }
      
      stop() {
        if (!this.ctx) return;
        this.gainNode.gain.linearRampToValueAtTime(0.0, this.ctx.currentTime + 1.0);
        this.isPlaying = false;
      }
      
      toggle() {
        if (this.isPlaying) {
          this.stop();
        } else {
          this.start();
        }
        return this.isPlaying;
      }

      playClick() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(600, now);
        clickOsc.frequency.exponentialRampToValueAtTime(180, now + 0.08);
        
        clickGain.gain.setValueAtTime(0.03, now);
        clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
        
        clickOsc.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        clickOsc.start(now);
        clickOsc.stop(now + 0.1);
      }

      playChime() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        const arp = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        
        arp.forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.15);
          
          gain.gain.setValueAtTime(0, now + idx * 0.15);
          gain.gain.linearRampToValueAtTime(0.08, now + idx * 0.15 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.15 + 1.2);
          
          osc.connect(gain);
          gain.connect(this.delay);
          gain.connect(this.ctx.destination);
          
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 1.5);
        });
      }
    }

    const synth = new CosmicSynth();

    // ----------------------------------------------------
    // Unified Cosmos Engine (Optimized Starfield & Effects)
    // ----------------------------------------------------
    class CosmosEngine {
      constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.stars = [];
        this.shootingStars = [];
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetMouseX = 0;
        this.targetMouseY = 0;
        this.isPaused = false;
        this.rafId = null;
        
        this.init();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('visibilitychange', () => this.onVisibilityChange());
      }
      
      onVisibilityChange() {
        if (document.hidden) {
          this.pause();
        } else {
          const modalActive = document.getElementById('modal-overlay').classList.contains('active');
          const envelopeActive = document.getElementById('envelope-modal').classList.contains('active');
          if (!modalActive && !envelopeActive) {
            this.unpause();
          }
        }
      }
      
      init() {
        this.resize();
        this.stars = [];
        const colorsRGB = [
          [255, 255, 255], // #ffffff
          [255, 247, 235], // #fff7eb
          [235, 245, 255], // #ebf5ff
          [255, 215, 0],   // #ffd700
          [255, 64, 129],  // #ff4081
          [0, 229, 255]    // #00e5ff
        ];
        
        // 120 stars is optimal for background density and performance
        for (let i = 0; i < 120; i++) {
          this.stars.push({
            x: Math.random() * this.canvas.width,
            y: Math.random() * this.canvas.height,
            size: Math.random() * 1.5 + 0.4,
            alpha: Math.random(),
            speed: Math.random() * 0.012 + 0.003,
            colorRGB: colorsRGB[Math.floor(Math.random() * colorsRGB.length)],
            parallaxFactor: Math.random() * 15 + 5
          });
        }
      }
      
      resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
      
      onMouseMove(e) {
        if (this.isPaused) return;
        this.targetMouseX = (e.clientX - window.innerWidth / 2) / 30;
        this.targetMouseY = (e.clientY - window.innerHeight / 2) / 30;
      }
      
      spawnBurst(x, y, type = 'heart', count = 18) {
        const colors = ['#ff4081', '#ff80ab', '#ffe082', '#ffd700', '#00e5ff', '#b2ff59'];
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          this.particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - (type === 'heart' ? 0.8 : 0),
            size: Math.random() * 5 + 2.5,
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015,
            color: colors[Math.floor(Math.random() * colors.length)],
            type: type,
            rotation: Math.random() * Math.PI,
            rotSpeed: Math.random() * 0.08 - 0.04
          });
        }
        
        // Force loop to execute if currently paused
        if (this.isPaused && this.rafId === null) {
          this.loop();
        }
      }
      
      addShootingStar() {
        if (this.isPaused) return;
        if (Math.random() > 0.994 && this.shootingStars.length < 2) {
          this.shootingStars.push({
            x: Math.random() * this.canvas.width * 0.8,
            y: 0,
            len: Math.random() * 60 + 30,
            speed: Math.random() * 8 + 6,
            angle: Math.PI / 4 + (Math.random() * 0.1 - 0.05),
            alpha: 1
          });
        }
      }
      
      pause() {
        this.isPaused = true;
      }
      
      unpause() {
        if (this.isPaused) {
          this.isPaused = false;
          if (this.rafId === null) {
            this.loop();
          }
        }
      }
      
      loop() {
        this.draw();
        
        // Break requestAnimationFrame loops if paused and no rendering particles exist
        if (this.isPaused && this.particles.length === 0 && this.shootingStars.length === 0) {
          this.rafId = null;
          return;
        }
        
        this.rafId = requestAnimationFrame(() => this.loop());
      }
      
      draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 1. Draw Starfield
        this.mouseX += (this.targetMouseX - this.mouseX) * 0.05;
        this.mouseY += (this.targetMouseY - this.mouseY) * 0.05;
        
        this.stars.forEach(star => {
          let sx = star.x - this.mouseX * (10 / star.parallaxFactor);
          let sy = star.y - this.mouseY * (10 / star.parallaxFactor);
          
          if (sx < 0) sx += this.canvas.width;
          if (sx > this.canvas.width) sx -= this.canvas.width;
          if (sy < 0) sy += this.canvas.height;
          if (sy > this.canvas.height) sy -= this.canvas.height;
          
          if (!this.isPaused) {
            star.alpha += star.speed;
            if (star.alpha > 1 || star.alpha < 0.1) {
              star.speed = -star.speed;
            }
          }
          
          const alpha = Math.max(0.1, Math.min(1, star.alpha));
          this.ctx.fillStyle = `rgba(${star.colorRGB[0]}, ${star.colorRGB[1]}, ${star.colorRGB[2]}, ${alpha})`;
          
          // Optimization: Draw simple rectangles instead of circles for tiny stars
          if (star.size < 1.5) {
            this.ctx.fillRect(sx - star.size/2, sy - star.size/2, star.size, star.size);
          } else {
            this.ctx.beginPath();
            this.ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
            this.ctx.fill();
          }
        });
        
        // 2. Draw Shooting Stars
        this.addShootingStar();
        this.shootingStars = this.shootingStars.filter(ss => {
          ss.x += Math.cos(ss.angle) * ss.speed;
          ss.y += Math.sin(ss.angle) * ss.speed;
          ss.alpha -= 0.025;
          
          if (ss.alpha <= 0) return false;
          
          this.ctx.strokeStyle = `rgba(255, 255, 255, ${ss.alpha})`;
          this.ctx.lineWidth = 1;
          this.ctx.globalAlpha = 1;
          this.ctx.beginPath();
          this.ctx.moveTo(ss.x, ss.y);
          this.ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.len, ss.y - Math.sin(ss.angle) * ss.len);
          this.ctx.stroke();
          
          return ss.x < this.canvas.width && ss.y < this.canvas.height;
        });
        
        // 3. Draw Burst Click Particles
        this.particles = this.particles.filter(p => {
          p.x += p.vx;
          p.y += p.vy;
          p.vy += 0.05; // gravity
          p.vx *= 0.98; // air resistance
          p.vy *= 0.98;
          p.alpha -= p.decay;
          p.rotation += p.rotSpeed;
          
          if (p.alpha <= 0) return false;
          
          this.ctx.save();
          this.ctx.globalAlpha = p.alpha;
          this.ctx.translate(p.x, p.y);
          this.ctx.rotate(p.rotation);
          this.ctx.fillStyle = p.color;
          
          if (p.type === 'heart') {
            this.ctx.beginPath();
            const size = p.size;
            this.ctx.moveTo(0, -size / 4);
            this.ctx.bezierCurveTo(-size / 2, -size, -size, -size / 2, 0, size);
            this.ctx.bezierCurveTo(size, -size / 2, size / 2, -size, 0, -size / 4);
            this.ctx.fill();
          } else {
            this.ctx.beginPath();
            const spikes = 4;
            const outer = p.size;
            const inner = p.size / 2.5;
            let rot = Math.PI / 2 * 3;
            let step = Math.PI / spikes;
            this.ctx.moveTo(0, -outer);
            for (let i = 0; i < spikes; i++) {
              let px = Math.cos(rot) * outer;
              let py = Math.sin(rot) * outer;
              this.ctx.lineTo(px, py);
              rot += step;
              px = Math.cos(rot) * inner;
              let cy = Math.sin(rot) * inner;
              this.ctx.lineTo(px, cy);
              rot += step;
            }
            this.ctx.closePath();
            this.ctx.fill();
          }
          
          this.ctx.restore();
          return true;
        });
        
        // Reset canvas alpha config
        this.ctx.globalAlpha = 1;
      }
    }

    const cosmos = new CosmosEngine(document.getElementById('cosmos-canvas'));
    cosmos.loop();

    // ----------------------------------------------------
    // Loading Screen Simulation
    // ----------------------------------------------------
    let loadProgress = 0;
    const loadPctEl = document.getElementById('load-pct');
    const loadingScreen = document.getElementById('loading-screen');
    const landingScreen = document.getElementById('landing-screen');

    const loadTimer = setInterval(() => {
      loadProgress += Math.floor(Math.random() * 8) + 4;
      if (loadProgress >= 100) {
        loadProgress = 100;
        clearInterval(loadTimer);
        
        setTimeout(() => {
          loadingScreen.style.opacity = '0';
          setTimeout(() => {
            loadingScreen.style.display = 'none';
            landingScreen.style.visibility = 'visible';
            landingScreen.style.opacity = '1';
            landingScreen.classList.add('loaded');
          }, 1000);
        }, 300);
      }
      loadPctEl.textContent = `${loadProgress}%`;
    }, 80);

    // ----------------------------------------------------
    // Sound Manager Toggle Control
    // ----------------------------------------------------
    const musicToggleBtn = document.getElementById('music-toggle');
    const musicOnIcon = document.getElementById('music-on-icon');
    const musicOffIcon = document.getElementById('music-off-icon');

    function updateAudioIcon(isPlaying) {
      if (isPlaying) {
        musicOnIcon.style.display = 'block';
        musicOffIcon.style.display = 'none';
      } else {
        musicOnIcon.style.display = 'none';
        musicOffIcon.style.display = 'block';
      }
    }

    musicToggleBtn.addEventListener('click', (e) => {
      const playing = synth.toggle();
      updateAudioIcon(playing);
      if (playing) {
        cosmos.spawnBurst(e.clientX, e.clientY, 'sparkle', 10);
      }
    });

    // ----------------------------------------------------
    // Enter Universe Navigation
    // ----------------------------------------------------
    const btnEnter = document.getElementById('btn-enter-universe');
    const appInterface = document.getElementById('app-interface');

    btnEnter.addEventListener('click', () => {
      synth.start();
      updateAudioIcon(true);
      
      landingScreen.style.opacity = '0';
      setTimeout(() => {
        landingScreen.style.display = 'none';
        appInterface.classList.add('active');
        startTimerCountups();
      }, 1000);
    });

    // ----------------------------------------------------
    // Live Countdown and Duration Counters
    // ----------------------------------------------------
    const startDate = new Date('2026-06-16T12:00:00');
    // Friday, July 3, 2026 at 18:00:00 is the start of the weekend
    const weekendStart = new Date('2026-07-03T18:00:00');
    // Sunday, July 5, 2026 at 23:59:59 is the end of the weekend
    const weekendEnd = new Date('2026-07-05T23:59:59');

    function getWeekendTarget() {
      const now = new Date();
      if (now < weekendStart) {
        return { date: weekendStart, status: 'starts' };
      } else if (now >= weekendStart && now <= weekendEnd) {
        return { date: weekendEnd, status: 'ends' };
      } else {
        // Fallback for future weeks (rolls over dynamically)
        const nextSun = new Date(now);
        nextSun.setDate(now.getDate() + (7 - now.getDay()) % 7);
        nextSun.setHours(23, 59, 59, 999);
        return { date: nextSun, status: 'ends' };
      }
    }

    function updateCounters() {
      const now = new Date();
      
      // Time Elapsed Since June 16, 2026
      const elapsedMs = now - startDate;
      const elapsedDays = Math.floor(elapsedMs / (1000 * 60 * 60 * 24));
      const elapsedHrs = Math.floor((elapsedMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const elapsedMins = Math.floor((elapsedMs % (1000 * 60 * 60)) / (1000 * 60));
      const elapsedSecs = Math.floor((elapsedMs % (1000 * 60)) / 1000);
      
      const pad = (num) => String(num).padStart(2, '0');
      
      document.getElementById('global-counter').innerHTML = 
        `<span class="duration-number">${pad(elapsedDays)}d</span> ` +
        `<span class="duration-number">${pad(elapsedHrs)}h</span> ` +
        `<span class="duration-number">${pad(elapsedMins)}m</span> ` +
        `<span class="duration-number">${pad(elapsedSecs)}s</span>`;

      // Live Timer Countdown to Start or End of Weekend
      const targetInfo = getWeekendTarget();
      const weekendTarget = targetInfo.date;
      const statusType = targetInfo.status;

      let remainingMs = weekendTarget - now;
      if (remainingMs < 0) remainingMs = 0;

      const remDays = Math.floor(remainingMs / (1000 * 60 * 60 * 24));
      const remHrs = Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const remMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));
      const remSecs = Math.floor((remainingMs % (1000 * 60)) / 1000);

      document.getElementById('wk-days').textContent = pad(remDays);
      document.getElementById('wk-hours').textContent = pad(remHrs);
      document.getElementById('wk-mins').textContent = pad(remMins);
      document.getElementById('wk-secs').textContent = pad(remSecs);

      // Update labels dynamically based on status
      const timerStatusEl = document.getElementById('timer-status-label');
      if (timerStatusEl) {
        if (statusType === 'starts') {
          timerStatusEl.textContent = "Until Weekend Adventure Starts";
        } else {
          timerStatusEl.textContent = "Until Weekend Adventure Ends";
        }
      }
      
      // Update Connection modal report status dynamically
      const reportStatusEl = document.getElementById('mission-report-weekend-status');
      if (reportStatusEl) {
        if (now < weekendStart) {
          reportStatusEl.textContent = "Scheduled ⏳";
          reportStatusEl.style.color = "var(--color-gold)";
        } else if (now >= weekendStart && now <= weekendEnd) {
          reportStatusEl.textContent = "In Progress ⚡";
          reportStatusEl.style.color = "var(--color-cyan)";
        } else {
          reportStatusEl.textContent = "COMPLETED ✅";
          reportStatusEl.style.color = "var(--color-green)";
        }
      }
    }

    function setupDynamicTimeline() {
      const now = new Date();
      const timelineContainer = document.getElementById('dynamic-timeline-elements');
      if (!timelineContainer) return;
      
      const firstDateObj = new Date('2026-06-30T12:00:00');
      const diffTime = now - firstDateObj;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      let firstDateLabel = "June 30";
      if (diffDays === 0) {
        firstDateLabel = "Today";
      } else if (diffDays === 1) {
        firstDateLabel = "Yesterday";
      } else if (diffDays > 1 && diffDays < 7) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        firstDateLabel = days[firstDateObj.getDay()];
      }
      
      let html = '';
      
      // First Date Item
      html += `
        <div class="timeline-item">
          <div class="timeline-dot"><div class="timeline-dot-inner"></div></div>
          <div class="timeline-date">${firstDateLabel}</div>
          <div class="timeline-content-card" style="background: rgba(255, 64, 129, 0.05); border-color: rgba(255, 64, 129, 0.2);">
            <h4 class="timeline-title" style="color: var(--color-pink);">First Date (Reality > Expectations) 🌅</h4>
            <p class="timeline-desc">Meeting in person at last. An entire day filled with laughter, deep conversations, and chemistry that proved 100% real. The universe clicked.</p>
          </div>
        </div>
      `;
      
      if (now < weekendStart) {
        // Today is mid-week (e.g. Wednesday July 1st)
        html += `
          <div class="timeline-item">
            <div class="timeline-dot"><div class="timeline-dot-inner"></div></div>
            <div class="timeline-date">Today</div>
            <div class="timeline-content-card" style="background: rgba(170, 0, 255, 0.05); border-color: rgba(170, 0, 255, 0.2);">
              <h4 class="timeline-title" style="color: var(--color-purple);">Anticipation & Countdown 💫</h4>
              <p class="timeline-desc">One amazing date yesterday wasn't enough. We are in orbit, counting down the hours and sharing stories until the weekend adventure begins.</p>
            </div>
          </div>
          <div class="timeline-item">
            <div class="timeline-dot"><div class="timeline-dot-inner"></div></div>
            <div class="timeline-date">This Weekend</div>
            <div class="timeline-content-card" style="background: rgba(0, 229, 255, 0.05); border-color: rgba(0, 229, 255, 0.2);">
              <h4 class="timeline-title" style="color: var(--color-cyan);">Weekend Adventure 🚀</h4>
              <p class="timeline-desc">Because one day wasn't enough. We are spending this weekend writing new chapters, exploring side-by-side, and making more memories.</p>
            </div>
          </div>
        `;
      } else if (now >= weekendStart && now <= weekendEnd) {
        // Active Weekend!
        html += `
          <div class="timeline-item">
            <div class="timeline-dot"><div class="timeline-dot-inner"></div></div>
            <div class="timeline-date">Today</div>
            <div class="timeline-content-card" style="background: rgba(0, 229, 255, 0.05); border-color: rgba(0, 229, 255, 0.2);">
              <h4 class="timeline-title" style="color: var(--color-cyan);">Weekend Adventure 🚀</h4>
              <p class="timeline-desc">Because one day wasn't enough. We are spending this weekend writing new chapters, exploring side-by-side, and making more memories. Mission in progress.</p>
            </div>
          </div>
        `;
      } else {
        // After Weekend
        html += `
          <div class="timeline-item">
            <div class="timeline-dot"><div class="timeline-dot-inner"></div></div>
            <div class="timeline-date">July 3–5</div>
            <div class="timeline-content-card" style="background: rgba(0, 230, 118, 0.05); border-color: rgba(0, 230, 118, 0.2);">
              <h4 class="timeline-title" style="color: var(--color-green);">Weekend Adventure 🚀</h4>
              <p class="timeline-desc">Mission accomplished. One amazing day turned into a weekend of writing new chapters, exploring side-by-side, and making unforgettable memories.</p>
            </div>
          </div>
        `;
      }
      
      timelineContainer.innerHTML = html;
    }

    function startTimerCountups() {
      updateCounters();
      setInterval(updateCounters, 1000);
      setupDynamicTimeline();
    }

    // ----------------------------------------------------
    // Main Orbit Navigation, Modals & Visited Tracking
    // ----------------------------------------------------
    const planets = document.querySelectorAll('.planet');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCards = document.querySelectorAll('.modal-card');
    
    const visitedSections = {
      special: false,
      ai: false,
      timeline: false,
      gallery: false,
      future: false,
      compatibility: false
    };

    function checkMissionUnlock() {
      const allVisited = Object.values(visitedSections).every(val => val === true);
      const reportPlanet = document.getElementById('report-planet');
      
      if (allVisited && !reportPlanet.classList.contains('unlocked')) {
        reportPlanet.classList.add('unlocked');
        
        const rect = reportPlanet.getBoundingClientRect();
        cosmos.spawnBurst(rect.left + rect.width/2, rect.top + rect.height/2, 'heart', 30);
        synth.playChime();
        
        document.getElementById('mission-locked-view').style.display = 'none';
        document.getElementById('mission-unlocked-view').style.display = 'block';
      }
      
      const count = Object.values(visitedSections).filter(Boolean).length;
      document.getElementById('mission-lock-text').textContent = 
        `Marsden, you must explore all other sectors of Our Universe first. Visited: ${count}/6`;
    }

    planets.forEach(planet => {
      planet.addEventListener('click', (e) => {
        const section = planet.getAttribute('data-section');
        synth.playClick();
        
        if (section === 'report' && !planet.classList.contains('unlocked')) {
          planet.classList.add('error-shaking');
          cosmos.spawnBurst(e.clientX, e.clientY, 'sparkle', 8);
          setTimeout(() => planet.classList.remove('error-shaking'), 500);
          
          openModal('report');
          return;
        }

        openModal(section);
        
        if (section !== 'report' && !visitedSections[section]) {
          visitedSections[section] = true;
          planet.classList.add('visited');
          checkMissionUnlock();
        }
      });
    });

    function openModal(section) {
      // Pause Background Starfield to avoid layout-blur lag on animation!
      cosmos.pause();
      
      modalOverlay.classList.add('active');
      modalCards.forEach(card => {
        if (card.getAttribute('data-section') === section) {
          card.style.display = 'flex';
          
          if (section === 'timeline') {
            setTimeout(() => {
              const items = card.querySelectorAll('.timeline-item');
              items.forEach((item, idx) => {
                setTimeout(() => item.classList.add('active'), idx * 150);
              });
            }, 50);
          }
        } else {
          card.style.display = 'none';
        }
      });
    }

    function closeModal() {
      modalOverlay.classList.remove('active');
      synth.playClick();
      
      // Unpause Background Starfield now that modal is closed!
      cosmos.unpause();
      
      document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('active'));
    }

    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', closeModal);
    });

    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) {
        closeModal();
      }
    });

    // ----------------------------------------------------
    // Section detail: Interactive Constellation (Special)
    // ----------------------------------------------------
    const constellationStars = document.querySelectorAll('.const-star');
    const constellationLines = document.querySelectorAll('.const-line');
    const listItems = document.querySelectorAll('.special-item');
    const displayCard = document.getElementById('special-text-display');

    const specialFacts = [
      "You make conversations effortless. Talking to you flows like a river under the starlight.",
      "You genuinely enjoy reading and learning. Your curious mind is one of the brightest spots in this universe.",
      "You love swimming. Water seems like your natural element, fluid and beautiful.",
      "Your movie recommendations are surprisingly good. You have excellent cinematic vision.",
      "You somehow made me look forward to checking my phone. A vibration now brings a smile.",
      "You love cuddles, which is obviously excellent judgment and extremely high-value chemistry.",
      "You make ordinary days feel exciting. Having you in my orbit makes every moment shine."
    ];

    function activateSpecialStar(idx) {
      constellationStars.forEach((star, sIdx) => {
        if (sIdx === idx) {
          star.classList.add('active');
        } else {
          star.classList.remove('active');
        }
      });

      listItems.forEach((item, iIdx) => {
        if (iIdx === idx) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      constellationLines.forEach(line => {
        const idParts = line.id.split('-');
        if (idParts.includes(String(idx))) {
          line.classList.add('active');
        } else {
          line.classList.remove('active');
        }
      });

      displayCard.innerHTML = `<span>${specialFacts[idx]}</span>`;
      synth.playClick();
    }

    constellationStars.forEach(star => {
      star.addEventListener('click', () => {
        const idx = parseInt(star.getAttribute('data-index'));
        activateSpecialStar(idx);
        
        const rect = star.getBoundingClientRect();
        cosmos.spawnBurst(rect.left + rect.width/2, rect.top + rect.height/2, 'sparkle', 8);
      });
    });

    listItems.forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.getAttribute('data-index'));
        activateSpecialStar(idx);
      });
    });

    // CSS shaking keyframe helper
    document.head.insertAdjacentHTML('beforeend', `
      <style>
        .error-shaking {
          animation: shake 0.4s ease !important;
        }
        @keyframes shake {
          0%, 100% { transform: translate3d(0,0,0) rotate(calc(-1 * var(--angle))) scale(1); }
          20%, 60% { transform: translate3d(-6px, 0, 0) rotate(calc(-1 * var(--angle))) scale(0.96); }
          40%, 80% { transform: translate3d(6px, 0, 0) rotate(calc(-1 * var(--angle))) scale(1.04); }
        }
      </style>
    `);

    // ----------------------------------------------------
    // Section detail: AI Companion chatbot
    // ----------------------------------------------------
    const chatUserIn = document.getElementById('chat-user-input');
    const chatSendBtn = document.getElementById('chat-send-btn');
    const chatBox = document.getElementById('chat-box');
    const quickPrompts = document.querySelectorAll('.chat-suggest-btn');

    function appendMessage(text, sender) {
      const msg = document.createElement('div');
      msg.classList.add('chat-message', sender);
      msg.textContent = text;
      chatBox.appendChild(msg);
      chatBox.scrollTop = chatBox.scrollHeight;
      return msg;
    }

    function getAIResponse(input) {
      const text = input.toLowerCase().trim();
      
      if (text.includes("beatrice")) {
        return "Beatrice is absolutely amazing! She loves swimming, reading books, watching movies, and cuddling (which Marsden thinks is excellent judgment). She has an amazing smile that makes Marsden genuinely happy. 😊💖";
      }
      if (text.includes("text") || text.includes("start") || text.includes("june 16") || text.includes("contact")) {
        return "Marsden and Beatrice started texting on June 16! That same day, they shared their very first phone call, launching their shared orbit. 📱💬";
      }
      if (text.includes("phone") || text.includes("call") || text.includes("june 21")) {
        if (text.includes("21") || text.includes("long") || text.includes("meaningful")) {
          return "On June 21, they had their first long meaningful phone call. Talking for hours felt completely effortless. 📞✨";
        }
        return "Their first phone call happened on June 16, the very day they started texting! Later, on June 21, they shared their first long meaningful phone call. Talk about stellar connection! 📞⚡";
      }
      if (text.includes("photo") || text.includes("flirt") || text.includes("saturday")) {
        return "On Saturday, they shared their first photos and started flirting! The chemistry was undeniable from the start. 📸🥰";
      }
      if (text.includes("yesterday") || text.includes("date") || text.includes("meet")) {
        return "Yesterday, they met in person for the very first time! They spent the entire day laughing, talking, and creating unforgettable memories. Marsden says reality exceeded all expectations. 🥰🌅";
      }
      if (text.includes("weekend") || text.includes("today") || text.includes("tomorrow")) {
        return "They are spending this weekend together! One amazing day wasn't enough, so they are turning it into a full weekend adventure to build even more memories. 🚀🎒";
      }
      if (text.includes("secret") || text.includes("easter") || text.includes("egg") || text.includes("polaris")) {
        return "Psst! Have you checked out the Polaris star in the top-right corner? Try tapping it 5 times... I hear it contains a direct letter from Marsden. 🤫✨";
      }
      if (text.includes("smile") || text.includes("happy")) {
        return "Beatrice has a stunning smile. Making her smile makes Marsden genuinely happy. He likes her very much! 😊❤️";
      }
      if (text.includes("swim") || text.includes("read") || text.includes("movie") || text.includes("cuddle")) {
        return "Beatrice loves swimming, reading books, watching movies, and cuddling. Marsden is excited to do all of these together on their upcoming bucket list adventures! 🏊‍♀️📚🎬🤗";
      }
      if (text.includes("hello") || text.includes("hi") || text.includes("hey")) {
        return "Hello! I am your Cosmic Companion. Ask me about Beatrice, their first date, June 16, Saturday, or this weekend! 🌌";
      }
      return "My databanks are searching... I couldn't find a direct match. Try asking about 'Beatrice', 'June 16', 'Saturday', 'yesterday', or 'cuddles'! 💫";
    }

    function handleChatSubmit() {
      const text = chatUserIn.value.trim();
      if (!text) return;
      
      appendMessage(text, 'user');
      chatUserIn.value = '';
      synth.playClick();
      
      const typingIndicator = appendMessage('', 'ai');
      typingIndicator.innerHTML = '<span class="typing-caret"></span>';
      
      setTimeout(() => {
        const reply = getAIResponse(text);
        typingIndicator.textContent = '';
        
        let idx = 0;
        const interval = setInterval(() => {
          typingIndicator.textContent = reply.substring(0, idx) + '█';
          idx++;
          
          // Optimize scroll: only scroll every 3 characters or at the end to prevent layout thrashing
          if (idx % 3 === 0 || idx > reply.length) {
            chatBox.scrollTop = chatBox.scrollHeight;
          }
          
          if (idx > reply.length) {
            clearInterval(interval);
            typingIndicator.textContent = reply;
          }
        }, 35);
      }, 500);
    }

    chatSendBtn.addEventListener('click', handleChatSubmit);
    chatUserIn.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') handleChatSubmit();
    });

    quickPrompts.forEach(btn => {
      btn.addEventListener('click', () => {
        const query = btn.getAttribute('data-query');
        chatUserIn.value = query;
        handleChatSubmit();
      });
    });

    // ----------------------------------------------------
    // Section detail: Memory Gallery Lightbox
    // ----------------------------------------------------
    const galleryCards = document.querySelectorAll('.gallery-card');
    const lightboxOverlay = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.querySelector('.lightbox-close');
    const prevBtn = document.querySelector('.lightbox-nav.prev');
    const nextBtn = document.querySelector('.lightbox-nav.next');

    let currentPhotoIdx = 0;
    const galleryData = [
      { src: './assets/first_hug.jpg', caption: '❤️ First Hug – A warm, magical hold that melted away all distance.' },
      { src: './assets/laughing_together.jpg', caption: "😂 That moment we couldn't stop laughing – Joy in its purest, cosmic form." },
      { src: './assets/favorite_conversation.jpg', caption: '☕ Our favorite conversation – Hours of sharing stories under a virtual sky.' },
      { src: './assets/unforgettable_day.jpg', caption: '🌅 One unforgettable day – Walking together, watching our worlds sync in person.' }
    ];

    function showLightbox(idx) {
      currentPhotoIdx = idx;
      lightboxImg.src = galleryData[idx].src;
      lightboxCaption.textContent = galleryData[idx].caption;
      lightboxOverlay.classList.add('active');
      synth.playClick();
    }

    galleryCards.forEach((card, idx) => {
      card.addEventListener('click', () => {
        showLightbox(idx);
      });
    });

    lightboxClose.addEventListener('click', () => {
      lightboxOverlay.classList.remove('active');
      synth.playClick();
    });

    prevBtn.addEventListener('click', () => {
      currentPhotoIdx = (currentPhotoIdx - 1 + galleryData.length) % galleryData.length;
      showLightbox(currentPhotoIdx);
    });

    nextBtn.addEventListener('click', () => {
      currentPhotoIdx = (currentPhotoIdx + 1) % galleryData.length;
      showLightbox(currentPhotoIdx);
    });

    // ----------------------------------------------------
    // Section detail: Future Adventures (Bucket List)
    // ----------------------------------------------------
    const bucketItems = document.querySelectorAll('.bucket-item');

    bucketItems.forEach(item => {
      item.addEventListener('click', (e) => {
        item.classList.toggle('checked');
        synth.playClick();
        
        if (item.classList.contains('checked')) {
          cosmos.spawnBurst(e.clientX, e.clientY, 'heart', 15);
        } else {
          cosmos.spawnBurst(e.clientX, e.clientY, 'sparkle', 8);
        }
      });
    });

    // ----------------------------------------------------
    // Section detail: Compatibility Analyzer Scanner
    // ----------------------------------------------------
    const runScanBtn = document.getElementById('run-scan-btn');
    const scannerBox = document.getElementById('scanner-box');
    const scanLogs = document.getElementById('scan-logs');
    const scanResults = document.getElementById('scan-results');

    const logTexts = [
      "[INFO] Initializing Heart-Sync Protocol v1.4...",
      "[INFO] Resolving coordinates for Marsden & Beatrice...",
      "[INFO] Syncing interest data: Swimming, Books, Cuddles, Movies...",
      "[INFO] Analyzing conversation flows: texting June 16, calling June 16...",
      "[INFO] Calculating phone call endurance metrics... (100% capacity)",
      "[INFO] Assessing flirting levels from Saturday... (Extreme overload)",
      "[INFO] Calibrating real-life date chemistry: YESTERDAY... verified.",
      "[SUCCESS] Compatibility index calculated."
    ];

    runScanBtn.addEventListener('click', () => {
      runScanBtn.style.display = 'none';
      scannerBox.classList.add('scanner-active');
      synth.playClick();
      
      let logIdx = 0;
      function printNextLog() {
        if (logIdx < logTexts.length) {
          const log = document.createElement('div');
          log.textContent = logTexts[logIdx];
          scanLogs.appendChild(log);
          scanLogs.scrollTop = scanLogs.scrollHeight;
          logIdx++;
          setTimeout(printNextLog, 300);
        } else {
          setTimeout(() => {
            scannerBox.classList.remove('scanner-active');
            scanLogs.style.display = 'none';
            scanResults.style.display = 'block';
            synth.playChime();
            animateProgressBars();
          }, 500);
        }
      }
      printNextLog();
    });

    function animateProgressBars() {
      const fills = document.querySelectorAll('.stat-bar-fill');
      const vals = document.querySelectorAll('.stat-labels .val');
      
      fills.forEach((fill, idx) => {
        const valEl = vals[idx];
        const target = parseFloat(valEl.getAttribute('data-target'));
        const decimals = parseInt(valEl.getAttribute('data-decimals') || '0');
        const suffix = valEl.getAttribute('data-suffix') || '%';
        
        setTimeout(() => {
          fill.style.width = (target === 99 ? 100 : target) + '%';
        }, 80);
        
        let current = 0;
        const speed = target / 35;
        const counter = setInterval(() => {
          current += speed;
          if (current >= target) {
            current = target;
            clearInterval(counter);
          }
          valEl.textContent = current.toFixed(decimals) + suffix;
        }, 25);
      });
    }

    // ----------------------------------------------------
    // Secret Easter Egg & Handwritten Letter (5x Polaris Tap)
    // ----------------------------------------------------
    const polarisStar = document.getElementById('polaris-star');
    const envelopeModal = document.getElementById('envelope-modal');
    const envelopeSvg = document.getElementById('envelope-svg');
    const envelopeFlap = document.getElementById('envelope-flap');
    const waxSeal = document.getElementById('wax-seal');
    const letterPaper = document.getElementById('letter-paper');
    const letterCloseBtn = document.getElementById('letter-close-btn');
    const dailyLetterMessage = document.getElementById('daily-letter-message');

    const dailyMessages = [
      'Thank you for making ordinary days feel so extraordinary. Knowing you has made this universe feel so much brighter, and I look forward to checking my phone every single day just to see your name.',
      'Today feels a little softer because I get to think about you. I hope your heart feels as loved as you make mine feel.',
      'No matter how busy life gets, you are still the calmest, brightest part of my world. I am so lucky to love you.',
      'I hope you know how much joy you bring into my life, even in the smallest moments. You make everything feel more beautiful.',
      'You make my days feel lighter, warmer, and more meaningful. I am grateful for every little moment with you.',
      'I keep falling for you in the quiet ways — your smile, your voice, your kindness — and I hope you feel how deeply loved you are today.',
      'Today I just want you to know that you are cherished, adored, and always on my mind. I love you more than words can say.'
    ];

    if (dailyLetterMessage) {
      const daySeed = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      dailyLetterMessage.textContent = dailyMessages[daySeed % dailyMessages.length];
    }

    let polarisClicks = 0;

    polarisStar.addEventListener('click', (e) => {
      polarisClicks++;
      synth.playClick();
      cosmos.spawnBurst(e.clientX, e.clientY, 'sparkle', 8);

      if (polarisClicks >= 5) {
        polarisClicks = 0;
        triggerEasterEgg();
      }
    });

    function triggerEasterEgg() {
      synth.playChime();
      const rect = polarisStar.getBoundingClientRect();
      cosmos.spawnBurst(rect.left + rect.width/2, rect.top + rect.height/2, 'heart', 35);

      envelopeModal.classList.add('active');
      envelopeFlap.setAttribute('d', 'M 0,100 L 300,280 L 600,100 Z');
      waxSeal.style.display = 'block';
      letterPaper.classList.remove('active');
      envelopeSvg.style.display = 'block';
    }

    waxSeal.addEventListener('click', (e) => {
      e.stopPropagation();
      synth.playChime();
      cosmos.spawnBurst(e.clientX, e.clientY, 'heart', 15);
      
      waxSeal.style.display = 'none';
      envelopeFlap.setAttribute('d', 'M 0,100 L 300,0 L 600,100 Z');
      
      setTimeout(() => {
        envelopeSvg.style.display = 'none';
        letterPaper.classList.add('active');
      }, 500);
    });

    function closeLetter() {
      envelopeModal.classList.remove('active');
      letterPaper.classList.remove('active');
      synth.playClick();
    }

    letterCloseBtn.addEventListener('click', closeLetter);
    envelopeModal.addEventListener('click', (e) => {
      if (e.target === envelopeModal) {
        closeLetter();
      }
    });

  