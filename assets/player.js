// Minimal fullscreen player. Configured from <body> data attributes:
//   data-type="audio" | "video"
//   data-src="a.mp3, b.mp3"        (one or more files, relative to the page)
//   data-poster="poster.jpg"       (video, optional)
//   data-captions="captions.vtt"   (video, optional)
(function () {
  const body = document.body;
  const type = body.dataset.type;
  const sources = (body.dataset.src || "").split(",").map((s) => s.trim()).filter(Boolean);
  body.classList.add(type);

  const PLAY = '<path class="icon-play" d="M38 30 L72 50 L38 70 Z" fill="currentColor"/>';
  const PAUSE =
    '<g class="icon-pause" fill="currentColor"><rect x="36" y="31" width="9" height="38"/><rect x="55" y="31" width="9" height="38"/></g>';

  const toggle = document.createElement("button");
  toggle.className = "toggle";
  toggle.setAttribute("aria-label", "Play / pause");

  let media;
  let ring;
  let dots = [];
  let index = 0;

  if (type === "video") {
    media = document.createElement("video");
    media.playsInline = true;
    media.preload = "metadata";
    if (body.dataset.poster) media.poster = body.dataset.poster;
    if (body.dataset.captions) {
      const track = document.createElement("track");
      track.kind = "captions";
      track.srclang = "en";
      track.src = body.dataset.captions;
      track.default = true;
      media.appendChild(track);
    }
    body.appendChild(media);
    toggle.innerHTML = '<svg viewBox="0 0 100 100">' + PLAY + PAUSE + "</svg>";
    body.appendChild(toggle);

    const bar = document.createElement("div");
    bar.className = "bar";
    const fill = document.createElement("span");
    bar.appendChild(fill);
    body.appendChild(bar);
    media.addEventListener("timeupdate", () => {
      fill.style.width = media.duration ? (media.currentTime / media.duration) * 100 + "%" : "0";
    });
    bar.addEventListener("click", (e) => {
      e.stopPropagation();
      if (media.duration) media.currentTime = (e.clientX / bar.clientWidth) * media.duration;
    });

    media.addEventListener("click", togglePlay);
    media.addEventListener("dblclick", fullscreen);
  } else {
    media = document.createElement("audio");
    media.preload = "metadata";
    body.appendChild(media);

    const R = 48;
    const C = 2 * Math.PI * R;
    toggle.innerHTML =
      '<svg viewBox="0 0 100 100">' +
      `<circle class="ring-bg" cx="50" cy="50" r="${R}" fill="none" stroke-width="1"/>` +
      `<circle class="ring" cx="50" cy="50" r="${R}" fill="none" stroke-width="1.5"` +
      ` stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 50 50)"/>` +
      '<g transform="translate(50 50) scale(.55) translate(-50 -50)">' + PLAY + PAUSE + "</g></svg>";
    body.appendChild(toggle);
    ring = toggle.querySelector(".ring");
    media.addEventListener("timeupdate", () => {
      const p = media.duration ? media.currentTime / media.duration : 0;
      ring.style.strokeDashoffset = C * (1 - p);
    });

    if (sources.length > 1) {
      const nav = document.createElement("nav");
      nav.className = "dots";
      sources.forEach((_, i) => {
        const b = document.createElement("button");
        b.setAttribute("aria-label", "Track " + (i + 1));
        b.addEventListener("click", () => load(i, true));
        nav.appendChild(b);
        dots.push(b);
      });
      body.appendChild(nav);
    }

    media.addEventListener("ended", () => {
      if (index < sources.length - 1) load(index + 1, true);
      else load(0, false);
    });
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    togglePlay();
  });

  media.addEventListener("play", () => body.classList.add("playing"));
  media.addEventListener("pause", () => body.classList.remove("playing"));
  media.addEventListener("error", () => body.classList.add("pending"));

  function load(i, autoplay) {
    index = i;
    body.classList.remove("pending");
    media.src = sources[i];
    dots.forEach((d, j) => d.classList.toggle("on", j === i));
    if (autoplay) media.play().catch(() => {});
  }

  function togglePlay() {
    if (media.paused) media.play().catch(() => {});
    else media.pause();
  }

  function fullscreen() {
    const el = document.documentElement;
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (media.webkitEnterFullscreen) media.webkitEnterFullscreen();
  }

  // Hide the cursor and video controls after a moment of inactivity.
  let idleTimer;
  function wake() {
    body.classList.remove("idle");
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => body.classList.add("idle"), 2500);
  }
  ["mousemove", "touchstart", "keydown"].forEach((ev) => window.addEventListener(ev, wake, { passive: true }));
  wake();

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "Enter") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "f") {
      fullscreen();
    } else if (e.key === "ArrowRight" && sources.length > 1) {
      load((index + 1) % sources.length, !media.paused);
    } else if (e.key === "ArrowLeft" && sources.length > 1) {
      load((index - 1 + sources.length) % sources.length, !media.paused);
    }
  });

  if (sources.length) load(0, false);
  else body.classList.add("pending");
})();
