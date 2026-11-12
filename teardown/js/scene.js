/* Teardown — renderer, lighting, scroll-driven camera and animation. */
(function () {
  const TD = window.TD;
  const { clamp, smooth: sm } = TD;
  const SCROLL_PER_STEP = 1000;

  TD.Stage = class {
    constructor(opts) {
      this.canvas = opts.canvas; this.root = opts.root; this.track = opts.track;
      this.onStep = opts.onStep || (() => {}); this.onFail = opts.onFail || (() => {});
      this.f = 0; this.cur = -1; this.last = 0; this.mx = 0; this.my = 0; this.pmx = 0; this.pmy = 0; this.size = [0, 0];
      this.infos = Array.from(this.root.querySelectorAll('[data-info]'));
      this.cos = Array.from(this.root.querySelectorAll('[data-co]')).map((el) => ({ el, i: +el.dataset.co, at: JSON.parse(el.dataset.at), on: false }));
      this.el = { bar: this.root.querySelector('[data-bar]'), hint: this.root.querySelector('[data-hint]'), scaleBar: this.root.querySelector('[data-scale-bar]'), scaleTxt: this.root.querySelector('[data-scale-txt]'), zoom: this.root.querySelector('[data-zoom]') };
      window.addEventListener('pointermove', (e) => { this.mx = (e.clientX / window.innerWidth) * 2 - 1; this.my = (e.clientY / window.innerHeight) * 2 - 1; }, { passive: true });
      window.addEventListener('keydown', (e) => {
        if (['ArrowDown', 'ArrowRight', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); this.go(Math.min(TD.steps.length - 1, this.cur + 1)); }
        if (['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key)) { e.preventDefault(); this.go(Math.max(0, this.cur - 1)); }
      });
      const layout = () => { this.track.style.height = (TD.steps.length - 1) * SCROLL_PER_STEP + window.innerHeight + 'px'; };
      window.addEventListener('resize', layout); layout();
    }

    start() {
      try { this.initGL(); } catch (err) { console.error(err); this.onFail(); return; }
      const tick = (now) => { this.frame(now || 0); this.raf = requestAnimationFrame(tick); };
      this.raf = requestAnimationFrame(tick);
    }

    go(i) {
      const span = this.track.offsetHeight - window.innerHeight;
      window.scrollTo({ top: (i / (TD.steps.length - 1)) * span, behavior: 'smooth' });
    }

    progress(frac) {
      const K = TD.steps.length;
      const raw = frac * (K - 1);
      const seg = Math.min(K - 2, Math.floor(raw));
      const e = sm(clamp((raw - seg - 0.2) / 0.6));
      return { raw, seg, e, P: seg + e };
    }

    initGL() {
      const T = window.THREE;
      const renderer = new T.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
      const pr = Math.min(window.devicePixelRatio || 1, 2);
      renderer.setPixelRatio(pr);
      renderer.outputColorSpace = T.SRGBColorSpace;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.08;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFSoftShadowMap;
      renderer.localClippingEnabled = true;

      const BG = 0x07080c;
      const scene = new T.Scene();
      scene.background = new T.Color(BG);
      scene.fog = new T.Fog(BG, 80, 210);

      // studio environment: dark room with soft-box panels
      const env = new T.Scene();
      const room = new T.Mesh(new T.BoxGeometry(60, 30, 60), new T.MeshStandardMaterial({ color: 0x23262c, side: T.BackSide }));
      room.position.y = 12; env.add(room);
      const panel = (w, h, x, y, z, rx, ry, r, g, b) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(r, g, b) })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m); };
      panel(30, 12, 0, 26.9, 0, Math.PI / 2, 0, 6.5, 6.5, 6.8);
      panel(14, 18, -29.9, 12, -6, 0, Math.PI / 2, 3.2, 3.8, 5);
      panel(10, 14, 29.9, 14, 8, 0, -Math.PI / 2, 2.6, 2.1, 2.0);
      panel(24, 6, 0, 10, 29.9, 0, Math.PI, 1.6, 1.6, 1.7);
      panel(20, 8, 0, 6, -29.9, 0, 0, 1.0, 1.1, 1.6);
      const pm = new T.PMREMGenerator(renderer);
      scene.environment = pm.fromScene(env, 0.035).texture;

      const key = new T.DirectionalLight(0xffffff, 2.4);
      key.position.set(18, 42, 22); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
      const sc = key.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 10; sc.far = 110;
      key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
      scene.add(key);
      const rim = new T.DirectionalLight(0x7de3f4, 0.12); rim.position.set(-30, 18, -30); scene.add(rim);
      scene.add(new T.HemisphereLight(0xdfe8ff, 0x0c0d10, 0.32));
      const dieLight = new T.PointLight(0xffffff, 0, 6, 2); dieLight.position.set(TD.DIE.cx + 0.7, 2.0, TD.DIE.cz + 0.9); scene.add(dieLight);

      const ground = new T.Mesh(new T.PlaneGeometry(600, 600), new T.MeshStandardMaterial({ color: 0x0b0c11, roughness: 0.62, metalness: 0.15 }));
      ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);

      const tex = TD.makeTextures(T);
      const parts = TD.buildLaptop(T, scene, tex);

      scene.updateMatrixWorld(true);
      const V = (x, y, z) => new T.Vector3(x, y, z);
      const sCenter = parts.screen.localToWorld(V(0, 0, 0));
      const sNormal = V(0, 0, 1).transformDirection(parts.screen.matrixWorld);
      const pCenter = parts.patch.localToWorld(V(0, 0, 0));

      const camera = new T.PerspectiveCamera(30, 1.6, 0.05, 600);

      let composer = null;
      try {
        const rt = new T.WebGLRenderTarget(4, 4, { type: T.HalfFloatType, samples: 4 });
        composer = new T.EffectComposer(renderer, rt);
        composer.setPixelRatio(pr);
        composer.addPass(new T.RenderPass(scene, camera));
        composer.addPass(new T.UnrealBloomPass(new T.Vector2(4, 4), 0.14, 0.5, 1.1));
        composer.addPass(new T.OutputPass());
      } catch (err) { composer = null; }

      this.g = Object.assign(parts, { T, renderer, composer, scene, camera, rim, dieLight, sCenter, sNormal, pCenter, v: V(0, 0, 0), colA: new T.Color(), colB: new T.Color() });
    }

    camKey(k) {
      const g = this.g, T = g.T;
      if (k.cam === 'display') return { t: g.sCenter.clone(), p: g.sCenter.clone().addScaledVector(g.sNormal, 44) };
      if (k.cam === 'pixels') return { t: g.pCenter.clone(), p: g.pCenter.clone().addScaledVector(g.sNormal, 0.62) };
      return { t: new T.Vector3(k.t[0], k.t[1], k.t[2]), p: new T.Vector3(k.p[0], k.p[1], k.p[2]) };
    }

    frame(now) {
      const g = this.g, T = g.T, keys = TD.steps, K = keys.length;
      const W = window.innerWidth, H = window.innerHeight;
      const dt = Math.min(0.05, (now - this.last) / 1000 || 0); this.last = now;
      const t = now / 1000;
      const span = Math.max(1, this.track.offsetHeight - H);
      const target = clamp(window.scrollY / span);
      this.f += (target - this.f) * (1 - Math.exp(-dt * 8));
      if (Math.abs(target - this.f) < 0.00002) this.f = target;
      this.pmx += (this.mx - this.pmx) * (1 - Math.exp(-dt * 4));
      this.pmy += (this.my - this.pmy) * (1 - Math.exp(-dt * 4));

      const { raw, seg, e, P } = this.progress(this.f);
      const cur = Math.round(P);
      if (cur !== this.cur) { this.cur = cur; this.onStep(cur); }
      const wide = W >= 900;

      if (this.size[0] !== W || this.size[1] !== H) {
        this.size = [W, H];
        g.renderer.setSize(W, H, false);
        if (g.composer) g.composer.setSize(W, H);
      }

      // ---- camera: spherical interpolation between step poses ----
      const fit0 = Math.max(1, 1.45 / (W / H));
      const sph = (k) => { const c = this.camKey(k); const o = c.p.clone().sub(c.t); const L = o.length(); return { t: c.t, r: L * fit0 * (k.hero || !wide ? 1 : 1.14), th: Math.atan2(o.x, o.z), ph: Math.acos(o.y / L) }; };
      const A = sph(keys[seg]), B = sph(keys[seg + 1]);
      const L = (a, b) => a + (b - a) * e;
      let dth = B.th - A.th; if (dth > Math.PI) dth -= Math.PI * 2; if (dth < -Math.PI) dth += Math.PI * 2;
      const tgt = A.t.clone().lerp(B.t, e);
      const r = Math.exp(L(Math.log(A.r), Math.log(B.r)));
      const th = A.th + dth * e + this.pmx * 0.06 + Math.sin(t * 0.23) * 0.014;
      const ph = Math.max(0.03, L(A.ph, B.ph) + this.pmy * 0.03 + Math.sin(t * 0.17) * 0.008);
      const cam = g.camera;
      cam.position.set(tgt.x + r * Math.sin(ph) * Math.sin(th), tgt.y + r * Math.cos(ph), tgt.z + r * Math.sin(ph) * Math.cos(th));
      cam.lookAt(tgt);
      cam.aspect = W / H;
      cam.near = Math.max(0.004, r * 0.01);
      cam.far = Math.max(300, r * 6);
      const info = L(keys[seg].hero ? 0 : 1, keys[seg + 1].hero ? 0 : 1);
      if (wide) cam.setViewOffset(W, H, -W * 0.1 * info, H * 0.045 * info, W, H); else cam.setViewOffset(W, H, 0, H * 0.13 * info, W, H);
      cam.updateProjectionMatrix();

      // ---- disassembly ----
      const iCpu = TD.idx('cpu'), iCores = TD.idx('cores'), iCore = TD.idx('core'), iRam = TD.idx('ram'), iSsd = TD.idx('ssd'), iPix = TD.idx('pixels');
      const dOut = 1 - Math.max(clamp(1 - P), clamp(P - (K - 2)));
      g.deck.position.set(-42 * dOut * dOut, 13 * sm(clamp(dOut * 1.6)), 0);
      g.deck.rotation.z = 0.25 * dOut;
      const dO = 1 - sm(clamp((dOut - 0.45) / 0.5));
      g.deckMats.forEach((m) => { m.opacity = dO; });
      g.deck.visible = dO > 0.01;

      const cOut = 1 - Math.max(clamp(iCpu - P), clamp(P - (K - 2)));
      g.cool.position.set(40 * cOut * cOut, 11 * sm(clamp(cOut * 1.6)), 0);
      g.cool.rotation.z = -0.2 * cOut;
      const cO = 1 - sm(clamp((cOut - 0.45) / 0.5));
      g.coolMats.forEach((m) => { m.opacity = cO; });
      g.cool.visible = cO > 0.01;

      const near = (i) => sm(clamp(1 - Math.abs(P - i) * 1.4));
      g.ramSticks[0].rotation.x = -0.42 * near(iRam);
      g.ssdPivot.rotation.z = 0.2 * near(iSsd);

      // ---- silicon: scan reveal → floorplan → live cores → single core ----
      const D = TD.DIE;
      const reveal = sm(clamp((P - iCpu - 0.08) * 1.3));
      const exit = 1 - sm(clamp((P - TD.idx('igpu')) * 2.2));
      const sweep = D.cx - D.w / 2 - 0.01 + reveal * (D.w + 0.02);
      g.clip.constant = sweep;
      g.floorMat.opacity = reveal > 0 ? exit : 0;
      g.scan.position.x = sweep;
      g.scanMat.opacity = reveal > 0 && reveal < 1 ? Math.sqrt(Math.sin(Math.PI * reveal)) : 0;
      g.scan.visible = g.scanMat.opacity > 0.01;
      g.coreMat.opacity = sm(clamp((P - iCores - 0.1) * 1.5)) * exit;
      const live = (reveal > 0 ? exit : 0);
      g.coreGlow.forEach((c) => {
        const n = 0.5 + 0.5 * Math.sin(t * (1.1 + c.seed * 0.31) + c.seed * 9) * Math.sin(t * 0.37 + c.seed * 4);
        const burst = Math.pow(n, 3);
        c.m.opacity = live * (c.p ? 0.3 : 0.2) * (0.08 + burst);
      });
      g.dieLight.intensity = 1.6 * live * reveal;

      g.patchMat.opacity = clamp(1 - Math.abs(P - iPix) * 1.5);
      g.fanBlades.forEach((b, i) => { b.rotation.y += dt * (i ? -9 : 9); });

      // ---- accent ----
      g.colA.set(keys[seg].accent).lerp(g.colB.set(keys[seg + 1].accent), e);
      const hex = '#' + g.colA.getHexString();
      if (hex !== this.accent) { this.accent = hex; this.root.style.setProperty('--accent', hex); g.rim.color.copy(g.colA); g.coreGlow.forEach((c) => c.m.color.copy(g.colA)); }

      if (g.composer) g.composer.render(dt); else g.renderer.render(g.scene, cam);

      // ---- HUD (direct DOM writes, no re-render) ----
      const wgt = (i) => Math.pow(clamp(1 - Math.abs(P - i) * 1.9), 1.5);
      this.infos.forEach((el) => {
        const v = wgt(+el.dataset.info);
        el.style.opacity = v.toFixed(3);
        el.style.transform = 'translate3d(0,' + ((1 - v) * 18).toFixed(1) + 'px,0)';
        el.style.visibility = v > 0.01 ? 'visible' : 'hidden';
      });
      const coScale = wide ? 1 : 0.55;
      this.cos.forEach((c) => {
        const v = clamp((wgt(c.i) - 0.35) / 0.65);
        if (v <= 0.001) { if (c.on) { c.el.style.visibility = 'hidden'; c.on = false; } return; }
        g.v.set(c.at[0], c.at[1], c.at[2]).project(cam);
        c.el.style.visibility = 'visible'; c.on = true;
        c.el.style.opacity = v.toFixed(3);
        c.el.style.transform = 'translate3d(' + ((g.v.x * 0.5 + 0.5) * W).toFixed(1) + 'px,' + ((-g.v.y * 0.5 + 0.5) * H).toFixed(1) + 'px,0) scale(' + coScale + ')';
        c.el.style.setProperty('--grow', sm(v).toFixed(3));
      });
      this.el.bar.style.transform = 'scaleX(' + (raw / (K - 1)).toFixed(4) + ')';
      this.el.hint.style.opacity = clamp(1 - raw * 3).toFixed(3);

      const mmPerPx = ((2 * r * Math.tan((cam.fov * Math.PI) / 360)) / H) * TD.UNIT_MM;
      const want = mmPerPx * 110, p10 = Math.pow(10, Math.floor(Math.log10(want)));
      const nice = (want / p10 >= 5 ? 5 : want / p10 >= 2 ? 2 : 1) * p10;
      const txt = nice >= 10 ? Math.round(nice / 10) + ' cm' : nice >= 1 ? Math.round(nice) + ' mm' : Math.round(nice * 1000) + ' µm';
      if (txt !== this.scaleTxt) { this.scaleTxt = txt; this.el.scaleTxt.textContent = txt; }
      this.el.scaleBar.style.width = (nice / mmPerPx).toFixed(1) + 'px';
      const zx = sph(keys[0]).r / r, ztxt = '×' + (zx >= 10 ? Math.round(zx) : zx.toFixed(1));
      if (ztxt !== this.zoomTxt) { this.zoomTxt = ztxt; this.el.zoom.textContent = ztxt; }
    }
  };
})();
