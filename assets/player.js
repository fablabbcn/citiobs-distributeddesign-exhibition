// Minimal fullscreen player, built for touch tablets (Android Chrome) first.
// Configured from <body> data attributes:
//   data-type="audio" | "video"
//   data-src="a.mp3, b.mp3"     one or more files, relative to the page
//   data-poster="poster.jpg"    video, optional
(function () {
  "use strict";

  const body = document.body;
  const type = body.dataset.type === "video" ? "video" : "audio";
  const sources = (body.dataset.src || "").split(",").map((s) => s.trim()).filter(Boolean);
  body.classList.add(type);

  const IDLE_MS = 3000;
  const PLAY = '<path class="icon-play" d="M38 29 L73 50 L38 71 Z" fill="currentColor"/>';
  const PAUSE =
    '<g class="icon-pause" fill="currentColor"><rect x="35" y="30" width="10" height="40" rx="1"/><rect x="55" y="30" width="10" height="40" rx="1"/></g>';

  // ---------- elements ----------

  const media = document.createElement(type);
  media.preload = "metadata";
  media.setAttribute("playsinline", "");
  media.setAttribute("controlslist", "nodownload noplaybackrate");
  media.setAttribute("disableremoteplayback", "");
  if (type === "video") {
    media.setAttribute("disablepictureinpicture", "");
    if (body.dataset.poster) media.poster = body.dataset.poster;
  }
  body.appendChild(media);

  // Full-screen tap surface (sits above the video, below the controls).
  const surface = document.createElement("div");
  surface.className = "surface";
  body.appendChild(surface);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "toggle";
  body.appendChild(toggle);

  let ring = null;
  let fill = null;
  const RING_C = 2 * Math.PI * 48;

  if (type === "video") {
    toggle.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + PLAY + PAUSE + "</svg>";

    const bar = document.createElement("div");
    bar.className = "bar";
    bar.setAttribute("role", "slider");
    bar.setAttribute("aria-label", "Seek");
    bar.tabIndex = -1;
    fill = document.createElement("span");
    bar.appendChild(fill);
    body.appendChild(bar);
    setupScrub(bar);

    // Loop: on by default, a small corner toggle turns it off (remembered in a cookie).
    const loopBtn = document.createElement("button");
    loopBtn.type = "button";
    loopBtn.className = "loop";
    loopBtn.setAttribute("aria-label", "Loop");
    loopBtn.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.5"' +
      ' stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M17 2l3 3-3 3"/><path d="M4 11V9a4 4 0 0 1 4-4h12"/>' +
      '<path d="M7 22l-3-3 3-3"/><path d="M20 13v2a4 4 0 0 1-4 4H4"/></svg>';
    body.appendChild(loopBtn);
    const setLoop = (on) => {
      media.loop = on;
      body.classList.toggle("no-loop", !on);
      loopBtn.setAttribute("aria-pressed", String(on));
    };
    setLoop(getCookie("loop") !== "0");
    loopBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      setLoop(!media.loop);
      setCookie("loop", media.loop ? "1" : "0");
      wake();
    });
  } else {
    toggle.innerHTML =
      '<svg viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle class="ring-bg" cx="50" cy="50" r="48" fill="none" stroke-width="1"/>' +
      `<circle class="ring" cx="50" cy="50" r="48" fill="none" stroke-width="1.5" stroke-dasharray="${RING_C}"` +
      ` stroke-dashoffset="${RING_C}" transform="rotate(-90 50 50)"/>` +
      '<g transform="translate(50 50) scale(.55) translate(-50 -50)">' + PLAY + PAUSE + "</g></svg>";
    ring = toggle.querySelector(".ring");
  }

  const dots = [];
  if (sources.length > 1) {
    const nav = document.createElement("nav");
    nav.className = "dots";
    sources.forEach((_, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.setAttribute("aria-label", "Track " + (i + 1));
      b.addEventListener("click", (e) => {
        e.stopPropagation();
        load(i, true);
      });
      nav.appendChild(b);
      dots.push(b);
    });
    body.appendChild(nav);
  }

  // ---------- cookie (shared by every page of the site) ----------

  function sitePath() {
    // player.js lives in <site>/assets/, so the site root is two levels up from it.
    const src = document.currentScript ? document.currentScript.src : "";
    try {
      return new URL("..", new URL(".", src)).pathname;
    } catch (_) {
      return "/";
    }
  }
  const COOKIE_PATH = sitePath();
  function getCookie(name) {
    const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
    return m ? decodeURIComponent(m[1]) : null;
  }
  function setCookie(name, value) {
    document.cookie =
      `${name}=${encodeURIComponent(value)}; path=${COOKIE_PATH}; max-age=${60 * 60 * 24 * 365}; SameSite=Lax` +
      (location.protocol === "https:" ? "; Secure" : "");
  }

  // ---------- playback ----------

  let index = 0;

  function load(i, autoplay) {
    index = i;
    body.classList.remove("pending", "ended");
    media.src = sources[i];
    dots.forEach((d, j) => {
      d.classList.toggle("on", j === i);
      if (j === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });
    progress();
    if (autoplay) play();
  }

  function play() {
    enterFullscreen();
    const p = media.play();
    if (p && p.catch) p.catch(() => {});
  }

  function togglePlay() {
    if (body.classList.contains("pending")) return;
    if (media.paused || media.ended) play();
    else media.pause();
    wake();
  }

  function progress() {
    const p = media.duration ? Math.min(1, media.currentTime / media.duration) : 0;
    if (fill) fill.style.transform = `scaleX(${p})`;
    if (ring) ring.style.strokeDashoffset = RING_C * (1 - p);
  }

  media.addEventListener("timeupdate", progress);
  media.addEventListener("durationchange", progress);
  media.addEventListener("play", () => {
    body.classList.add("playing");
    body.classList.remove("ended");
    toggle.setAttribute("aria-label", "Pause");
    requestWakeLock();
    wake();
  });
  media.addEventListener("pause", () => {
    body.classList.remove("playing");
    toggle.setAttribute("aria-label", "Play");
    releaseWakeLock();
    wake();
  });
  media.addEventListener("waiting", () => body.classList.add("waiting"));
  ["playing", "canplay", "pause", "error"].forEach((ev) =>
    media.addEventListener(ev, () => body.classList.remove("waiting"))
  );
  media.addEventListener("error", () => body.classList.add("pending"));
  media.addEventListener("ended", () => {
    if (index < sources.length - 1) {
      load(index + 1, true);
    } else {
      body.classList.add("ended");
      if (sources.length > 1) load(0, false);
      else media.currentTime = 0;
      exitFullscreen();
    }
  });
  toggle.setAttribute("aria-label", "Play");

  // ---------- touch / pointer ----------

  // Remember whether the controls were hidden at the moment the finger went down,
  // so the first tap on a playing video only reveals the controls.
  let wasIdle = false;
  window.addEventListener(
    "pointerdown",
    () => {
      wasIdle = body.classList.contains("idle");
      wake();
    },
    { capture: true, passive: true }
  );
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType === "mouse") wake();
  }, { passive: true });

  surface.addEventListener("click", () => {
    if (type === "video" && wasIdle && !media.paused) return; // just show controls
    togglePlay();
  });
  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  // No long-press menus, image/video save sheets or accidental zoom.
  document.addEventListener("contextmenu", (e) => e.preventDefault());
  document.addEventListener("dblclick", (e) => e.preventDefault());
  document.addEventListener("gesturestart", (e) => e.preventDefault());

  function setupScrub(bar) {
    let dragging = false;
    let resume = false;
    const seekTo = (x) => {
      if (!media.duration) return;
      const r = bar.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (x - r.left) / r.width));
      media.currentTime = p * media.duration;
      progress();
    };
    bar.addEventListener("pointerdown", (e) => {
      e.stopPropagation();
      if (!media.duration) return;
      dragging = true;
      resume = !media.paused;
      try { bar.setPointerCapture(e.pointerId); } catch (_) {}
      body.classList.add("scrubbing");
      seekTo(e.clientX);
    });
    bar.addEventListener("pointermove", (e) => {
      if (dragging) {
        seekTo(e.clientX);
        wake();
      }
    });
    const end = (e) => {
      if (!dragging) return;
      dragging = false;
      body.classList.remove("scrubbing");
      try { bar.releasePointerCapture(e.pointerId); } catch (_) {}
      if (resume && media.paused) play();
    };
    bar.addEventListener("pointerup", end);
    bar.addEventListener("pointercancel", end);
    bar.addEventListener("click", (e) => e.stopPropagation());
  }

  // ---------- idle: hide cursor and video controls ----------

  let idleTimer;
  function wake() {
    body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => body.classList.add("idle"), IDLE_MS);
  }
  window.addEventListener("keydown", wake);
  wake();

  // ---------- fullscreen ----------

  function enterFullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement || !el.requestFullscreen) return;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return;
    el.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
  }
  function exitFullscreen() {
    if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen().catch(() => {});
  }

  // ---------- keep the screen awake while playing ----------

  let wakeLock = null;
  async function requestWakeLock() {
    try {
      if ("wakeLock" in navigator && !wakeLock) {
        wakeLock = await navigator.wakeLock.request("screen");
        wakeLock.addEventListener("release", () => (wakeLock = null));
      }
    } catch (_) {}
  }
  function releaseWakeLock() {
    if (wakeLock) wakeLock.release().catch(() => {});
    wakeLock = null;
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !media.paused) requestWakeLock();
  });

  // ---------- media session (lock screen / notification controls) ----------

  if ("mediaSession" in navigator) {
    try {
      navigator.mediaSession.metadata = new MediaMetadata({ title: document.title });
      navigator.mediaSession.setActionHandler("play", play);
      navigator.mediaSession.setActionHandler("pause", () => media.pause());
      if (sources.length > 1) {
        navigator.mediaSession.setActionHandler("nexttrack", () => load((index + 1) % sources.length, true));
        navigator.mediaSession.setActionHandler("previoustrack", () =>
          load((index - 1 + sources.length) % sources.length, true)
        );
      }
    } catch (_) {}
  }

  // ---------- keyboard ----------

  window.addEventListener("keydown", (e) => {
    // A focused button already handles Space/Enter itself.
    if ((e.code === "Space" || e.code === "Enter") && e.target.closest && e.target.closest("button")) return;
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "f") {
      if (document.fullscreenElement) exitFullscreen();
      else enterFullscreen();
    } else if (e.key === "ArrowRight") {
      if (sources.length > 1) load((index + 1) % sources.length, !media.paused);
      else if (media.duration) media.currentTime = Math.min(media.duration, media.currentTime + 5);
    } else if (e.key === "ArrowLeft") {
      if (sources.length > 1) load((index - 1 + sources.length) % sources.length, !media.paused);
      else media.currentTime = Math.max(0, media.currentTime - 5);
    }
  });

  if (sources.length) load(0, false);
  else body.classList.add("pending");
})();
