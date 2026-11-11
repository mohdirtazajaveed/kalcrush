/* Floating, faceted 3D gems rendered with three.js behind hero sections ([data-gems]). */
(function () {
  if (!window.THREE) return;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var COLORS = [0xF27BA6, 0x9A5CF0, 0xF6C343, 0x45C8F2, 0x63D9A2, 0xC77DFF];

  // a brilliant-cut gem: lathe profile with few segments + flat shading = facets
  function gemGeometry(seg) {
    var pts = [
      new THREE.Vector2(0.001, -1.25), new THREE.Vector2(1.0, 0.0), new THREE.Vector2(0.98, 0.16),
      new THREE.Vector2(0.62, 0.48), new THREE.Vector2(0.001, 0.48)
    ];
    return new THREE.LatheGeometry(pts, seg);
  }

  function setup(host) {
    var count = parseInt(host.getAttribute('data-gems'), 10) || 8;
    var layout = host.getAttribute('data-gems-layout') || 'hero';
    var canvas = document.createElement('canvas');
    canvas.className = 'gems3d';
    canvas.setAttribute('aria-hidden', 'true');
    host.insertBefore(canvas, host.firstChild);

    var renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true }); }
    catch (e) { canvas.remove(); return; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
    renderer.outputEncoding = THREE.sRGBEncoding;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 16);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x6a3fb8, 0.9));
    var key = new THREE.DirectionalLight(0xffffff, 1.25); key.position.set(-4, 6, 8); scene.add(key);
    var rim = new THREE.DirectionalLight(0xffb3d1, 0.9); rim.position.set(6, -2, 4); scene.add(rim);
    var back = new THREE.PointLight(0x9fd8ff, 0.8, 40); back.position.set(0, 3, -6); scene.add(back);

    // positions in viewport-relative units: x,y in -1..1, z depth, s size
    var spots = layout === 'hero' ? [
      [0.02, 0.86, -5, 0.5], [0.42, -0.88, 0, 0.55], [0.98, 0.66, -2, 0.75], [0.93, -0.42, 1, 0.55],
      [0.64, 0.93, -6, 0.5], [0.12, -0.05, -12, 0.6], [-0.52, -0.92, -3, 0.42], [-0.97, 0.93, -7, 0.45],
      [0.25, 0.55, -10, 0.45], [-0.99, -0.9, -2, 0.4]
    ] : [
      [-0.98, 0.82, -3, 0.5], [0.92, 0.65, -3, 0.6], [0.85, -0.6, 0, 0.5], [-0.95, -0.9, -2, 0.42],
      [0.35, 0.95, -6, 0.5], [0.05, -0.95, -5, 0.45]
    ];
    var gems = [];
    for (var i = 0; i < Math.min(count, spots.length); i++) {
      var s = spots[i];
      var mat = new THREE.MeshPhysicalMaterial({
        color: COLORS[i % COLORS.length], metalness: 0.15, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.1,
        flatShading: true, emissive: COLORS[i % COLORS.length], emissiveIntensity: 0.12, transparent: true, opacity: 0.96
      });
      var m = new THREE.Mesh(gemGeometry(i % 2 ? 8 : 10), mat);
      m.userData = { x: s[0], y: s[1], z: s[2], size: s[3], phase: Math.random() * Math.PI * 2,
        spin: (0.25 + Math.random() * 0.35) * (Math.random() < 0.5 ? -1 : 1), tilt: (Math.random() - 0.5) * 0.9 };
      m.rotation.set(m.userData.tilt, Math.random() * 6, (Math.random() - 0.5) * 0.6);
      scene.add(m); gems.push(m);
    }

    var w = 1, h = 1, mx = 0, my = 0, tx = 0, ty = 0, running = false, visible = true, t0 = performance.now();
    function place() {
      var vh = 2 * Math.tan(camera.fov * Math.PI / 360);
      gems.forEach(function (g) {
        var d = camera.position.z - g.userData.z, halfH = vh * d / 2, halfW = halfH * camera.aspect;
        g.userData.px = g.userData.x * halfW * 0.98; g.userData.py = g.userData.y * halfH * 0.95;
        var narrow = w < 760; g.visible = !narrow || Math.abs(g.userData.x) > 0.9;
        var sc = g.userData.size * (narrow ? 0.6 : 1); g.scale.setScalar(sc);
        if (narrow) g.userData.px = Math.sign(g.userData.x) * halfW * 1.02;
      });
    }
    function resize() {
      var r = host.getBoundingClientRect(); w = Math.max(1, r.width); h = Math.max(1, r.height);
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); place();
    }
    function frame(now) {
      var t = (now - t0) / 1000;
      tx += (mx - tx) * 0.05; ty += (my - ty) * 0.05;
      camera.position.x = tx * 0.9; camera.position.y = -ty * 0.6; camera.lookAt(0, 0, 0);
      gems.forEach(function (g) {
        var u = g.userData;
        g.position.set(u.px + Math.sin(t * 0.5 + u.phase) * 0.25, u.py + Math.sin(t * 0.8 + u.phase) * 0.35, u.z);
        g.rotation.y += u.spin * 0.012; g.rotation.x = u.tilt + Math.sin(t * 0.6 + u.phase) * 0.15;
      });
      renderer.render(scene, camera);
      if (running) requestAnimationFrame(frame);
    }
    function start() { if (!running && visible && !document.hidden && !reduce) { running = true; requestAnimationFrame(frame); } }
    function stop() { running = false; }

    window.addEventListener('resize', resize);
    host.addEventListener('pointermove', function (e) {
      var r = host.getBoundingClientRect();
      mx = ((e.clientX - r.left) / r.width - 0.5) * 2; my = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });
    document.addEventListener('visibilitychange', function () { document.hidden ? stop() : start(); });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) { visible = en[0].isIntersecting; visible ? start() : stop(); }).observe(host);
    }
    resize();
    if (reduce) frame(performance.now()); else start();
    requestAnimationFrame(function () { canvas.classList.add('on'); });
  }

  function init() { document.querySelectorAll('[data-gems]').forEach(setup); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
