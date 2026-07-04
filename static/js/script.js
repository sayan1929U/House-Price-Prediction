/* ================================================================
   AI HOUSE PRICE PREDICTION SYSTEM — script.js
   Vanilla JavaScript · No frameworks · No jQuery
   Author: Senior Frontend Engineering Pass

   TABLE OF CONTENTS
     0.  Utilities (debounce, throttle, qs helpers)
     1.  Dynamic Style Injection (for elements this script creates)
     2.  DOM Ready Bootstrap
     3.  Navbar Scroll Effect
     4.  Scroll Progress Bar
     5.  Back To Top Button
     6.  Smooth Scroll (anchor links)
     7.  Mobile Nav Toggle
     8.  Reveal On Scroll (IntersectionObserver)
     9.  Animated Statistics Counter
     10. Hero Typing Effect
     11. Mouse Glow Effect
     12. Button Ripple Effect
     13. Input Focus / Floating Label Enhancements
     14. Form Validation (empty + number checks)
     15. Predict Form Submission + Loading State
     16. Toast Notification System
     17. Success / Error Micro-Animations
     18. Floating Card Idle Animation (parallax on mouse move)
================================================================ */

(function () {
  'use strict';

  /* ================================================================
     0. UTILITIES
  ================================================================ */

  /**
   * Debounce: delays invoking `fn` until `wait` ms have elapsed
   * since the last time it was invoked. Used for scroll/resize.
   */
  function debounce(fn, wait) {
    let timeout;
    return function debounced(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn.apply(this, args), wait);
    };
  }

  /**
   * Throttle: ensures `fn` runs at most once every `limit` ms.
   * Preferred over debounce for continuous scroll-linked visuals
   * (progress bar, navbar state) so they stay in sync with scroll.
   */
  function throttle(fn, limit) {
    let inThrottle = false;
    return function throttled(...args) {
      if (!inThrottle) {
        fn.apply(this, args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  }

  const qs = (sel, ctx) => (ctx || document).querySelector(sel);
  const qsa = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));

  /**
   * requestAnimationFrame-based tick guard, so we never stack
   * multiple rAF calls for the same scroll event.
   */
  function rafThrottle(fn) {
    let ticking = false;
    return function (...args) {
      if (!ticking) {
        requestAnimationFrame(() => {
          fn.apply(this, args);
          ticking = false;
        });
        ticking = true;
      }
    };
  }

  /* ================================================================
     1. DYNAMIC STYLE INJECTION
     Minimal CSS for elements this script creates at runtime
     (toasts, progress bar, back-to-top, cursor glow) so the file
     is fully self-contained and drops into any existing page.
  ================================================================ */
  function injectRuntimeStyles() {
    const css = `
      /* Scroll progress bar */
      #scrollProgress {
        position: fixed; top: 0; left: 0; height: 3px; width: 0%;
        background: linear-gradient(90deg, #3B82F6, #06B6D4);
        z-index: 9999; transition: width 0.1s ease-out;
        pointer-events: none;
      }

      /* Back to top button */
      #backToTop {
        position: fixed; right: 24px; bottom: 24px; width: 48px; height: 48px;
        border-radius: 50%; background: linear-gradient(135deg, #3B82F6, #06B6D4);
        color: #fff; display: flex; align-items: center; justify-content: center;
        font-size: 18px; border: none; cursor: pointer; z-index: 998;
        box-shadow: 0 8px 24px rgba(59,130,246,0.4);
        opacity: 0; transform: translateY(16px) scale(0.9); pointer-events: none;
        transition: opacity 0.3s ease, transform 0.3s ease;
      }
      #backToTop.visible { opacity: 1; transform: translateY(0) scale(1); pointer-events: auto; }
      #backToTop:hover { transform: translateY(-4px) scale(1.05); }

      /* Cursor glow */
      #cursorGlow {
        position: fixed; top: 0; left: 0; width: 380px; height: 380px;
        border-radius: 50%; pointer-events: none; z-index: 1;
        background: radial-gradient(circle, rgba(59,130,246,0.12), transparent 70%);
        transform: translate(-50%, -50%); will-change: transform;
        transition: opacity 0.3s ease; opacity: 0;
      }

      /* Toast container + toasts */
      #toastContainer {
        position: fixed; top: 90px; right: 20px; z-index: 9999;
        display: flex; flex-direction: column; gap: 12px; max-width: 340px;
      }
      .toast {
        display: flex; align-items: flex-start; gap: 12px;
        background: rgba(15, 23, 42, 0.92);
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        color: #F8FAFC; padding: 14px 16px; border-radius: 14px;
        box-shadow: 0 12px 32px rgba(0,0,0,0.35);
        font-family: 'Inter', sans-serif; font-size: 14px;
        transform: translateX(120%); opacity: 0;
        transition: transform 0.4s cubic-bezier(.16,1,.3,1), opacity 0.4s ease;
      }
      .toast.show { transform: translateX(0); opacity: 1; }
      .toast.hide { transform: translateX(120%); opacity: 0; }
      .toast-icon { font-size: 18px; line-height: 1; flex-shrink: 0; margin-top: 1px; }
      .toast-success .toast-icon { color: #10B981; }
      .toast-error .toast-icon { color: #EF4444; }
      .toast-info .toast-icon { color: #06B6D4; }
      .toast-close {
        background: none; border: none; color: #94A3B8; cursor: pointer;
        font-size: 14px; margin-left: auto; padding: 0 2px;
      }
      .toast-close:hover { color: #F8FAFC; }

      /* Shake animation for invalid fields */
      @keyframes fieldShake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-6px); }
        40% { transform: translateX(6px); }
        60% { transform: translateX(-4px); }
        80% { transform: translateX(4px); }
      }
      .field-shake { animation: fieldShake 0.4s ease; }

      .field input.field-invalid {
        border-color: #EF4444 !important;
        background: rgba(239, 68, 68, 0.06) !important;
      }
      .field input.field-valid {
        border-color: #10B981 !important;
      }
      .field-error-msg {
        display: block; font-size: 12px; color: #EF4444;
        margin-top: 6px; padding-left: 4px;
        opacity: 0; max-height: 0; overflow: hidden;
        transition: opacity 0.25s ease, max-height 0.25s ease;
      }
      .field-error-msg.show { opacity: 1; max-height: 20px; }

      /* Success pulse on prediction result */
      @keyframes successPop {
        0%   { transform: scale(0.9); opacity: 0; }
        60%  { transform: scale(1.02); opacity: 1; }
        100% { transform: scale(1); opacity: 1; }
      }
      .success-pop { animation: successPop 0.5s cubic-bezier(.16,1,.3,1) both; }
    `;
    const styleTag = document.createElement('style');
    styleTag.id = 'runtime-injected-styles';
    styleTag.textContent = css;
    document.head.appendChild(styleTag);
  }

  /* ================================================================
     2. DOM READY BOOTSTRAP
  ================================================================ */
  document.addEventListener('DOMContentLoaded', init);

  function init() {
    injectRuntimeStyles();
    initNavbarScroll();
    initScrollProgressBar();
    initBackToTop();
    initSmoothScroll();
    initMobileNavToggle();
    initRevealOnScroll();
    initStatCounters();
    initHeroTypingEffect();
    initMouseGlow();
    initRippleEffect();
    initInputFocusEffects();
    initPredictForm();
    scrollToResultIfPresent();
  }

  /* ================================================================
     3. NAVBAR SCROLL EFFECT
  ================================================================ */
  function initNavbarScroll() {
    const navbar = qs('#navbar') || qs('.navbar');
    if (!navbar) return;

    const onScroll = rafThrottle(() => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll(); // set initial state on load
  }

  /* ================================================================
     4. SCROLL PROGRESS BAR
  ================================================================ */
  function initScrollProgressBar() {
    let bar = qs('#scrollProgress');
    if (!bar) {
      bar = document.createElement('div');
      bar.id = 'scrollProgress';
      document.body.appendChild(bar);
    }

    const update = rafThrottle(() => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      bar.style.width = progress + '%';
    });

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', debounce(update, 150));
    update();
  }

  /* ================================================================
     5. BACK TO TOP BUTTON
  ================================================================ */
  function initBackToTop() {
    let btn = qs('#backToTop');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'backToTop';
      btn.setAttribute('aria-label', 'Back to top');
      btn.innerHTML = '&#8593;'; // up arrow, no icon-font dependency
      document.body.appendChild(btn);
    }

    const toggleVisibility = rafThrottle(() => {
      btn.classList.toggle('visible', window.scrollY > 500);
    });

    window.addEventListener('scroll', toggleVisibility, { passive: true });

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ================================================================
     6. SMOOTH SCROLL (anchor links)
  ================================================================ */
  function initSmoothScroll() {
    qsa('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (!targetId || targetId === '#') return;

        const target = qs(targetId);
        if (!target) return;

        e.preventDefault();
        const navbarHeight = (qs('.navbar')?.offsetHeight || 0) + 12;
        const top = target.getBoundingClientRect().top + window.scrollY - navbarHeight;

        window.scrollTo({ top, behavior: 'smooth' });
      });
    });
  }

  /* ================================================================
     7. MOBILE NAV TOGGLE
  ================================================================ */
  function initMobileNavToggle() {
    const toggle = qs('#navToggle');
    const links = qs('#navLinks');
    if (!toggle || !links) return;

    toggle.addEventListener('click', () => {
      const isOpen = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Close menu after a link is tapped (better mobile UX)
    qsa('a', links).forEach((link) => {
      link.addEventListener('click', () => {
        links.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ================================================================
     8. REVEAL ON SCROLL — IntersectionObserver
  ================================================================ */
  function initRevealOnScroll() {
    const revealEls = qsa('.reveal, .feature-card, .stat-card');
    if (!revealEls.length || !('IntersectionObserver' in window)) {
      revealEls.forEach((el) => el.classList.add('visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach((el) => observer.observe(el));
  }

  /* ================================================================
     9. ANIMATED STATISTICS COUNTER
     Parses each .stat-num's text (e.g. "98%", "10,000+", "AI") and,
     if it contains a number, animates from 0 up to that number while
     preserving any prefix/suffix characters (%, +, commas, letters).
  ================================================================ */
  function initStatCounters() {
    const counters = qsa('.stat-num');
    if (!counters.length) return;

    const animateCounter = (el) => {
      const raw = el.textContent.trim();
      const numMatch = raw.match(/[\d,]+/);

      // No numeric portion (e.g. "AI") — skip animation, keep as-is
      if (!numMatch) return;

      const numeric = parseInt(numMatch[0].replace(/,/g, ''), 10);
      if (Number.isNaN(numeric)) return;

      const prefix = raw.slice(0, numMatch.index);
      const suffix = raw.slice(numMatch.index + numMatch[0].length);
      const duration = 1400;
      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic for a premium deceleration feel
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(eased * numeric);

        el.textContent = prefix + current.toLocaleString() + suffix;

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = prefix + numeric.toLocaleString() + suffix;
        }
      }

      requestAnimationFrame(tick);
    };

    if (!('IntersectionObserver' in window)) {
      counters.forEach(animateCounter);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );

    counters.forEach((el) => observer.observe(el));
  }

  /* ================================================================
     10. HERO TYPING EFFECT
     Targets the hero <h1>. Preserves any inner gradient <span> by
     typing the plain text version, then restoring the rich markup
     once typing completes (keeps the gradient-text styling intact).
  ================================================================ */
  function initHeroTypingEffect() {
    const heroTitle = qs('.hero h1');
    if (!heroTitle) return;

    const originalHTML = heroTitle.innerHTML;
    const plainText = heroTitle.textContent.trim();

    heroTitle.setAttribute('aria-label', plainText);
    heroTitle.textContent = '';
    heroTitle.style.minHeight = heroTitle.offsetHeight + 'px';

    let i = 0;
    const speed = 28; // ms per character — fast enough to feel premium, not gimmicky

    function typeChar() {
      if (i <= plainText.length) {
        heroTitle.textContent = plainText.slice(0, i);
        i++;
        setTimeout(typeChar, speed);
      } else {
        // Restore original markup (with gradient span) once done
        heroTitle.innerHTML = originalHTML;
        heroTitle.style.minHeight = '';
      }
    }

    // Slight delay so it starts after initial paint/layout settles
    setTimeout(typeChar, 250);
  }

  /* ================================================================
     11. MOUSE GLOW EFFECT
     A soft radial glow that follows the cursor, adding depth to the
     dark theme without being distracting. Disabled on touch devices.
  ================================================================ */
  function initMouseGlow() {
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (isTouchDevice) return;

    let glow = qs('#cursorGlow');
    if (!glow) {
      glow = document.createElement('div');
      glow.id = 'cursorGlow';
      document.body.appendChild(glow);
    }

    const move = rafThrottle((e) => {
      glow.style.opacity = '1';
      glow.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    });

    document.addEventListener('mousemove', move, { passive: true });
    document.addEventListener('mouseleave', () => {
      glow.style.opacity = '0';
    });
  }

  /* ================================================================
     12. BUTTON RIPPLE EFFECT
  ================================================================ */
  function initRippleEffect() {
    const rippleTargets = qsa('.btn, .submit-btn, [data-ripple]');

    rippleTargets.forEach((btn) => {
      btn.addEventListener('click', function (e) {
        // Avoid ripple firing on disabled/loading buttons
        if (this.classList.contains('loading') || this.disabled) return;

        const rect = this.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);

        ripple.className = 'ripple';
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = e.clientX - rect.left - size / 2 + 'px';
        ripple.style.top = e.clientY - rect.top - size / 2 + 'px';

        this.style.position = this.style.position || 'relative';
        this.style.overflow = 'hidden';
        this.appendChild(ripple);

        ripple.addEventListener('animationend', () => ripple.remove());
      });
    });
  }

  /* ================================================================
     13. INPUT FOCUS / FLOATING LABEL ENHANCEMENTS
     CSS handles the core floating-label transform; here we add a
     subtle "focused" class on the parent .field for extra styling
     hooks (e.g. glowing icon, animated border) and clear validation
     states as the user starts correcting a field.
  ================================================================ */
  function initInputFocusEffects() {
    qsa('.field input').forEach((input) => {
      const field = input.closest('.field');
      if (!field) return;

      input.addEventListener('focus', () => field.classList.add('focused'));
      input.addEventListener('blur', () => field.classList.remove('focused'));

      // Live-clear error state as soon as the user edits the value
      input.addEventListener('input', () => {
        input.classList.remove('field-invalid');
        const msg = field.querySelector('.field-error-msg');
        if (msg) msg.classList.remove('show');
      });
    });
  }

  /* ================================================================
     14. FORM VALIDATION
     Empty-field checks + numeric validation for sqft/bath/balcony/bhk.
     Returns { valid: boolean, firstInvalid: HTMLElement|null }
  ================================================================ */
  function validatePredictForm(form) {
    let isValid = true;
    let firstInvalidField = null;

    const fields = [
      { name: 'location', type: 'text', label: 'Location' },
      { name: 'sqft', type: 'number', label: 'Total Square Feet', min: 1 },
      { name: 'bath', type: 'number', label: 'Bathrooms', min: 0 },
      { name: 'balcony', type: 'number', label: 'Balconies', min: 0 },
      { name: 'bhk', type: 'number', label: 'BHK', min: 1 },
    ];

    fields.forEach(({ name, type, label, min }) => {
      const input = form.querySelector(`[name="${name}"]`);
      if (!input) return;

      const fieldWrap = input.closest('.field');
      const value = input.value.trim();
      let errorMessage = '';

      // Empty field check
      if (value === '') {
        errorMessage = `${label} is required.`;
      }
      // Numeric validation
      else if (type === 'number') {
        const numValue = Number(value);
        if (Number.isNaN(numValue)) {
          errorMessage = `${label} must be a valid number.`;
        } else if (min !== undefined && numValue < min) {
          errorMessage = `${label} must be at least ${min}.`;
        } else if (numValue > 1000000) {
          errorMessage = `${label} value seems too large.`;
        }
      }

      if (errorMessage) {
        isValid = false;
        markFieldInvalid(input, fieldWrap, errorMessage);
        if (!firstInvalidField) firstInvalidField = input;
      } else {
        markFieldValid(input, fieldWrap);
      }
    });

    return { valid: isValid, firstInvalid: firstInvalidField };
  }

  function markFieldInvalid(input, fieldWrap, message) {
    input.classList.add('field-invalid');
    input.classList.remove('field-valid');
    input.setAttribute('aria-invalid', 'true');

    if (fieldWrap) {
      let msgEl = fieldWrap.querySelector('.field-error-msg');
      if (!msgEl) {
        msgEl = document.createElement('span');
        msgEl.className = 'field-error-msg';
        fieldWrap.appendChild(msgEl);
      }
      msgEl.textContent = message;
      msgEl.classList.add('show');

      // Shake for tactile feedback
      fieldWrap.classList.remove('field-shake');
      // Force reflow so the animation can re-trigger on repeat errors
      void fieldWrap.offsetWidth;
      fieldWrap.classList.add('field-shake');
    }
  }

  function markFieldValid(input, fieldWrap) {
    input.classList.remove('field-invalid');
    input.classList.add('field-valid');
    input.removeAttribute('aria-invalid');

    if (fieldWrap) {
      const msgEl = fieldWrap.querySelector('.field-error-msg');
      if (msgEl) msgEl.classList.remove('show');
    }
  }

  /* ================================================================
     15. PREDICT FORM SUBMISSION + LOADING STATE
     Validates client-side, shows a loading spinner on submit, and
     lets the form POST to Flask normally (server renders the result
     via {{ prediction_text }} on reload). If validation fails, the
     submission is blocked and a toast + shake guide the user.
  ================================================================ */
  function initPredictForm() {
    const form = qs('#predictForm');
    const submitBtn = qs('#submitBtn');
    if (!form || !submitBtn) return;

    form.addEventListener('submit', (e) => {
      const { valid, firstInvalid } = validatePredictForm(form);

      if (!valid) {
        e.preventDefault();
        showToast('error', 'Please fix the highlighted fields before continuing.');
        if (firstInvalid) {
          firstInvalid.focus({ preventScroll: false });
          firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
      }

      // Valid — engage loading state. The browser will navigate away
      // on Flask's response, so no need to manually reset this.
      submitBtn.classList.add('loading');
      submitBtn.setAttribute('aria-busy', 'true');
      submitBtn.disabled = true;
    });
  }

  /* ================================================================
     16. TOAST NOTIFICATION SYSTEM
  ================================================================ */
  function getToastContainer() {
    let container = qs('#toastContainer');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toastContainer';
      container.setAttribute('aria-live', 'polite');
      document.body.appendChild(container);
    }
    return container;
  }

  const TOAST_ICONS = {
    success: '&#10003;', // check
    error: '&#33;',      // exclamation
    info: '&#8505;',     // info
  };

  function showToast(type, message, duration = 4500) {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Dismiss notification">&times;</button>
    `;
    container.appendChild(toast);

    // Trigger enter animation on next frame
    requestAnimationFrame(() => toast.classList.add('show'));

    const dismiss = () => {
      toast.classList.remove('show');
      toast.classList.add('hide');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    };

    // Auto-hide after `duration`
    const autoHideTimer = setTimeout(dismiss, duration);

    // Manual close
    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(autoHideTimer);
      dismiss();
    });
  }

  // Expose globally in case the Flask template wants to trigger a
  // toast directly (e.g. <script>showToast('success','...')</script>)
  window.showToast = showToast;

  /* ================================================================
     17. SUCCESS / ERROR MICRO-ANIMATIONS
     If the server rendered a prediction result (Jinja block present
     in the DOM), give it a success pop-in animation and fire a toast.
     If the page carries a Flask flash-style error, surface it as a
     toast + shake as well.
  ================================================================ */
  function scrollToResultIfPresent() {
    const result = qs('.result-card');
    if (result) {
      result.classList.add('success-pop');
      showToast('success', 'Prediction generated successfully.');
      window.addEventListener('load', () => {
        result.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    }

    // Optional hook: any element flagged with data-server-error will
    // trigger an error toast automatically (useful for Flask errors
    // rendered server-side, e.g. <div data-server-error="Message">).
    const serverError = qs('[data-server-error]');
    if (serverError) {
      const msg = serverError.getAttribute('data-server-error') || 'Something went wrong. Please try again.';
      showToast('error', msg);
    }
  }

  /* ================================================================
     18. FLOATING CARD IDLE ANIMATION (parallax on mouse move)
     Adds a very subtle tilt/parallax to glass cards as the cursor
     moves nearby — a signature premium-SaaS micro-interaction.
     Disabled on touch devices and respects reduced-motion.
  ================================================================ */
  function initFloatingCardParallax() {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = window.matchMedia('(hover: none)').matches;
    if (prefersReducedMotion || isTouchDevice) return;

    const cards = qsa('.predict-card, .feature-card, .stat-card');
    if (!cards.length) return;

    cards.forEach((card) => {
      const strength = 6; // max degrees of tilt — kept subtle on purpose

      const onMove = (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;

        card.style.transform =
          `perspective(800px) rotateX(${(-y * strength).toFixed(2)}deg) ` +
          `rotateY(${(x * strength).toFixed(2)}deg) translateZ(0)`;
      };

      const onLeave = () => {
        card.style.transform = 'perspective(800px) rotateX(0) rotateY(0) translateZ(0)';
      };

      card.addEventListener('mousemove', rafThrottle(onMove));
      card.addEventListener('mouseleave', onLeave);
    });
  }

  // Parallax is opt-in visually intensive — still initialize it as
  // part of the standard bootstrap sequence for a premium feel.
  document.addEventListener('DOMContentLoaded', initFloatingCardParallax);
})();