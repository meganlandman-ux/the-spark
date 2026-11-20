/* =========================================================
   THE SPARK — shared behaviour
   Plain JavaScript, no libraries. Every page loads this file.
   Each part checks whether its elements exist, so pages only
   get the behaviour they use. Everything works without it:
   content is visible and links work if this script fails.

   1. Navigation    3. Spark network (canvas)
   2. Reveal        4. Three elements (Home)
   ========================================================= */
(function () {
  "use strict";
  var doc = document.documentElement;
  doc.classList.remove("no-js");
  var reduceMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
  var reduced = reduceMQ.matches;

  /* ---------- 1. Navigation ---------- */
  var nav = document.querySelector(".site-nav");
  if (nav) {
    var toggle = nav.querySelector(".nav-toggle"), list = nav.querySelector(".nav-list");
    var setOpen = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.textContent = open ? "Close" : "Menu";
      list.classList.toggle("is-open", open);
    };
    toggle.addEventListener("click", function () { setOpen(toggle.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && list.classList.contains("is-open")) { setOpen(false); toggle.focus(); } });
    list.addEventListener("click", function (e) { if (e.target.closest("a")) setOpen(false); });

    // The bar is transparent over the opening section, then takes the colour
    // of whatever section is underneath it.
    var opening = document.querySelector(".hero, .page-head");
    var updateNav = function () {
      var y = nav.offsetHeight / 2, under = null;
      document.querySelectorAll("main > section, main > article, .site-footer").forEach(function (s) {
        var r = s.getBoundingClientRect();
        if (r.top <= y && r.bottom > y) under = s;
      });
      var light = under && (under.classList.contains("light") || under.classList.contains("amber"));
      nav.classList.toggle("is-light", !!light);
      nav.classList.toggle("is-solid", !light && under !== opening);
    };
    var ticking = false;
    window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(function () { updateNav(); ticking = false; }); } }, { passive: true });
    window.addEventListener("resize", updateNav);
    updateNav();
  }

  /* ---------- 2. Reveal (progressive enhancement) ----------
     Sections are only hidden once the observer is confirmed running.
     A safety timer shows everything if it never reports back. */
  try {
    var reveals = document.querySelectorAll(".reveal");
    if (reveals.length && "IntersectionObserver" in window && !reduced) {
      var heard = false;
      var io = new IntersectionObserver(function (entries) {
        heard = true;
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { threshold: 0.12 });
      reveals.forEach(function (el) { io.observe(el); });
      doc.classList.add("reveal-on");
      setTimeout(function () { if (!heard) { io.disconnect(); reveals.forEach(function (el) { el.classList.add("is-in"); }); } }, 1500);
    }
  } catch (err) { doc.classList.remove("reveal-on"); }

  /* ---------- 3. Spark network (canvas) ----------
     A point of light appears, then particles drift outward and connect.
     Markup: <canvas data-spark data-origin="#element-id"> or data-origin="right".
     Optional: data-count, data-glow, data-intensity, data-interactive. */
  var COLOURS = [[242,165,65], [217,108,54], [217,140,120], [247,245,240]];

  function Field(canvas) {
    var s = this, d = canvas.dataset;
    s.c = canvas; s.ctx = canvas.getContext("2d"); s.p = []; s.m = { x: 0, y: 0, on: false };
    s.count = Number(d.count || 110); s.glow = Number(d.glow || 260); s.intensity = Number(d.intensity || 1);
    s.originSpec = d.origin || "right";
    s.vis = true; s.t0 = performance.now(); s.last = 0;
    s.resize();
    if ("ResizeObserver" in window) new ResizeObserver(function () { s.resize(); if (reduced) s.still(); }).observe(canvas);
    else window.addEventListener("resize", function () { s.resize(); });
    if (d.interactive === "true" && window.matchMedia("(pointer: fine)").matches) {
      canvas.parentElement.addEventListener("pointermove", function (e) { var r = canvas.getBoundingClientRect(); s.m.x = e.clientX - r.left; s.m.y = e.clientY - r.top; s.m.on = true; });
      canvas.parentElement.addEventListener("pointerleave", function () { s.m.on = false; });
    }
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { s.vis = e[0].isIntersecting; if (s.vis && !reduced) s.loop(); }).observe(canvas);
    document.addEventListener("visibilitychange", function () { if (!document.hidden && !reduced) s.loop(); });
  }
  Field.prototype.origin = function () {
    var spec = this.originSpec;
    if (spec.charAt(0) === "#") {
      var el = document.querySelector(spec);
      if (el) { var c = this.c.getBoundingClientRect(), r = el.getBoundingClientRect(); return { x: r.left + r.width / 2 - c.left, y: r.top + r.height / 2 - c.top }; }
    }
    return { x: this.w * (this.small ? .85 : .8), y: this.h * .5 };
  };
  Field.prototype.resize = function () {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), r = this.c.getBoundingClientRect();
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr); this.c.height = Math.round(r.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.small = this.w < 700;
    this.max = Math.round((this.small ? .55 : 1) * this.count);
    this.L = this.small ? 95 : 140;
    this.org = this.origin();
  };
  Field.prototype.spawn = function (settled) {
    var a = Math.random() * Math.PI * 2, o = this.org;
    var q = { x: o.x, y: o.y, vx: Math.cos(a) * (.4 + Math.random() * 1.4), vy: Math.sin(a) * (.4 + Math.random() * 1.4),
              r: .8 + Math.random() * 1.8, c: COLOURS[Math.random() < .15 ? 3 : Math.floor(Math.random() * 3)], s: Math.random() * 1000, age: 0 };
    if (settled) { var dist = 40 + Math.pow(Math.random(), .7) * Math.max(this.w, this.h) * .55; q.x = o.x + Math.cos(a) * dist; q.y = o.y + Math.sin(a) * dist * .75; q.age = 200; }
    this.p.push(q);
  };
  Field.prototype.draw = function (t) {
    var x = this.ctx, o = this.org, P = this.p, L2 = this.L * this.L, I = this.intensity;
    x.clearRect(0, 0, this.w, this.h);
    // The originating light grows in, then breathes gently
    var R = this.glow * Math.min(1, (t - this.t0) / 1400) * (1 + (reduced ? 0 : Math.sin(t / 1600) * .08));
    if (R > 0) {
      var g = x.createRadialGradient(o.x, o.y, 0, o.x, o.y, R);
      g.addColorStop(0, "rgba(255,226,170,.95)"); g.addColorStop(.08, "rgba(242,165,65,.55)");
      g.addColorStop(.35, "rgba(217,108,54,.14)"); g.addColorStop(1, "rgba(217,108,54,0)");
      x.fillStyle = g; x.beginPath(); x.arc(o.x, o.y, R, 0, 7); x.fill();
    }
    // Links between nearby particles, and to the cursor
    x.lineWidth = .7;
    for (var i = 0; i < P.length; i++) {
      var A = P[i], fa = Math.min(1, A.age / 60);
      for (var j = i + 1; j < P.length; j++) {
        var B = P[j], dx = A.x - B.x, dy = A.y - B.y, d2 = dx * dx + dy * dy;
        if (d2 < L2) { x.strokeStyle = "rgba(242,165,65," + ((1 - d2 / L2) * .32 * fa * Math.min(1, B.age / 60) * I).toFixed(3) + ")"; x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(B.x, B.y); x.stroke(); }
      }
      if (this.m.on) {
        var mx = A.x - this.m.x, my = A.y - this.m.y, md = Math.sqrt(mx * mx + my * my), ML = this.L * 1.3;
        if (md < ML) { x.strokeStyle = "rgba(247,245,240," + ((1 - md / ML) * .25).toFixed(3) + ")"; x.beginPath(); x.moveTo(A.x, A.y); x.lineTo(this.m.x, this.m.y); x.stroke(); }
      }
    }
    for (var k = 0; k < P.length; k++) { var q = P[k]; x.fillStyle = "rgba(" + q.c.join(",") + "," + (.85 * Math.min(1, q.age / 40) * I).toFixed(3) + ")"; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 7); x.fill(); }
  };
  Field.prototype.step = function (t) {
    if (t - this.t0 > 900 && this.p.length < this.max && t - this.last > 70) { this.spawn(false); this.last = t; }
    for (var i = 0; i < this.p.length; i++) {
      var q = this.p[i]; q.age++;
      q.vx = q.vx * .985 + Math.cos(t * .0004 + q.s) * .006; q.vy = q.vy * .985 + Math.sin(t * .00035 + q.s * 1.3) * .006;
      if (this.m.on) { var dx = this.m.x - q.x, dy = this.m.y - q.y, d = Math.sqrt(dx * dx + dy * dy); if (d < 180 && d > 1) { q.vx += dx / d * .012; q.vy += dy / d * .012; } }
      q.x += q.vx; q.y += q.vy;
      if (q.x < -20 || q.x > this.w + 20) q.vx *= -1;
      if (q.y < -20 || q.y > this.h + 20) q.vy *= -1;
    }
  };
  Field.prototype.loop = function () {
    if (this.running) return; this.running = true; var s = this;
    (function frame(t) { if (!s.vis || document.hidden || reduced) { s.running = false; return; } s.step(t); s.draw(t); requestAnimationFrame(frame); })(performance.now());
  };
  Field.prototype.still = function () { this.p = []; for (var i = 0; i < this.max; i++) this.spawn(true); this.t0 = -1e6; this.draw(0); };
  Field.prototype.start = function () { if (reduced) this.still(); else this.loop(); };

  var fields = [];
  document.querySelectorAll("canvas[data-spark]").forEach(function (c) { try { var f = new Field(c); f.start(); fields.push(f); } catch (e) {} });
  // Webfonts change the heading width, so re-measure origins once they load
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { fields.forEach(function (f) { f.resize(); if (reduced) f.still(); }); });

  /* ---------- 4. Three elements (Home) ----------
     Students, colleagues and institutions on a triangle. Points of light
     travel both ways along each connection; selecting one shows its
     influence on the other two. */
  var tri = document.getElementById("tri-svg");
  var flowLoop = function () {};
  if (tri) {
    var NS = "http://www.w3.org/2000/svg";
    var P = [[300, 70], [80, 420], [520, 420]];
    var arcsG = document.getElementById("tri-arcs"), flowsG = document.getElementById("tri-flows");
    var arcs = [];
    for (var a = 0; a < 3; a++) for (var b = 0; b < 3; b++) {
      if (a === b) continue;
      var mx = (P[a][0] + P[b][0]) / 2, my = (P[a][1] + P[b][1]) / 2;
      var dx = P[b][0] - P[a][0], dy = P[b][1] - P[a][1], len = Math.sqrt(dx * dx + dy * dy);
      var cx = mx - dy / len * 34, cy = my + dx / len * 34;   // each direction bows to its own side
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", "M" + P[a][0] + " " + P[a][1] + " Q " + cx.toFixed(1) + " " + cy.toFixed(1) + " " + P[b][0] + " " + P[b][1]);
      path.setAttribute("class", "arc"); arcsG.appendChild(path);
      var dot = document.createElementNS(NS, "circle"); dot.setAttribute("class", "flow"); dot.setAttribute("r", "3"); flowsG.appendChild(dot);
      arcs.push({ from: a, el: path, dot: dot, len: path.getTotalLength(), off: Math.random() });
    }

    var TEXT = [
      { h: "Students", k: "Igniting potential.", b: "When students are at the centre, colleagues share a reason to rethink their practice, and institutions have a clear test of what matters." },
      { h: "Colleagues", k: "Sparking new thinking.", b: "Shared thinking turns one person's idea into better learning for students, and gives institutions the ideas and energy that change needs." },
      { h: "Institutions", k: "Enabling meaningful change.", b: "An enabling environment gives colleagues room to experiment, and lets a good idea reach every student rather than a single class." }
    ];
    var content = document.getElementById("idea-content"), DEFAULT_HTML = content.innerHTML;
    var buttons = document.querySelectorAll(".el-btn"), reset = document.getElementById("idea-reset");
    var active = -1;

    var drawFlows = function (t) {
      arcs.forEach(function (ar) {
        ar.dot.style.opacity = active < 0 ? .55 : (ar.from === active ? 1 : 0);
        var p = ar.el.getPointAtLength((reduced ? .5 : (t / 4200 + ar.off) % 1) * ar.len);
        ar.dot.setAttribute("cx", p.x.toFixed(1)); ar.dot.setAttribute("cy", p.y.toFixed(1));
      });
    };
    var setActive = function (i) {
      active = i;
      buttons.forEach(function (bt, j) { bt.setAttribute("aria-pressed", String(j === i)); });
      tri.querySelectorAll(".node, .halo").forEach(function (n) { n.classList.toggle("on", Number(n.getAttribute("data-n")) === i); });
      arcs.forEach(function (ar) { ar.el.classList.toggle("on", ar.from === i); });
      content.innerHTML = i < 0 ? DEFAULT_HTML : "<h3>" + TEXT[i].h + "</h3><p class=\"kick\">" + TEXT[i].k + "</p><p class=\"body\">" + TEXT[i].b + "</p>";
      content.classList.remove("fade-in"); void content.offsetWidth; content.classList.add("fade-in");
      reset.hidden = i < 0;
      if (reduced) drawFlows(0);
    };
    buttons.forEach(function (bt, j) { bt.addEventListener("click", function () { setActive(active === j ? -1 : j); }); });
    reset.addEventListener("click", function () { setActive(-1); buttons[0].focus(); });

    var triVisible = true, flowing = false;
    flowLoop = function () {
      if (flowing || reduced) { drawFlows(0); return; }
      flowing = true;
      (function frame(t) { if (!triVisible || reduced) { flowing = false; return; } drawFlows(t); requestAnimationFrame(frame); })(performance.now());
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { triVisible = e[0].isIntersecting; if (triVisible) flowLoop(); }).observe(tri);
    flowLoop();
  }

  // Follow the visitor's motion setting if it changes while the page is open
  if (reduceMQ.addEventListener) reduceMQ.addEventListener("change", function (e) {
    reduced = e.matches;
    fields.forEach(function (f) { f.start(); });
    flowLoop();
  });
})();
