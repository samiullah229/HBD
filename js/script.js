/* ==========================================================================
   ALI'S BIRTHDAY WEBSITE  —  js/script.js
   --------------------------------------------------------------------------
   One JavaScript file shared by all six pages.
   Every page has <body data-page="...">, and this file reads that name to
   decide which part of the code to run.

   TABLE OF CONTENTS
     1.  SETTINGS YOU CAN EDIT (birthday date, music file...)
     2.  Small helper functions
     3.  Page-to-page navigation (with fade transition)
     4.  Visual effects (particles, stars, confetti, hearts, balloons)
     5.  Missing-photo fallbacks
     6.  Scroll animations
     7.  Page 1 — Landing page (birthday check)
     8.  Page 2 — Memories (lightbox, videos, music)
     9.  Page 3 — Gift surprise
     10. Page 4 — Birthday wishes
     11. Page 5 — Invitation
     12. Page 6 — Closing
     13. Start-up: runs the right code for the current page
   ========================================================================== */

(function () {
  "use strict"; // helps catch typing mistakes early


  /* ========================================================================
     1. SETTINGS YOU CAN EDIT
     ======================================================================== */
  const CONFIG = {
    // Ali's birthday. 20 November  ->  day 20, month 11.
    birthDay: 20,
    birthMonth: 11,

    // Birth YEAR:
    //   null  = any year is accepted (only day + month are checked)
    //   2001  = only that exact year is accepted  (replace with the real year)
    birthYear: 2010,

    // true  = Pages 2-6 send visitors back to Page 1 until they have entered
    //         the birthday (a fun reveal, NOT real security).
    // false = every page can be opened directly. Handy while you are editing!
    requireUnlock: true,

    // Background music for Page 2. Put your own MP3 here.
    // Music NEVER starts by itself — only when the visitor presses the button.
    musicFile: "assets/audio/birthday-music.mp3",

    // How long the fade-out lasts when moving between pages (milliseconds).
    pageFadeMs: 450
  };


  /* ========================================================================
     2. SMALL HELPER FUNCTIONS
     ======================================================================== */

  // Shortcuts: $("#id") finds one element, $$(".class") finds a list of them.
  const $  = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

  // Random number between min and max
  const rand = (min, max) => Math.random() * (max - min) + min;

  // Pick a random item from a list
  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  // Does the visitor prefer less motion? Is the screen small?
  const prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isSmallScreen =
    window.matchMedia && window.matchMedia("(max-width: 600px)").matches;

  // ---- Remembering that the birthday was entered (this tab only) ----
  // sessionStorage forgets everything when the tab is closed.
  // Nothing is ever sent anywhere.
  const UNLOCK_KEY = "aliBirthdayUnlocked";

  function storageWorks() {
    try {
      window.sessionStorage.setItem("__test", "1");
      window.sessionStorage.removeItem("__test");
      return true;
    } catch (error) {
      return false; // some browsers block storage
    }
  }
  function isUnlocked() {
    try { return window.sessionStorage.getItem(UNLOCK_KEY) === "yes"; }
    catch (error) { return false; }
  }
  function setUnlocked() {
    try { window.sessionStorage.setItem(UNLOCK_KEY, "yes"); } catch (error) { /* ignore */ }
  }
  function resetExperience() {
    try { window.sessionStorage.removeItem(UNLOCK_KEY); } catch (error) { /* ignore */ }
  }

  /*
    Should this page be allowed to open?
    - Page 1 is always allowed.
    - If the birthday was not entered yet, we go back to Page 1.
    - We skip the check when the files are opened by double-clicking
      (file://) because some browsers do not share storage between files.
      On GitHub Pages (https://) the check works normally.
  */
  function guardPage(pageName) {
    if (pageName === "landing") return true;
    if (!CONFIG.requireUnlock) return true;
    if (window.location.protocol === "file:") return true;
    if (!storageWorks()) return true;
    if (isUnlocked()) return true;

    window.location.replace("index.html");
    return false;
  }

  // A small message that pops up at the bottom of the screen
  let toastTimer = null;
  function showToast(message) {
    let toast = $("#toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 3600);
  }


  /* ========================================================================
     3. PAGE-TO-PAGE NAVIGATION
     Links with  data-nav  fade the page out, then open the next page.
     (Without JavaScript they still work as normal links.)
     ======================================================================== */
  let isNavigating = false;

  function goTo(url) {
    if (isNavigating) return;
    isNavigating = true;
    document.body.classList.add("page-leave"); // CSS fades the page out
    const wait = prefersReducedMotion ? 0 : CONFIG.pageFadeMs;
    setTimeout(() => { window.location.href = url; }, wait);
  }

  function setupNavigation() {
    $$("a[data-nav]").forEach((link) => {
      link.addEventListener("click", (event) => {
        // Let Ctrl/Cmd/Shift-click (open in new tab) behave normally
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
        event.preventDefault();

        // The "Replay" button on Page 6 also resets the experience
        if (link.hasAttribute("data-reset")) resetExperience();

        goTo(link.getAttribute("href"));
      });
    });

    // If the visitor uses the browser's Back button, make the page visible again
    window.addEventListener("pageshow", (event) => {
      if (event.persisted) {
        document.body.classList.remove("page-leave");
        isNavigating = false;
      }
    });
  }


  /* ========================================================================
     4. VISUAL EFFECTS
     All effects are drawn inside two see-through layers that never block clicks.
     ======================================================================== */

  // Find (or create) a full-screen effects layer
  function getLayer(id) {
    let layer = document.getElementById(id);
    if (!layer) {
      layer = document.createElement("div");
      layer.id = id;
      layer.setAttribute("aria-hidden", "true");
      document.body.appendChild(layer);
    }
    return layer;
  }

  // Floating emoji that drift upward forever (hearts, sparkles, stars...)
  function startFloatingParticles(symbols, count) {
    if (prefersReducedMotion) return;
    const layer = getLayer("fx-layer");
    const total = isSmallScreen ? Math.round(count * 0.6) : count;

    for (let i = 0; i < total; i++) {
      const particle = document.createElement("span");
      particle.className = "particle";
      particle.textContent = pick(symbols);
      particle.style.left = rand(0, 100) + "%";
      particle.style.fontSize = rand(0.8, 1.8) + "rem";
      particle.style.setProperty("--dur", rand(9, 19) + "s");
      particle.style.setProperty("--delay", "-" + rand(0, 19) + "s"); // negative = already mid-flight
      particle.style.setProperty("--sway", rand(-50, 50) + "px");
      layer.appendChild(particle);
    }
  }

  // Twinkling stars scattered across the screen
  function createStars(count) {
    if (prefersReducedMotion) return;
    const layer = getLayer("fx-layer");
    const total = isSmallScreen ? Math.round(count * 0.6) : count;

    for (let i = 0; i < total; i++) {
      const star = document.createElement("span");
      star.className = "star";
      star.style.left = rand(0, 100) + "%";
      star.style.top = rand(0, 100) + "%";
      star.style.setProperty("--size", rand(2, 4.5) + "px");
      star.style.setProperty("--dur", rand(2, 5) + "s");
      star.style.setProperty("--delay", "-" + rand(0, 5) + "s");
      layer.appendChild(star);
    }
  }

  // Colourful balloons floating up
  function createBalloons(count) {
    if (prefersReducedMotion) return;
    const layer = getLayer("fx-layer");
    const colors = ["#f472b6", "#8b5cf6", "#38bdf8", "#fbbf24", "#fb7185", "#a78bfa"];
    const total = isSmallScreen ? Math.round(count * 0.6) : count;

    for (let i = 0; i < total; i++) {
      const balloon = document.createElement("span");
      balloon.className = "balloon";
      balloon.style.left = rand(2, 94) + "%";
      balloon.style.setProperty("--w", rand(36, 58) + "px");
      balloon.style.setProperty("--c", pick(colors));
      balloon.style.setProperty("--dur", rand(14, 24) + "s");
      balloon.style.setProperty("--delay", "-" + rand(0, 24) + "s");
      balloon.style.setProperty("--sway", rand(-40, 40) + "px");
      layer.appendChild(balloon);
    }
  }

  // A burst of confetti falling from the top
  function launchConfetti(count) {
    const layer = getLayer("confetti-layer");
    const colors = ["#f472b6", "#ec4899", "#8b5cf6", "#c4b5fd", "#f9d27d", "#38bdf8", "#ffffff"];
    // Fewer pieces for people who prefer less motion
    const total = prefersReducedMotion ? Math.min(count, 20) : count;

    for (let i = 0; i < total; i++) {
      const piece = document.createElement("span");
      piece.className = "confetti";
      piece.style.left = rand(0, 100) + "vw";
      piece.style.width = rand(6, 12) + "px";
      piece.style.height = rand(8, 16) + "px";
      piece.style.backgroundColor = pick(colors);
      piece.style.borderRadius = Math.random() > 0.6 ? "50%" : "2px";
      piece.style.setProperty("--dur", rand(2.6, 4.8) + "s");
      piece.style.setProperty("--delay", rand(0, 0.9) + "s");
      piece.style.setProperty("--drift", rand(-160, 160) + "px");
      piece.style.setProperty("--rot", rand(360, 1080) + "deg");
      // Remove each piece once it has finished falling (keeps the page fast)
      piece.addEventListener("animationend", () => piece.remove());
      layer.appendChild(piece);
    }
  }

  // Hearts that float up from the bottom of the screen
  function launchHearts(count) {
    const layer = getLayer("confetti-layer");
    const hearts = ["❤️", "💖", "💕", "💗", "💜"];
    const total = prefersReducedMotion ? Math.min(count, 6) : count;

    for (let i = 0; i < total; i++) {
      const heart = document.createElement("span");
      heart.className = "rise-heart";
      heart.textContent = pick(hearts);
      heart.style.left = rand(3, 95) + "vw";
      heart.style.fontSize = rand(1.2, 2.6) + "rem";
      heart.style.setProperty("--dur", rand(3.2, 5.5) + "s");
      heart.style.setProperty("--delay", rand(0, 1.5) + "s");
      heart.style.setProperty("--sway", rand(-70, 70) + "px");
      heart.addEventListener("animationend", () => heart.remove());
      layer.appendChild(heart);
    }
  }

  // A few pieces of confetti every few seconds (for a gentle, subtle effect)
  function startGentleConfetti(piecesPerBurst) {
    if (prefersReducedMotion) return;
    setInterval(() => {
      if (!document.hidden) launchConfetti(piecesPerBurst); // pause when the tab is hidden
    }, 4500);
  }


  /* ========================================================================
     5. MISSING-PHOTO FALLBACKS
     If a photo file is missing, show a pretty placeholder instead of a
     broken-image icon. Add  data-fallback="text"  to any <img> to use this.
     ======================================================================== */
  function placeholderImage(label) {
    const svg =
      "<svg xmlns='http://www.w3.org/2000/svg' width='800' height='1000' viewBox='0 0 800 1000'>" +
      "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>" +
      "<stop offset='0' stop-color='#1e1b6b'/><stop offset='0.55' stop-color='#6d28d9'/>" +
      "<stop offset='1' stop-color='#ec4899'/></linearGradient></defs>" +
      "<rect width='800' height='1000' fill='url(#g)'/>" +
      "<text x='400' y='470' font-size='120' text-anchor='middle'>📷</text>" +
      "<text x='400' y='580' font-family='Georgia,serif' font-size='38' fill='white' text-anchor='middle'>" +
      label + "</text></svg>";
    return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
  }

  function setupImageFallbacks() {
    $$("img[data-fallback]").forEach((img) => {
      const useFallback = () => {
        if (img.dataset.failed) return; // only once, to avoid loops
        img.dataset.failed = "1";
        img.src = placeholderImage(img.dataset.fallback || "Add your photo");
        img.classList.add("is-placeholder");
      };
      img.addEventListener("error", useFallback);
      // The image may have already failed before this code ran:
      if (img.complete && img.naturalWidth === 0 && img.getAttribute("src")) useFallback();
    });
  }


  /* ========================================================================
     6. SCROLL ANIMATIONS
     Elements with class "reveal" fade in when they scroll into view.
     ======================================================================== */
  function setupScrollReveal() {
    const items = $$(".reveal");
    if (!items.length) return;

    // Very old browsers: just show everything
    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("in-view"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target); // animate only once
          }
        });
      },
      { threshold: 0.12 }
    );
    items.forEach((item) => observer.observe(item));
  }


  /* ========================================================================
     7. PAGE 1 — LANDING PAGE
     ======================================================================== */

  /*
    Turns the typed/picked date into numbers.
    Understands:  2001-11-20   (what the date picker gives)
                  20/11/2001   20-11-2001   20.11.2001
    Returns { day, month, year } or null if it does not look like a date.
  */
  function parseDate(text) {
    text = (text || "").trim();

    let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);          // YYYY-MM-DD
    if (match) return { year: +match[1], month: +match[2], day: +match[3] };

    match = text.match(/^(\d{1,2})[\/.\-](\d{1,2})[\/.\-](\d{4})$/);  // DD/MM/YYYY
    if (match) return { year: +match[3], month: +match[2], day: +match[1] };

    return null;
  }

  // Is this Ali's birthday?
  function isAliBirthday(date) {
    if (!date) return false;
    if (date.day !== CONFIG.birthDay) return false;
    if (date.month !== CONFIG.birthMonth) return false;
    if (CONFIG.birthYear !== null && date.year !== CONFIG.birthYear) return false;
    return true;
  }

  function initLanding() {
    startFloatingParticles(["✨", "💖", "⭐", "✦", "💜"], 24);
    createStars(30);

    const form = $("#unlock-form");
    const input = $("#birthday-input");
    const message = $("#form-message");
    const button = $("#unlock-btn");
    const overlay = $("#unlock-overlay");
    if (!form || !input) return;

    // Show a friendly message under the input
    function say(text) { message.textContent = text; }

    form.addEventListener("submit", (event) => {
      event.preventDefault(); // stop the page from reloading

      // 1) Nothing entered yet
      if (!input.value.trim()) {
        say("Please pick your birthday first 😊");
        input.focus();
        return;
      }

      // 2) Wrong date -> gentle message + little shake
      if (!isAliBirthday(parseDate(input.value))) {
        say("Hmm, that doesn't look quite right 🤔 Try again — you should know your own birthday! 😄");
        form.classList.remove("shake");
        void form.offsetWidth; // restarts the shake animation
        form.classList.add("shake");
        return;
      }

      // 3) Correct! Celebrate, remember it, then go to Page 2
      say("");
      button.disabled = true;
      setUnlocked();
      overlay.hidden = false;
      launchConfetti(170);
      launchHearts(18);
      setTimeout(() => goTo("memories.html"), prefersReducedMotion ? 600 : 2400);
    });
  }


  /* ========================================================================
     8. PAGE 2 — MEMORIES
     ======================================================================== */

  // ---------- Music ----------
  let music = null;      // the audio object (created on first click)
  let musicOn = false;

  function pauseMusic() {
    if (music && musicOn) {
      music.pause();
      musicOn = false;
      updateMusicButton();
    }
  }

  function updateMusicButton() {
    const button = $("#music-btn");
    if (!button) return;
    button.setAttribute("aria-pressed", String(musicOn));
    $(".music-label", button).textContent = musicOn ? "Music: On" : "Music: Off";
  }

  function initMusic() {
    const button = $("#music-btn");
    const volume = $("#music-volume");
    if (!button) return;

    button.addEventListener("click", () => {
      // Create the audio only when the visitor asks for it (no autoplay!)
      if (!music) {
        music = new Audio(CONFIG.musicFile);
        music.loop = true;
        music.volume = volume ? volume.value / 100 : 0.5;
        music.addEventListener("error", () => {
          musicOn = false;
          updateMusicButton();
          showToast("Add your song at " + CONFIG.musicFile + " 🎵");
        });
      }

      if (musicOn) {
        music.pause();
        musicOn = false;
      } else {
        musicOn = true;
        const attempt = music.play();
        if (attempt && attempt.catch) {
          attempt.catch(() => { musicOn = false; updateMusicButton(); });
        }
      }
      updateMusicButton();
    });

    if (volume) {
      volume.addEventListener("input", () => {
        if (music) music.volume = volume.value / 100;
      });
    }
  }

  // ---------- Video cards ----------
  function initVideos() {
    $$(".video-wrap").forEach((wrap) => {
      const video = $("video", wrap);
      const playButton = $(".play-btn", wrap);
      if (!video || !playButton) return;

      // If the video file is missing, show the "add your clip" message
      const markMissing = () => wrap.classList.add("is-missing");
      video.addEventListener("error", markMissing);
      const source = $("source", video);
      if (source) source.addEventListener("error", markMissing);
      // (networkState 3 = "no usable source found")
      window.addEventListener("load", () => {
        if (video.networkState === 3) markMissing();
      });

      // Custom play button
      playButton.addEventListener("click", () => {
        if (video.networkState === 3) { markMissing(); return; }

        // Only one video plays at a time
        $$("video").forEach((other) => { if (other !== video) other.pause(); });

        video.setAttribute("controls", ""); // show normal controls once playing
        const attempt = video.play();
        if (attempt && attempt.catch) attempt.catch(() => { /* ignore */ });
      });

      video.addEventListener("play", () => {
        wrap.classList.add("playing");
        pauseMusic(); // stop the music so the video's sound is clear
      });
      video.addEventListener("pause", () => wrap.classList.remove("playing"));
      video.addEventListener("ended", () => wrap.classList.remove("playing"));
    });
  }

  // ---------- Lightbox (full-screen photo viewer) ----------
  function initLightbox() {
    const triggers = $$(".photo-btn");
    if (!triggers.length) return;

    // Build the viewer once and keep it hidden until needed
    const box = document.createElement("div");
    box.className = "lightbox";
    box.hidden = true;
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-modal", "true");
    box.setAttribute("aria-label", "Photo viewer");
    box.innerHTML =
      '<button type="button" class="lb-btn lb-close" aria-label="Close photo viewer">✕</button>' +
      '<button type="button" class="lb-btn lb-prev" aria-label="Previous photo">‹</button>' +
      '<figure class="lb-figure"><img class="lb-img" alt=""><figcaption class="lb-caption"></figcaption></figure>' +
      '<button type="button" class="lb-btn lb-next" aria-label="Next photo">›</button>';
    document.body.appendChild(box);

    const bigImage = $(".lb-img", box);
    const caption = $(".lb-caption", box);
    const closeBtn = $(".lb-close", box);
    let current = 0;
    let lastFocused = null;

    // Show photo number "index"
    function show(index) {
      current = (index + triggers.length) % triggers.length; // wraps around
      const trigger = triggers[current];
      const img = $("img", trigger);
      const figure = trigger.closest("figure");
      const text = figure ? $("figcaption", figure) : null;

      bigImage.src = img.currentSrc || img.src;
      bigImage.alt = img.alt;
      caption.textContent = text ? text.textContent : "";
    }

    function open(index) {
      lastFocused = document.activeElement;
      show(index);
      box.hidden = false;
      document.body.style.overflow = "hidden"; // stop the page scrolling behind it
      closeBtn.focus();
    }

    function close() {
      box.hidden = true;
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    triggers.forEach((trigger, index) => trigger.addEventListener("click", () => open(index)));
    closeBtn.addEventListener("click", close);
    $(".lb-prev", box).addEventListener("click", () => show(current - 1));
    $(".lb-next", box).addEventListener("click", () => show(current + 1));

    // Clicking the dark background closes the viewer
    box.addEventListener("click", (event) => { if (event.target === box) close(); });

    // Keyboard: Esc closes, arrow keys change photo
    document.addEventListener("keydown", (event) => {
      if (box.hidden) return;
      if (event.key === "Escape") close();
      if (event.key === "ArrowLeft") show(current - 1);
      if (event.key === "ArrowRight") show(current + 1);
    });

    // Phone: swipe left/right to change photo
    let touchStartX = 0;
    box.addEventListener("touchstart", (event) => { touchStartX = event.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener("touchend", (event) => {
      const distance = event.changedTouches[0].clientX - touchStartX;
      if (Math.abs(distance) > 50) show(distance > 0 ? current - 1 : current + 1);
    }, { passive: true });
  }

  function initMemories() {
    startFloatingParticles(["✨", "💖", "⭐"], 16);
    initLightbox();
    initVideos();
    initMusic();
  }


  /* ========================================================================
     9. PAGE 3 — GIFT SURPRISE
     ======================================================================== */
  function initSurprise() {
    startFloatingParticles(["✨", "💜", "⭐"], 18);
    createStars(24);

    const gift = $("#gift");
    const openButton = $("#open-gift");
    const prompt = $("#gift-prompt");
    const reveal = $("#surprise-reveal");
    const continueWrap = $("#continue-wrap");
    if (!gift || !openButton) return;

    openButton.addEventListener("click", () => {
      openButton.disabled = true; // only once

      // Step 1: the box shakes
      gift.classList.add("shaking");

      // Step 2 (after 0.9s): lid flies off, light shines, confetti + hearts
      setTimeout(() => {
        gift.classList.remove("shaking");
        gift.classList.add("opened");
        launchConfetti(180);
        launchHearts(24);
      }, 900);

      // Step 3 (after 1.9s): the message appears
      setTimeout(() => {
        prompt.classList.add("fade-away");
        setTimeout(() => { prompt.hidden = true; }, 500);

        reveal.hidden = false;
        reveal.classList.add("show");
        reveal.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center"
        });
      }, 1900);

      // Step 4 (after 3.8s): the "Continue" button appears
      setTimeout(() => {
        continueWrap.hidden = false;
        continueWrap.classList.add("show");
        launchHearts(14);
      }, 3800);
    });
  }


  /* ========================================================================
     10. PAGE 4 — BIRTHDAY WISHES
     ======================================================================== */
  function initWishes() {
    startFloatingParticles(["✨", "⭐", "💫"], 14);
    createStars(34);
    createBalloons(9);
    startGentleConfetti(10);

    // Tap the cake: blow out / relight the candles
    const cake = $("#cake");
    if (cake) {
      cake.addEventListener("click", () => {
        const blown = cake.classList.toggle("blown");
        cake.setAttribute("aria-pressed", String(blown));
        if (blown) {
          launchConfetti(90);
          showToast("Make a wish, Ali! 🌟");
        } else {
          showToast("The candles are lit again 🕯️");
        }
      });
    }
  }


  /* ========================================================================
     11. PAGE 5 — INVITATION
     ======================================================================== */
  function initInvitation() {
    startFloatingParticles(["✨", "🎈", "🎉", "⭐"], 16);
    createStars(24);

    const celebrateButton = $("#celebrate-btn");
    const celebration = $("#celebration");
    const nextWrap = $("#next-wrap");
    const printButton = $("#print-btn");

    // "Celebrate With Me" reveals the final greeting + confetti.
    // (Nothing is sent to anyone — it is just a celebration animation.)
    if (celebrateButton && celebration) {
      celebrateButton.addEventListener("click", () => {
        celebration.hidden = false;
        celebration.classList.add("show");
        celebration.scrollIntoView({
          behavior: prefersReducedMotion ? "auto" : "smooth",
          block: "center"
        });
        launchConfetti(200);
        launchHearts(20);

        celebrateButton.disabled = true;
        if (nextWrap) { nextWrap.hidden = false; nextWrap.classList.add("show"); }
      });
    }

    // Opens the browser's print dialog (you can also choose "Save as PDF")
    if (printButton) {
      printButton.addEventListener("click", () => window.print());
    }
  }


  /* ========================================================================
     12. PAGE 6 — CLOSING
     ======================================================================== */
  function initClosing() {
    startFloatingParticles(["💖", "✨", "⭐", "💜", "❤️"], 26);
    createStars(40);
    startGentleConfetti(8);
    launchHearts(10); // a little welcome burst
  }


  /* ========================================================================
     13. START-UP
     Finds out which page we are on and runs that page's code.
     ======================================================================== */
  function start() {
    const page = document.body.dataset.page;

    // Pages 2-6: go back to Page 1 if the birthday was not entered yet
    if (!guardPage(page)) return;

    setupNavigation();
    setupImageFallbacks();
    setupScrollReveal();

    const pages = {
      landing: initLanding,
      memories: initMemories,
      surprise: initSurprise,
      wishes: initWishes,
      invitation: initInvitation,
      closing: initClosing
    };
    if (pages[page]) pages[page]();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
