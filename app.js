/**
 * preety-pie — Interactive Controller
 * Premium Media Container Interface & Native Dialog Management
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Element References ---
  const videoPlayerFrame = document.getElementById('videoPlayerFrame');
  const centerPlayBtn = document.getElementById('centerPlayBtn');
  const miniPlayBtn = document.getElementById('miniPlayBtn');
  const playerLoaderState = document.getElementById('playerLoaderState');
  const heavyFileModal = document.getElementById('heavyFileModal');
  const modalTryAgainBtn = document.getElementById('modalTryAgainBtn');
  const securityModal = document.getElementById('securityModal');
  const timelineBar = document.getElementById('timelineBar');
  const timelineTooltip = document.getElementById('timelineTooltip');
  const volumeBtn = document.getElementById('volumeBtn');
  const volumeSlider = document.querySelector('.volume-slider');
  const copyNameBtn = document.getElementById('copyNameBtn');
  const copyNameLabel = document.getElementById('copyNameLabel');
  const shareBtn = document.getElementById('shareBtn');
  const toastNotification = document.getElementById('toastNotification');
  const toastMessage = document.getElementById('toastMessage');
  const ambientMouseGlow = document.getElementById('ambientMouseGlow');

  let isLoading = false;
  let toastTimer = null;

  // Total stream duration in seconds: 3 hours 7 minutes = 11,220s
  const TOTAL_DURATION_SECONDS = 11220;

  // ==========================================================================
  // Core Feature: Loading Attempt & Error Modal Workflow
  // ==========================================================================

  /**
   * Triggers a realistic 1-second buffer allocation attempt before
   * displaying the device restriction modal dialog.
   */
  function triggerPlaybackAttempt() {
    if (isLoading) return;
    isLoading = true;

    // Switch player hub into loading state
    centerPlayBtn.style.display = 'none';
    playerLoaderState.classList.add('active');
    playerLoaderState.setAttribute('aria-hidden', 'false');

    // Simulate authentic network & hardware buffer allocation (~1050ms)
    setTimeout(() => {
      // Revert loading visual
      playerLoaderState.classList.remove('active');
      playerLoaderState.setAttribute('aria-hidden', 'true');
      centerPlayBtn.style.display = 'flex';
      isLoading = false;

      // Present the modal dialog
      if (heavyFileModal && typeof heavyFileModal.showModal === 'function') {
        heavyFileModal.showModal();
      }
    }, 1050);
  }

  // Bind video player frame click (whole player is interactive)
  if (videoPlayerFrame) {
    videoPlayerFrame.addEventListener('click', (e) => {
      // Don't re-trigger if clicking on volume slider input specifically
      if (e.target.closest('.volume-slider') || e.target.closest('.volume-group')) {
        return;
      }
      triggerPlaybackAttempt();
    });

    // Keyboard accessibility: Enter or Space on focused player triggers play
    videoPlayerFrame.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        triggerPlaybackAttempt();
      }
    });
  }

  // Bind center play button
  if (centerPlayBtn) {
    centerPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerPlaybackAttempt();
    });
  }

  // Bind mini play button in controls
  if (miniPlayBtn) {
    miniPlayBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerPlaybackAttempt();
    });
  }

  // Bind all generic player control buttons
  document.querySelectorAll('.js-player-action').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerPlaybackAttempt();
    });
  });

  // "Try again" action inside the error modal
  if (modalTryAgainBtn) {
    modalTryAgainBtn.addEventListener('click', () => {
      heavyFileModal.close();
      setTimeout(() => {
        triggerPlaybackAttempt();
      }, 250);
    });
  }

  // ==========================================================================
  // Modern Web Guidance: Native <dialog> Light-Dismiss & Hygiene
  // ==========================================================================

  const allModals = [heavyFileModal, securityModal].filter(Boolean);

  allModals.forEach((dialog) => {
    // Reset returnValue on close to avoid stale leakage
    dialog.addEventListener('close', () => {
      dialog.returnValue = '';
    });

    // Fallback for browsers that do not natively support closedby="any"
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      dialog.addEventListener('click', (event) => {
        if (event.target !== dialog) return;
        const rect = dialog.getBoundingClientRect();
        const isClickInside = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isClickInside) {
          dialog.close();
        }
      });
    }
  });

  // ==========================================================================
  // Timeline Scrubber & Tooltip Formatting
  // ==========================================================================

  function formatTime(totalSeconds) {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = Math.floor(totalSeconds % 60);

    const padM = String(mins).padStart(2, '0');
    const padS = String(secs).padStart(2, '0');

    if (hrs > 0) {
      return `${hrs}:${padM}:${padS}`;
    }
    return `${mins}:${padS}`;
  }

  if (timelineBar && timelineTooltip) {
    timelineBar.addEventListener('mousemove', (e) => {
      const rect = timelineBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      const hoverSeconds = Math.round(ratio * TOTAL_DURATION_SECONDS);

      timelineTooltip.textContent = formatTime(hoverSeconds);
      timelineTooltip.style.left = `${clickX}px`;
    });

    timelineBar.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerPlaybackAttempt();
    });
  }

  // ==========================================================================
  // Volume Toggle & Controls
  // ==========================================================================

  let isMuted = false;
  let previousVolume = 100;

  if (volumeBtn && volumeSlider) {
    const volHigh = volumeBtn.querySelector('.vol-icon-high');
    const volMuted = volumeBtn.querySelector('.vol-icon-muted');

    volumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      isMuted = !isMuted;
      if (isMuted) {
        previousVolume = volumeSlider.value;
        volumeSlider.value = 0;
        volHigh.style.display = 'none';
        volMuted.style.display = 'block';
        volumeBtn.setAttribute('aria-label', 'Unmute audio');
      } else {
        volumeSlider.value = previousVolume > 0 ? previousVolume : 100;
        volHigh.style.display = 'block';
        volMuted.style.display = 'none';
        volumeBtn.setAttribute('aria-label', `Mute audio (${volumeSlider.value}%)`);
      }
    });

    volumeSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      if (val === 0) {
        isMuted = true;
        volHigh.style.display = 'none';
        volMuted.style.display = 'block';
      } else {
        isMuted = false;
        volHigh.style.display = 'block';
        volMuted.style.display = 'none';
      }
      volumeBtn.setAttribute('aria-label', `Mute audio (${val}%)`);
    });

    volumeSlider.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }

  // ==========================================================================
  // Copy File Name & Micro-Toast Notification
  // ==========================================================================

  function showToast(message) {
    if (!toastNotification) return;
    toastMessage.textContent = message;
    toastNotification.classList.add('visible');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('visible');
    }, 2800);
  }

  if (copyNameBtn) {
    copyNameBtn.addEventListener('click', async () => {
      const fileName = 'preety-pie.mp4';
      try {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          await navigator.clipboard.writeText(fileName);
        }
        copyNameLabel.textContent = 'Copied!';
        showToast('File name copied to clipboard');
        setTimeout(() => {
          copyNameLabel.textContent = 'Copy File Name';
        }, 2200);
      } catch (err) {
        showToast('Copied: preety-pie.mp4');
      }
    });
  }

  // Share button
  if (shareBtn) {
    shareBtn.addEventListener('click', async () => {
      const shareData = {
        title: 'preety-pie — HD · MP4 · 3:07:00',
        text: 'preety-pie (11.6 GB HD MP4 Master Archive Stream)',
        url: window.location.href,
      };

      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
        } catch (err) {
          // Share dismissed by user
        }
      } else {
        try {
          await navigator.clipboard.writeText(window.location.href);
          showToast('Stream URL copied to clipboard');
        } catch (err) {
          showToast('Link ready to share');
        }
      }
    });
  }

  // ==========================================================================
  // Navigation & Footer Informational Modals
  // ==========================================================================

  document.querySelectorAll('.js-open-security').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      if (securityModal && typeof securityModal.showModal === 'function') {
        securityModal.showModal();
      }
    });
  });

  document.querySelectorAll('.js-legal-link').forEach((el) => {
    el.addEventListener('click', (e) => {
      e.preventDefault();
      const title = el.getAttribute('data-title');
      const text = el.getAttribute('data-text');

      const secHeading = document.getElementById('secHeading');
      const secDesc = securityModal.querySelector('.modal-secondary-description');

      if (secHeading && secDesc && securityModal) {
        secHeading.textContent = title;
        secDesc.textContent = text;
        securityModal.showModal();
      }
    });
  });

  // ==========================================================================
  // Ambient Mouse Glow Interactive Tracking
  // ==========================================================================

  let glowTargetX = 0;
  let glowTargetY = 0;
  let glowCurrX = 0;
  let glowCurrY = 0;

  if (ambientMouseGlow) {
    window.addEventListener('mousemove', (e) => {
      const { clientX, clientY } = e;
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      glowTargetX = (clientX - centerX) * 0.12;
      glowTargetY = (clientY - centerY) * 0.12;
    });

    function animateGlow() {
      glowCurrX += (glowTargetX - glowCurrX) * 0.05;
      glowCurrY += (glowTargetY - glowCurrY) * 0.05;
      ambientMouseGlow.style.transform = `translate(calc(-50% + ${glowCurrX}px), calc(-50% + ${glowCurrY}px))`;
      requestAnimationFrame(animateGlow);
    }
    requestAnimationFrame(animateGlow);
  }
});
