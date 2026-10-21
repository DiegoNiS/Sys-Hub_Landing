/* ============================================================
   SysHub — Main JavaScript
   Separado del index.html para mejor mantenimiento y carga.
   Cargado con defer: se ejecuta después del parsing del HTML,
   sin bloquear el render inicial.
   ============================================================ */

(function () {
  'use strict';

  // ── 1. Iniciar Lucide Icons ─────────────────────────────
  lucide.createIcons();

  // ── 2. Año actual dinámico ──────────────────────────────
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ── 3. Dark Mode / Light Mode con persistencia local ────
  const themeToggleBtn = document.getElementById('theme-toggle');
  const htmlElement    = document.documentElement;

  const savedTheme = localStorage.getItem('syshub-theme');
  if (savedTheme === 'dark' || !savedTheme) {
    htmlElement.classList.add('dark');
  } else {
    htmlElement.classList.remove('dark');
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const isDark = htmlElement.classList.toggle('dark');
      localStorage.setItem('syshub-theme', isDark ? 'dark' : 'light');
    });
  }

  // ── 4. Smooth scroll con offset para Island Dock ────────
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const dockOffset    = 90;
        const targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - dockOffset;
        window.scrollTo({ top: targetPosition, behavior: 'smooth' });
      }
    });
  });

  // ── 5. Canvas de Partículas — Red Neuronal / Malla Cuántica ──
  //
  //  Optimizaciones aplicadas vs. versión original:
  //  a) isDark se cachea y solo se actualiza vía MutationObserver
  //     en lugar de leerlo en cada frame (evita reflow por frame).
  //  b) lineColor se pre-construye fuera del loop interno.
  //  c) Loop de animación se pausa cuando el tab está oculto
  //     (document.visibilitychange) — evita trabajo en background.
  //  d) mousemove usa throttle con rAF para procesar solo 1 vez
  //     por frame en vez de en cada evento del sistema.
  //  e) El resize también throttlea para no reconstruir partículas
  //     constantemente mientras el usuario arrastra la ventana.
  // ───────────────────────────────────────────────────────────
  (function initQuantumCanvas() {
    const canvas = document.getElementById('quantum-bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    let width  = canvas.width  = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    const particles    = [];
    const particleCount = Math.min(Math.floor((width * height) / 22000), 55);

    // Cache de isDark — se actualiza solo cuando cambia la clase en <html>
    let isDark     = document.documentElement.classList.contains('dark');
    let lineColor  = isDark ? 'rgba(56, 189, 248, ' : 'rgba(14, 165, 233, ';
    let fillColor  = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.45)';

    const observer = new MutationObserver(() => {
      isDark    = document.documentElement.classList.contains('dark');
      lineColor = isDark ? 'rgba(56, 189, 248, ' : 'rgba(14, 165, 233, ';
      fillColor = isDark ? 'rgba(56, 189, 248, 0.65)' : 'rgba(2, 132, 199, 0.45)';
    });
    observer.observe(document.documentElement, {
      attributes:      true,
      attributeFilter: ['class']
    });

    // Mouse con throttle: solo procesamos la posición una vez por frame
    const mouse = { x: null, y: null, maxDist: 140 };
    let pendingMouseX = null;
    let pendingMouseY = null;
    let mousePending  = false;

    function flushMouse() {
      mouse.x = pendingMouseX;
      mouse.y = pendingMouseY;
      mousePending = false;
    }

    window.addEventListener('mousemove', e => {
      pendingMouseX = e.clientX;
      pendingMouseY = e.clientY;
      if (!mousePending) {
        mousePending = true;
        requestAnimationFrame(flushMouse);
      }
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    // Resize con debounce (espera 150ms de inactividad para reconstruir)
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        width  = canvas.width  = window.innerWidth;
        height = canvas.height = window.innerHeight;
      }, 150);
    });

    class Particle {
      constructor() {
        this.x      = Math.random() * width;
        this.y      = Math.random() * height;
        this.vx     = (Math.random() - 0.5) * 0.45;
        this.vy     = (Math.random() - 0.5) * 0.45;
        this.radius = Math.random() * 1.6 + 0.8;
      }

      update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > width)  this.vx *= -1;
        if (this.y < 0 || this.y > height)  this.vy *= -1;

        // Reacción a la proximidad del mouse
        if (mouse.x !== null && mouse.y !== null) {
          const dx   = mouse.x - this.x;
          const dy   = mouse.y - this.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouse.maxDist) {
            const force = (mouse.maxDist - dist) / mouse.maxDist;
            this.x -= (dx / dist) * force * 1.2;
            this.y -= (dy / dist) * force * 1.2;
          }
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = fillColor;
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    let animFrameId;
    let isRunning = true;

    function animate() {
      if (!isRunning) return;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        for (let j = i + 1; j < particles.length; j++) {
          const dx       = particles[i].x - particles[j].x;
          const dy       = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 110) {
            const alpha = (1 - distance / 110) * 0.22;
            ctx.strokeStyle = lineColor + alpha + ')';
            ctx.lineWidth   = 0.8;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      animFrameId = requestAnimationFrame(animate);
    }

    // Pausa cuando el tab está oculto, reanuda cuando vuelve
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        isRunning = false;
        cancelAnimationFrame(animFrameId);
      } else {
        isRunning = true;
        animate();
      }
    });

    animate();
  })();

  // ── 6. Showcase Hero Tilt 3D ────────────────────────────
  (function initTiltShowcase() {
    const tiltCard = document.getElementById('hero-tilt-card');
    if (!tiltCard) return;

    tiltCard.addEventListener('mousemove', e => {
      const rect    = tiltCard.getBoundingClientRect();
      const x       = e.clientX - rect.left;
      const y       = e.clientY - rect.top;
      const rotateX = ((y - rect.height / 2) / (rect.height / 2)) * -4;
      const rotateY = ((x - rect.width  / 2) / (rect.width  / 2)) *  4;
      tiltCard.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.01, 1.01, 1.01)`;
    });

    tiltCard.addEventListener('mouseleave', () => {
      tiltCard.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)';
    });
  })();

  // ── 7. Ripple Effect en Botones de WhatsApp ─────────────
  document.querySelectorAll('.ripple-active').forEach(button => {
    button.addEventListener('click', function (e) {
      const rect     = this.getBoundingClientRect();
      const diameter = Math.max(rect.width, rect.height);
      const radius   = diameter / 2;

      const circle = document.createElement('span');
      circle.style.width  = circle.style.height = `${diameter}px`;
      circle.style.left   = `${e.clientX - rect.left - radius}px`;
      circle.style.top    = `${e.clientY - rect.top  - radius}px`;
      circle.classList.add('ripple-span');

      const existing = this.querySelector('.ripple-span');
      if (existing) existing.remove();

      this.appendChild(circle);
    });
  });

})();
