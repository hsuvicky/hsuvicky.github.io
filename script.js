const root = document.documentElement;
const themeToggle = document.querySelector(".theme-toggle");
const themeColor = document.querySelector("#theme-color");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const homeLink = document.querySelector('.nav-links a[href="/"]');
const isHomePage = Boolean(document.querySelector("[data-career-timeline]"));
const sectionLinks = [...document.querySelectorAll('.nav-links a[href^="#"]')];
const sections = sectionLinks
  .map((link) => document.querySelector(link.getAttribute("href")))
  .filter(Boolean);
const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

function getSavedTheme() {
  try {
    return localStorage.getItem("theme");
  } catch {
    return null;
  }
}

function applyTheme(theme, persist = false) {
  const isDark = theme === "dark";
  root.dataset.theme = isDark ? "dark" : "light";
  themeToggle?.setAttribute("aria-pressed", String(isDark));
  themeToggle?.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} theme`);
  themeColor?.setAttribute("content", isDark ? "#0f1720" : "#f2f0ef");

  if (persist) {
    try {
      localStorage.setItem("theme", isDark ? "dark" : "light");
    } catch {
      // The selected theme still applies for this visit if storage is unavailable.
    }
  }
}

applyTheme(root.dataset.theme || (colorScheme.matches ? "dark" : "light"));

themeToggle?.addEventListener("click", () => {
  applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
});

colorScheme.addEventListener("change", (event) => {
  if (!getSavedTheme()) {
    applyTheme(event.matches ? "dark" : "light");
  }
});

function setMenu(open) {
  if (!navToggle || !navLinks) return;
  navToggle.setAttribute("aria-expanded", String(open));
  navLinks.dataset.open = String(open);
  navToggle.querySelector(".nav-toggle-label").textContent = open ? "Close" : "Menu";
}

navToggle?.addEventListener("click", () => {
  setMenu(navToggle.getAttribute("aria-expanded") !== "true");
});

navLinks?.addEventListener("click", (event) => {
  if (event.target.closest("a")) setMenu(false);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && navToggle?.getAttribute("aria-expanded") === "true") {
    setMenu(false);
    navToggle.focus();
  }
});

window.addEventListener("resize", () => {
  if (window.innerWidth > 760) setMenu(false);
});

function markActiveSection(id) {
  homeLink?.removeAttribute("aria-current");

  sectionLinks.forEach((link) => {
    const active = link.getAttribute("href") === `#${id}`;
    if (active) {
      link.setAttribute("aria-current", "location");
    } else {
      link.removeAttribute("aria-current");
    }
  });
}

function markHomeActive() {
  if (!isHomePage) return;
  sectionLinks.forEach((link) => link.removeAttribute("aria-current"));
  homeLink?.setAttribute("aria-current", "page");
}

let activeSectionFrame;

function updateActiveSection() {
  const marker = window.innerHeight * 0.38;
  let current;

  sections.forEach((section) => {
    if (section.getBoundingClientRect().top <= marker) current = section;
  });

  if (current) {
    markActiveSection(current.id);
  } else {
    markHomeActive();
  }
}

function requestActiveSectionUpdate() {
  if (activeSectionFrame) return;
  activeSectionFrame = requestAnimationFrame(() => {
    updateActiveSection();
    activeSectionFrame = null;
  });
}

window.addEventListener("scroll", requestActiveSectionUpdate, { passive: true });
window.addEventListener("resize", requestActiveSectionUpdate);

window.addEventListener("hashchange", () => {
  const id = window.location.hash.slice(1);
  if (sections.some((section) => section.id === id)) markActiveSection(id);
});

const initialSection = window.location.hash.slice(1);
if (sections.some((section) => section.id === initialSection)) {
  markActiveSection(initialSection);
} else {
  updateActiveSection();
}

function setupScrollReveals() {
  if (reducedMotion.matches || !("IntersectionObserver" in window)) return;

  const revealGroups = [
    [".section-heading", 0],
    [".case-study", 0],
    [".enterprise-folio > *", 55],
    [".field-note", 55],
  ];
  const revealTargets = [];

  revealGroups.forEach(([selector, stagger]) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add("reveal-item");
      element.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * stagger}ms`);
      revealTargets.push(element);
    });
  });

  if (!revealTargets.length) return;

  let lastScrollPosition = window.scrollY;
  let scrollDirection = "down";

  window.addEventListener(
    "scroll",
    () => {
      const nextScrollPosition = window.scrollY;
      if (Math.abs(nextScrollPosition - lastScrollPosition) > 3) {
        scrollDirection = nextScrollPosition > lastScrollPosition ? "down" : "up";
        lastScrollPosition = nextScrollPosition;
      }
    },
    { passive: true },
  );

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.dataset.revealFrom = scrollDirection === "down" ? "top" : "bottom";
          requestAnimationFrame(() => entry.target.classList.add("is-revealed"));
          return;
        }

        if (
          entry.boundingClientRect.bottom <= 0 ||
          entry.boundingClientRect.top >= window.innerHeight
        ) {
          entry.target.classList.remove("is-revealed");
        }
      });
    },
    {
      rootMargin: "0px 0px -9% 0px",
      threshold: 0.08,
    },
  );

  document.documentElement.classList.add("reveal-ready");
  revealTargets.forEach((element) => observer.observe(element));
}

setupScrollReveals();

function setupCareerTimeline() {
  const timeline = document.querySelector("[data-career-timeline]");
  const viewport = timeline?.querySelector("[data-timeline-viewport]");
  const hobbiesToggle = document.querySelector("[data-timeline-hobbies-toggle]");
  const hobbyContents = timeline ? [...timeline.querySelectorAll("[data-hobby-content]")] : [];
  const cards = viewport ? [...viewport.querySelectorAll(".progression-rail > li")] : [];

  if (!viewport || !cards.length) return;

  let fadeFrame;
  let autoScrollFrame;
  let autoScrolling = false;
  let dragging = false;
  let dragStartX = 0;
  let dragStartScroll = 0;

  function stopAutoScroll() {
    autoScrolling = false;
    if (autoScrollFrame) cancelAnimationFrame(autoScrollFrame);
    autoScrollFrame = null;
  }

  function updateCardFades() {
    const viewportRect = viewport.getBoundingClientRect();
    const labelsRect = timeline.querySelector(".timeline-labels")?.getBoundingClientRect();
    const fadeWidth = Math.min(210, Math.max(90, viewportRect.width * 0.18));
    const leftEdge = labelsRect ? labelsRect.right + 12 : viewportRect.left;
    const rightEdge = viewportRect.right - Math.min(40, viewportRect.width * 0.04);
    const atStart = viewport.scrollLeft <= 1;
    const atEnd = viewport.scrollLeft >= viewport.scrollWidth - viewport.clientWidth - 1;

    cards.forEach((card) => {
      const cardRect = card.getBoundingClientRect();
      const leftOpacity = atStart ? 1 : (cardRect.left - leftEdge) / fadeWidth;
      const rightOpacity = atEnd ? 1 : (rightEdge - cardRect.left) / fadeWidth;
      const opacity = Math.max(0, Math.min(1, leftOpacity, rightOpacity));
      card.style.opacity = reducedMotion.matches ? "1" : opacity.toFixed(3);
    });
  }

  function requestFadeUpdate() {
    if (fadeFrame) return;
    fadeFrame = requestAnimationFrame(() => {
      updateCardFades();
      fadeFrame = null;
    });
  }

  viewport.addEventListener("scroll", requestFadeUpdate, { passive: true });
  window.addEventListener("resize", () => {
    stopAutoScroll();
    requestFadeUpdate();
  });

  hobbiesToggle?.addEventListener("click", () => {
    stopAutoScroll();
    const showHobbies = timeline.dataset.hobbiesVisible !== "true";

    timeline.dataset.hobbiesVisible = String(showHobbies);
    hobbiesToggle.textContent = showHobbies ? "Hide hobbies" : "Show hobbies";
    hobbiesToggle.setAttribute("aria-expanded", String(showHobbies));
    hobbyContents.forEach((content) => content.setAttribute("aria-hidden", String(!showHobbies)));
    requestFadeUpdate();
  });

  viewport.addEventListener(
    "wheel",
    (event) => {
      stopAutoScroll();
      if (!event.shiftKey || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      event.preventDefault();
      viewport.scrollLeft += event.deltaY;
    },
    { passive: false },
  );

  viewport.addEventListener("pointerdown", (event) => {
    stopAutoScroll();
    if (event.pointerType === "touch") return;
    dragging = true;
    dragStartX = event.clientX;
    dragStartScroll = viewport.scrollLeft;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    viewport.scrollLeft = dragStartScroll - (event.clientX - dragStartX);
  });

  function stopDragging(event) {
    if (!dragging) return;
    dragging = false;
    if (viewport.hasPointerCapture(event.pointerId)) viewport.releasePointerCapture(event.pointerId);
  }

  viewport.addEventListener("pointerup", stopDragging);
  viewport.addEventListener("pointercancel", stopDragging);

  viewport.addEventListener("keydown", (event) => {
    stopAutoScroll();
    const distance = Math.max(180, viewport.clientWidth * 0.38);
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      viewport.scrollBy({
        left: event.key === "ArrowLeft" ? -distance : distance,
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      viewport.scrollTo({
        left: event.key === "Home" ? 0 : viewport.scrollWidth,
        behavior: reducedMotion.matches ? "auto" : "smooth",
      });
    }
  });

  function startTimelineIntro() {
    requestAnimationFrame(() => {
      const targetDistance = viewport.scrollWidth - viewport.clientWidth;
      viewport.scrollLeft = 0;
      updateCardFades();

      if (reducedMotion.matches || targetDistance <= 1) {
        viewport.scrollLeft = targetDistance;
        updateCardFades();
        return;
      }

      const duration = Math.min(4200, Math.max(3000, targetDistance * 1.8));
      let startTime;
      autoScrolling = true;

      function step(timestamp) {
        if (!autoScrolling) return;
        if (startTime === undefined) startTime = timestamp;

        const progress = Math.min(1, (timestamp - startTime) / duration);
        const acceleratedProgress = progress * progress;
        viewport.scrollLeft = targetDistance * acceleratedProgress;
        updateCardFades();

        if (progress < 1) {
          autoScrollFrame = requestAnimationFrame(step);
        } else {
          viewport.scrollLeft = targetDistance;
          autoScrolling = false;
          autoScrollFrame = null;
          updateCardFades();
        }
      }

      autoScrollFrame = requestAnimationFrame(step);
    });
  }

  startTimelineIntro();
}

setupCareerTimeline();
function setupBlobColony() {
  const colony = document.querySelector("[data-blob-colony]");
  if (!colony) return;

  const MAX_BLOBS = 5;
  const VB_W = 100;
  const VB_H = 50;
  const RX = 50;
  const RY = 50;
  const SEGMENTS = 72;
  const spring = reducedMotion.matches
    ? { stiffness: 1, damping: 1 }
    : { stiffness: 0.065, damping: 0.8 };

  const ARM_INTERVAL_MS = 60000;
  const ARM_WAVE_MS = reducedMotion.matches ? 80 : 1400;
  const ARM_TUCK_MS = reducedMotion.matches ? 80 : 480;
  const STARTLE_MS = reducedMotion.matches ? 40 : 520;
  const POP_MS = reducedMotion.matches ? 80 : 420;
  const GONE_MS = reducedMotion.matches ? 900 : 2600;
  const RISE_MS = reducedMotion.matches ? 80 : 1350;

  let pointerX = window.innerWidth * 0.5;
  let pointerY = window.innerHeight * 0.35;
  let resetting = false;
  let scareFocus = null;
  let scareUntil = 0;
  const instances = [];

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerpAngle(from, to, t) {
    let diff = to - from;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return from + diff * t;
  }

  function createBlobElement(sizeIndex) {
    const blob = document.createElement("button");
    blob.className = "blob";
    blob.type = "button";
    blob.dataset.blob = "";
    blob.dataset.size = String(sizeIndex);
    blob.dataset.state = "idle";
    blob.dataset.arm = "hidden";
    blob.setAttribute("aria-label", "Friendly blob. Click to pop.");
    blob.innerHTML = `
      <span class="blob-stage">
        <span class="blob-body" data-blob-body>
          <svg class="blob-svg" viewBox="0 0 100 50" preserveAspectRatio="none" aria-hidden="true">
            <path data-blob-path d="M0 50A50 50 0 0 1 100 50Z"></path>
          </svg>
          <span class="blob-eye blob-eye-l" data-blob-eye="l"></span>
          <span class="blob-eye blob-eye-r" data-blob-eye="r"></span>
          <span class="blob-squint" aria-hidden="true">
            <span class="blob-squint-l">&gt;</span>
            <span class="blob-squint-r">&lt;</span>
          </span>
          <svg class="blob-arm" viewBox="0 0 40 36" aria-hidden="true">
            <g class="blob-arm-wave">
              <!-- Upper arm: out and slightly down; elbow is the clear hinge. -->
              <line class="blob-arm-upper" x1="2" y1="14" x2="17" y2="20"></line>
              <circle class="blob-arm-elbow" cx="17" cy="20" r="1.35"></circle>
              <g transform="translate(17 20)">
                <g class="blob-arm-fore">
                  <!-- Forearm bent up from the elbow (~L wave). -->
                  <line x1="0" y1="0" x2="5" y2="-12"></line>
                  <g transform="translate(5 -12)">
                    <g class="blob-arm-hand">
                      <line x1="0" y1="0" x2="-5" y2="-4"></line>
                      <line x1="0" y1="0" x2="0" y2="-7"></line>
                      <line x1="0" y1="0" x2="5" y2="-3"></line>
                    </g>
                  </g>
                </g>
              </g>
            </g>
          </svg>
        </span>
        <span class="blob-pop-burst" aria-hidden="true">
          <span></span><span></span><span></span><span></span><span></span>
        </span>
      </span>
    `;
    return blob;
  }

  function createInstance(sizeIndex, { rising = false } = {}) {
    const blob = createBlobElement(sizeIndex);
    const body = blob.querySelector("[data-blob-body]");
    const path = blob.querySelector("[data-blob-path]");
    colony.appendChild(blob);

    let regenerateTimer = 0;
    let stateTimer = 0;
    let armTimer = 0;
    let armPhaseTimer = 0;
    let armState = "hidden";
    let squintOn = false;
    let frozenMorph = null;
    let spawnOnRise = false;
    const eyeSmooth = { lx: 32, ly: 26, rx: 68, ry: 26 };

    const morph = {
      squash: 0,
      dent: 0,
      contactAng: Math.PI / 2,
      vSquash: 0,
      vDent: 0,
      vContactAng: 0,
    };

    const inst = {
      blob,
      sizeIndex,
      get state() {
        return blob.dataset.state;
      },
      tick: null,
      destroy: null,
      requestPop: null,
      startRise: null,
      forcePop: null,
    };

    function setState(state) {
      blob.dataset.state = state;
    }

    function springTo(key, target) {
      const velocityKey = `v${key[0].toUpperCase()}${key.slice(1)}`;
      const force = (target - morph[key]) * spring.stiffness;
      morph[velocityKey] = (morph[velocityKey] + force) * spring.damping;
      morph[key] += morph[velocityKey];

      if (Math.abs(morph[velocityKey]) < 0.00035 && Math.abs(target - morph[key]) < 0.0007) {
        morph[key] = target;
        morph[velocityKey] = 0;
      }
    }

    function restPoint(theta) {
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      // A true half-ellipse gives the resting blob one continuous round contour.
      // The previous lower-side pull did not meet the forced endpoints smoothly,
      // which left a subtle kink near each foot.
      return {
        x: VB_W / 2 + RX * c,
        y: VB_H - RY * Math.max(s, 0),
        theta,
      };
    }

    function deformPoint(theta) {
      if (theta <= 0.001) return { x: VB_W, y: VB_H, theta: 0 };
      if (theta >= Math.PI - 0.001) return { x: 0, y: VB_H, theta: Math.PI };

      let { x, y } = restPoint(theta);
      const upper = Math.sin(theta);

      const squash = morph.squash;
      if (squash > 0.001) {
        const height = VB_H - y;
        y = VB_H - height * (1 - squash * 0.42);
        const bulge = 1 + squash * 0.18 * upper;
        x = VB_W / 2 + (x - VB_W / 2) * bulge;
      }

      const dent = morph.dent;
      if (dent > 0.001) {
        let dAng = theta - morph.contactAng;
        while (dAng > Math.PI) dAng -= Math.PI * 2;
        while (dAng < -Math.PI) dAng += Math.PI * 2;
        const falloff = Math.exp(-((dAng / 0.78) ** 2));
        const nx = VB_W / 2 - x;
        const ny = VB_H - y;
        const len = Math.hypot(nx, ny) || 1;
        // Fade deformation into the baseline so the feet retain their smooth
        // horizontal tangents instead of being flattened by a hard y clamp.
        const footFade = clamp((upper - 0.04) / 0.24, 0, 1);
        const smoothFootFade = footFade * footFade * (3 - 2 * footFade);
        const depth = dent * (15 - upper * 5) * falloff * smoothFootFade;
        x += (nx / len) * depth;
        y += (ny / len) * depth * (0.72 - upper * 0.18);
      }

      y = Math.min(y, VB_H);

      return { x, y, theta };
    }

    function eyePoint(theta, inset) {
      const surface = deformPoint(theta);
      const cx = VB_W / 2;
      const cy = VB_H;
      return {
        x: surface.x + (cx - surface.x) * inset,
        y: surface.y + (cy - surface.y) * inset,
        theta,
      };
    }

    // Eye oval half-size in viewBox units (center → rim). Keep whole eye inside fill.
    function eyeHalfSize() {
      const size = clamp(Number(blob.dataset.size) || 0, 0, 4);
      const blobW = [82, 64, 50, 38, 26][size];
      const blobH = [41, 32, 25, 19, 13][size];
      const wide = blob.dataset.scare === "true" || blob.dataset.state === "startled";
      const eyeW = (wide
        ? [9, 7.5, 6, 4.75, 3.5]
        : [5.5, 4.5, 3.75, 3, 2.25])[size];
      const eyeH = (wide
        ? [11, 9, 7.5, 6, 4.25]
        : [7, 5.5, 4.5, 3.75, 2.75])[size];
      return {
        halfW: (eyeW / blobW) * VB_W * 0.5,
        halfH: (eyeH / blobH) * VB_H * 0.5,
      };
    }

    /** Pull an eye center inward so its oval stays under the blob silhouette. */
    function containEye(x, y, halfW, halfH) {
      const cx = VB_W / 2;
      const cy = VB_H;
      let px = x;
      let py = y;
      // Iterate: radial clamp against current surface + top floor for oval height.
      for (let i = 0; i < 3; i += 1) {
        let ang = Math.atan2(cy - py, px - cx);
        ang = clamp(ang, 0.06, Math.PI - 0.06);
        const surface = deformPoint(ang);
        const sdx = surface.x - cx;
        const sdy = surface.y - cy;
        const slen = Math.hypot(sdx, sdy) || 1;
        const dx = px - cx;
        const dy = py - cy;
        const len = Math.hypot(dx, dy) || 1;
        // Padding along the ray ≈ oval radius in the outward direction + cushion.
        const ux = dx / len;
        const uy = dy / len;
        const rim = Math.hypot(ux * halfW, uy * halfH) + 1.8;
        const maxLen = Math.max(slen - rim, 4);
        if (len > maxLen) {
          px = cx + ux * maxLen;
          py = cy + uy * maxLen;
        }
        const apex = deformPoint(Math.PI / 2);
        const minY = apex.y + halfH + 2.2;
        if (py < minY) py = minY;
      }
      px = clamp(px, halfW + 4, VB_W - halfW - 4);
      py = clamp(py, halfH + 2, VB_H - halfH - 3);
      return { x: px, y: py };
    }

    function buildPath() {
      const pts = [];
      for (let i = 0; i <= SEGMENTS; i += 1) {
        const theta = Math.PI * (1 - i / SEGMENTS);
        pts.push(deformPoint(theta));
      }

      pts[0] = { x: 0, y: VB_H, theta: Math.PI };
      pts[pts.length - 1] = { x: VB_W, y: VB_H, theta: 0 };

      let d = `M${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
      for (let i = 0; i < pts.length - 1; i += 1) {
        const p1 = pts[i];
        const p2 = pts[i + 1];
        // Reflect the adjacent sample at each endpoint. This gives the first
        // and last cubic horizontal tangents whose lengths match the nearby
        // segments, while the Catmull-Rom conversion keeps every join smooth.
        const p0 = pts[i - 1] || {
          x: 2 * p1.x - p2.x,
          y: p2.y,
        };
        const p3 = pts[i + 2] || {
          x: 2 * p2.x - p1.x,
          y: p1.y,
        };
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
      }
      return `${d}Z`;
    }

    function morphTargets() {
      const rect = body.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) {
        return { squash: 0, dent: 0, contactAng: morph.contactAng };
      }

      const lx = (pointerX - rect.left) / rect.width;
      const ly = (pointerY - rect.top) / rect.height;
      const px = lx * VB_W;
      const py = ly * VB_H;

      if (lx < -0.7 || lx > 1.7 || ly < -0.9 || ly > 1.55) {
        return { squash: 0, dent: 0, contactAng: morph.contactAng };
      }

      let ang = Math.atan2(VB_H - py, px - VB_W / 2);
      ang = clamp(ang, 0.08, Math.PI - 0.08);

      const surface = restPoint(ang);
      const cursorR = Math.hypot(px - VB_W / 2, py - VB_H);
      const surfaceR = Math.hypot(surface.x - VB_W / 2, surface.y - VB_H);
      const outside = (cursorR - surfaceR) / RX;

      if (outside > 1.05) {
        return { squash: 0, dent: 0, contactAng: morph.contactAng };
      }

      const glancingCrown =
        Math.sin(ang) > 0.72 && ly < 0.16 && outside > -0.18;
      if (glancingCrown || ly < 0) {
        return { squash: 0, dent: 0, contactAng: morph.contactAng };
      }

      const approach = outside > 0 ? clamp(1 - outside / 1.05, 0, 1) : 1;
      const penetration = outside < 0 ? clamp(-outside, 0, 1.25) : 0;
      const pressure = clamp(approach * 0.48 + penetration * 1.05, 0, 1.3);
      const topness = Math.pow(Math.sin(ang), 1.25);

      return {
        squash: clamp(pressure * topness * 0.5, 0, 0.45),
        dent: clamp(pressure * 0.95, 0, 1),
        contactAng: ang,
      };
    }

    function placeEyes() {
      if (blob.dataset.state !== "idle") return;

      const rect = body.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      const scared = blob.dataset.scare === "true" && scareFocus;
      let localX = (pointerX - rect.left) / rect.width;
      let localY = (pointerY - rect.top) / rect.height;
      if (scared) {
        localX = (scareFocus.x - rect.left) / rect.width;
        localY = (scareFocus.y - rect.top) / rect.height;
      }

      const nearBlob =
        localX >= -0.15 &&
        localX <= 1.15 &&
        localY >= -0.85 &&
        localY <= 1.85;
      const cursorAbove = !scared && localY < 0.16;
      const cursorBelow = !scared && localY > 0.58;

      // Shallower inset so resting eyes sit higher in the face.
      const inset = clamp(0.28 + morph.squash * 0.06 + morph.dent * 0.08, 0.26, 0.44);
      const halfSep = 0.42;
      const socketL = eyePoint(Math.PI / 2 + halfSep, inset);
      const socketR = eyePoint(Math.PI / 2 - halfSep, inset);
      const socketY = (socketL.y + socketR.y) / 2;
      const socketMidX = (socketL.x + socketR.x) / 2;
      const apex = deformPoint(Math.PI / 2);

      const { halfW, halfH } = eyeHalfSize();
      const lookGain = scared || nearBlob || cursorAbove || cursorBelow ? 8.5 : 5;
      const lookX = clamp((localX - 0.5) * lookGain * 2, -7, 7);
      const lookYGain = cursorAbove ? 1.55 : cursorBelow ? 2.0 : 1.4;
      // Neutral gaze sits higher so “looking” doesn’t read as chin-level.
      let lookY = clamp((localY - 0.32) * lookGain * lookYGain, -10, 12);
      if (cursorAbove) {
        // Glance up, but never hard-yank toward/past the crown.
        const overhead = clamp(0.2 - localY, 0, 1.4);
        lookY = Math.min(lookY, -3.5 - overhead * 2.2);
      }
      if (cursorBelow) {
        const under = clamp(localY - 0.5, 0, 1.6);
        lookY = Math.max(lookY, 2 + under * 6);
      }
      if (scared) {
        lookY = clamp(lookY, -5, 6);
      }
      if (lookY < 0 && morph.squash > 0.08 && !cursorAbove && !scared) {
        lookY *= 1 - morph.squash * 1.2;
      }

      const minGap = cursorAbove ? 36 : 42;
      let centerX = socketMidX + lookX * (1 - morph.squash * 0.25);
      let eyeY = socketY + lookY - 1.2;

      // Keep eye *centers* below the crown by at least the oval radius (+ pad).
      const minEyeY = apex.y + halfH + 2.4;
      const maxEyeY = VB_H - (cursorBelow || lookY > 4 ? 14 : 16);
      centerX = clamp(centerX, 32, 68);
      eyeY = clamp(eyeY, minEyeY, maxEyeY);
      if (cursorAbove) {
        const crownTarget = apex.y + halfH + 3.6;
        eyeY += (crownTarget - eyeY) * clamp(0.22 - localY, 0.25, 0.65);
        eyeY = clamp(eyeY, minEyeY, maxEyeY);
      }
      if (cursorBelow) {
        const floorTarget = VB_H - 12;
        eyeY += (floorTarget - eyeY) * clamp(localY - 0.52, 0.25, 0.7);
        eyeY = clamp(eyeY, minEyeY, maxEyeY);
      }

      let leftX = centerX - minGap / 2;
      let rightX = centerX + minGap / 2;

      if (leftX < 16) {
        const shift = 16 - leftX;
        leftX += shift;
        rightX += shift;
      }
      if (rightX > 84) {
        const shift = rightX - 84;
        leftX -= shift;
        rightX -= shift;
      }
      if (rightX - leftX < minGap) {
        leftX = VB_W / 2 - minGap / 2;
        rightX = VB_W / 2 + minGap / 2;
      }

      // Hard silhouette containment — eyes must stay fully inside the blob.
      const left = containEye(leftX, eyeY, halfW, halfH);
      const right = containEye(rightX, eyeY, halfW, halfH);
      leftX = left.x;
      rightX = right.x;
      // Keep a shared horizontal glance line so they don’t stagger.
      eyeY = Math.max(left.y, right.y);
      const leftC = containEye(leftX, eyeY, halfW, halfH);
      const rightC = containEye(rightX, eyeY, halfW, halfH);
      leftX = leftC.x;
      rightX = rightC.x;
      eyeY = Math.max(leftC.y, rightC.y);

      const ease = reducedMotion.matches ? 1 : scared ? 0.28 : 0.16;
      eyeSmooth.lx += (leftX - eyeSmooth.lx) * ease;
      eyeSmooth.ly += (eyeY - eyeSmooth.ly) * ease;
      eyeSmooth.rx += (rightX - eyeSmooth.rx) * ease;
      eyeSmooth.ry += (eyeY - eyeSmooth.ry) * ease;

      // Re-contain after easing so lag can’t overshoot the silhouette.
      const smoothL = containEye(eyeSmooth.lx, eyeSmooth.ly, halfW, halfH);
      const smoothR = containEye(eyeSmooth.rx, eyeSmooth.ry, halfW, halfH);
      eyeSmooth.lx = smoothL.x;
      eyeSmooth.ly = smoothL.y;
      eyeSmooth.rx = smoothR.x;
      eyeSmooth.ry = smoothR.y;
      const sharedY = Math.max(eyeSmooth.ly, eyeSmooth.ry);
      eyeSmooth.ly = sharedY;
      eyeSmooth.ry = sharedY;
      const finalL = containEye(eyeSmooth.lx, eyeSmooth.ly, halfW, halfH);
      const finalR = containEye(eyeSmooth.rx, eyeSmooth.ry, halfW, halfH);
      eyeSmooth.lx = finalL.x;
      eyeSmooth.ly = finalL.y;
      eyeSmooth.rx = finalR.x;
      eyeSmooth.ry = finalR.y;
      const finalY = Math.max(eyeSmooth.ly, eyeSmooth.ry);
      eyeSmooth.ly = finalY;
      eyeSmooth.ry = finalY;

      blob.style.setProperty("--eye-l-x", `${((eyeSmooth.lx / VB_W) * 100).toFixed(2)}%`);
      blob.style.setProperty("--eye-l-y", `${((eyeSmooth.ly / VB_H) * 100).toFixed(2)}%`);
      blob.style.setProperty("--eye-r-x", `${((eyeSmooth.rx / VB_W) * 100).toFixed(2)}%`);
      blob.style.setProperty("--eye-r-y", `${((eyeSmooth.ry / VB_H) * 100).toFixed(2)}%`);
      blob.style.setProperty(
        "--squint-y",
        `${((((eyeSmooth.ly + eyeSmooth.ry) / 2) / VB_H) * 100).toFixed(2)}%`,
      );

      if (scared) {
        squintOn = false;
        blob.dataset.squint = "false";
        return;
      }

      const facePress =
        !cursorAbove &&
        !cursorBelow &&
        morph.dent > (squintOn ? 0.18 : 0.3) &&
        Math.sin(morph.contactAng) > 0.72;
      const wantSquint =
        !cursorAbove &&
        !cursorBelow &&
        (morph.squash > (squintOn ? 0.12 : 0.22) || facePress);
      squintOn = wantSquint;
      blob.dataset.squint = squintOn ? "true" : "false";
    }

    function renderMorph() {
      path.setAttribute("d", buildPath());
    }

    function setArmState(state) {
      armState = state;
      blob.dataset.arm = state;
    }

    function clearArmPhase() {
      window.clearTimeout(armPhaseTimer);
      armPhaseTimer = 0;
    }

    function scheduleArmWave() {
      window.clearTimeout(armTimer);
      if (reducedMotion.matches) return;
      armTimer = window.setTimeout(startArmWave, ARM_INTERVAL_MS);
    }

    function finishArmHide() {
      setArmState("hidden");
      scheduleArmWave();
    }

    function tuckArm() {
      if (armState === "hidden" || armState === "tucking") return;
      clearArmPhase();
      setArmState("tucking");
      armPhaseTimer = window.setTimeout(finishArmHide, ARM_TUCK_MS);
    }

    function startArmWave() {
      if (blob.dataset.state !== "idle") {
        scheduleArmWave();
        return;
      }

      clearArmPhase();
      setArmState("waving");
      armPhaseTimer = window.setTimeout(tuckArm, ARM_WAVE_MS);
    }

    function holdFrozenMorph() {
      if (!frozenMorph) return;
      morph.squash = frozenMorph.squash;
      morph.dent = frozenMorph.dent;
      morph.contactAng = frozenMorph.contactAng;
      morph.vSquash = 0;
      morph.vDent = 0;
      morph.vContactAng = 0;
    }

    function clearTimers() {
      window.clearTimeout(regenerateTimer);
      window.clearTimeout(stateTimer);
      window.clearTimeout(armTimer);
      clearArmPhase();
    }

    function finishRise() {
      setState("idle");
      blob.dataset.squint = "false";
      blob.setAttribute("aria-label", "Friendly blob. Click to pop.");
      scheduleArmWave();
    }

    function startRise() {
      // Witnesses stay wide-eyed and panicked until the replacement appears.
      clearScare();
      frozenMorph = null;
      setState("rising");
      blob.dataset.squint = "true";
      blob.setAttribute("aria-label", "Blob is coming back.");
      morph.squash = 0;
      morph.dent = 0;
      morph.vSquash = 0;
      morph.vDent = 0;
      morph.contactAng = Math.PI / 2;
      renderMorph();

      if (spawnOnRise) {
        spawnOnRise = false;
        spawnNextBlob();
      }

      stateTimer = window.setTimeout(finishRise, RISE_MS);
    }

    function finishPop() {
      setState("gone");
      frozenMorph = null;
      regenerateTimer = window.setTimeout(startRise, GONE_MS);
    }

    function beginPopBurst() {
      setState("popping");
      blob.setAttribute("aria-label", "Blob popped.");
      stateTimer = window.setTimeout(finishPop, POP_MS);
    }

    function beginPopSequence({ spawn = false, delay = 0, scareOthers = true } = {}) {
      clearTimers();
      setArmState("hidden");
      spawnOnRise = spawn;
      blob.dataset.scare = "false";

      frozenMorph = {
        squash: morph.squash,
        dent: morph.dent,
        contactAng: morph.contactAng,
      };
      holdFrozenMorph();
      renderMorph();

      const run = () => {
        if (scareOthers) scareSiblings(inst);
        setState("startled");
        squintOn = false;
        blob.dataset.squint = "false";
        blob.setAttribute("aria-label", "Blob is about to pop.");
        stateTimer = window.setTimeout(beginPopBurst, STARTLE_MS);
      };

      if (delay > 0) stateTimer = window.setTimeout(run, delay);
      else run();
    }

    function tick() {
      const state = blob.dataset.state;
      const active = state === "idle";
      const holdingShape = state === "startled" || state === "popping";
      const scared = blob.dataset.scare === "true";

      if (holdingShape) {
        holdFrozenMorph();
      } else {
        // Scared blobs freeze soft-body so they just stare.
        const targets =
          active && !scared
            ? morphTargets()
            : { squash: 0, dent: 0, contactAng: morph.contactAng };

        springTo("squash", targets.squash);
        springTo("dent", targets.dent);

        if (active && !scared && targets.dent + targets.squash > 0.02) {
          morph.contactAng = lerpAngle(morph.contactAng, targets.contactAng, 0.1);
        }
      }

      if (active && armState === "waving" && (scared || morph.dent > 0.12 || morph.squash > 0.12)) {
        tuckArm();
      }

      renderMorph();
      if (active) placeEyes();
      else if (state === "rising") blob.dataset.squint = "true";
    }

    function requestPop() {
      if (resetting) return;
      if (blob.dataset.state !== "idle") return;

      if (instances.length >= MAX_BLOBS) {
        resetColony();
        return;
      }

      beginPopSequence({ spawn: true });
    }

    function destroy() {
      clearTimers();
      blob.removeEventListener("click", onClick);
      blob.removeEventListener("keydown", onKeydown);
      blob.remove();
    }

    function onClick(event) {
      event.preventDefault();
      requestPop();
    }

    function onKeydown(event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        requestPop();
      }
    }

    blob.addEventListener("click", onClick);
    blob.addEventListener("keydown", onKeydown);

    inst.tick = tick;
    inst.destroy = destroy;
    inst.requestPop = requestPop;
    inst.startRise = startRise;
    inst.forcePop = beginPopSequence;
    inst.clearTimers = clearTimers;

    renderMorph();
    placeEyes();
    setArmState("hidden");

    if (rising) {
      startRise();
    } else {
      setState("idle");
      if (!reducedMotion.matches) {
        armTimer = window.setTimeout(startArmWave, 1200 + sizeIndex * 180);
      }
    }

    return inst;
  }

  function nextSizeIndex() {
    const used = new Set(instances.map((item) => item.sizeIndex));
    for (let size = 0; size < MAX_BLOBS; size += 1) {
      if (!used.has(size)) return size;
    }
    return -1;
  }

  function spawnNextBlob() {
    if (resetting) return;
    const sizeIndex = nextSizeIndex();
    if (sizeIndex < 0) return;
    const inst = createInstance(sizeIndex, { rising: true });
    instances.push(inst);
  }

  function scareSiblings(victim) {
    const rect = victim.blob.getBoundingClientRect();
    scareFocus = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height * 0.35,
    };
    // startRise clears the reaction; this is only a safety timeout.
    scareUntil = performance.now() + STARTLE_MS + POP_MS + GONE_MS + RISE_MS;

    instances.forEach((inst) => {
      if (inst === victim) return;
      if (inst.state !== "idle") return;
      inst.blob.dataset.scare = "true";
      inst.blob.dataset.squint = "false";
    });
  }

  function clearScare() {
    scareFocus = null;
    scareUntil = 0;
    instances.forEach((inst) => {
      if (inst.blob.dataset.scare === "true") {
        inst.blob.dataset.scare = "false";
      }
    });
  }

  function resetColony() {
    if (resetting) return;
    resetting = true;
    clearScare();

    const alive = [...instances];
    // First scare everyone toward the clicked blob, then cascade-pop.
    const focus = alive[alive.length - 1] || alive[0];
    if (focus) {
      const rect = focus.blob.getBoundingClientRect();
      scareFocus = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height * 0.35,
      };
      scareUntil = performance.now() + 280;
      alive.forEach((inst) => {
        if (inst.state === "idle") {
          inst.blob.dataset.scare = "true";
          inst.blob.dataset.squint = "false";
        }
      });
    }

    window.setTimeout(() => {
      clearScare();
      alive.forEach((inst, index) => {
        inst.clearTimers();
        inst.forcePop({ spawn: false, delay: index * 70, scareOthers: false });
      });
    }, reducedMotion.matches ? 40 : 280);

    const totalDelay =
      (reducedMotion.matches ? 40 : 280) +
      (alive.length - 1) * 70 +
      STARTLE_MS +
      POP_MS +
      GONE_MS;

    window.setTimeout(() => {
      instances.splice(0).forEach((inst) => inst.destroy());
      const big = createInstance(0, { rising: true });
      instances.push(big);
      resetting = false;
    }, totalDelay);
  }

  function onPointer(event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
  }

  function frame() {
    if (scareFocus && performance.now() > scareUntil) {
      clearScare();
    }
    for (let i = 0; i < instances.length; i += 1) {
      instances[i].tick();
    }
    requestAnimationFrame(frame);
  }

  window.addEventListener("pointermove", onPointer, { passive: true });
  window.addEventListener("mousemove", onPointer, { passive: true });

  instances.push(createInstance(0, { rising: false }));
  requestAnimationFrame(frame);
}

setupBlobColony();
