/* Teardown — procedural canvas textures (no image files). */
(function () {
  const TD = window.TD;
  const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace';
  const FONT_DISPLAY = '"Space Grotesk", system-ui, sans-serif';
  const FONT_TEXT = 'Inter, system-ui, sans-serif';

  const DIE_COLS = ['#35c6d8', '#5b8cff', '#8f6bff', '#d24fa8', '#e2b25a', '#ff8a6b'];

  const rgb = (hex, k, a) => {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.round(((n >> 16) & 255) * k)), g = Math.min(255, Math.round(((n >> 8) & 255) * k)), b = Math.min(255, Math.round((n & 255) * k));
    return 'rgba(' + r + ',' + g + ',' + b + ',' + (a === undefined ? 1 : a) + ')';
  };

  const tile = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); return c; };

  // ---- silicon painters -------------------------------------------------
  function makePainters(ctx) {
    const R0 = TD.rng(77);
    const pat = {
      rows: ctx.createPattern(tile(8, 4, (c) => { c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 8, 2); c.fillStyle = 'rgba(255,255,255,0.10)'; c.fillRect(0, 2, 8, 1); }), 'repeat'),
      cols: ctx.createPattern(tile(6, 8, (c) => { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, 2, 8); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(3, 0, 1, 8); }), 'repeat'),
      cells: ctx.createPattern(tile(6, 6, (c) => { c.fillStyle = 'rgba(0,0,0,0.5)'; c.fillRect(0, 0, 6, 1); c.fillRect(0, 0, 1, 6); c.fillStyle = 'rgba(255,255,255,0.14)'; c.fillRect(3, 3, 1, 1); }), 'repeat'),
      noise: ctx.createPattern(tile(128, 128, (c, w, h) => { for (let i = 0; i < 5200; i++) { const v = R0(); c.fillStyle = v > 0.5 ? 'rgba(255,255,255,' + (v - 0.5) * 0.5 + ')' : 'rgba(0,0,0,' + (0.5 - v) * 0.9 + ')'; c.fillRect(R0() * w, R0() * h, 1 + R0() * 4, 1 + R0() * 2); } }), 'repeat')
    };
    const frame = (c, x, y, w, h, col) => { c.strokeStyle = rgb(col, 1.25, 0.55); c.lineWidth = Math.max(1, Math.min(w, h) * 0.008); c.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1); };
    return {
      sram(c, x, y, w, h, col, R) {
        c.fillStyle = rgb(col, 0.16); c.fillRect(x, y, w, h);
        const horiz = w >= h;
        const nb = Math.max(2, Math.round((horiz ? w / h : h / w) * 2.2));
        const gap = Math.max(1.5, Math.min(w, h) * 0.035);
        for (let i = 0; i < nb; i++) {
          const bx = horiz ? x + (w / nb) * i + gap / 2 : x + gap / 2, by = horiz ? y + gap / 2 : y + (h / nb) * i + gap / 2;
          const bw = horiz ? w / nb - gap : w - gap, bh = horiz ? h - gap : h / nb - gap;
          const g = c.createLinearGradient(bx, by, bx + bw, by + bh);
          g.addColorStop(0, rgb(col, 0.95)); g.addColorStop(1, rgb(col, 0.62));
          c.fillStyle = g; c.fillRect(bx, by, bw, bh);
          c.fillStyle = pat.cells; c.fillRect(bx, by, bw, bh);
          // sense-amp / decoder strip
          c.fillStyle = rgb(col, 0.3); if (horiz) c.fillRect(bx, by + bh * 0.47, bw, bh * 0.06); else c.fillRect(bx + bw * 0.47, by, bw * 0.06, bh);
        }
        frame(c, x, y, w, h, col);
      },
      logic(c, x, y, w, h, col, R) {
        c.fillStyle = rgb(col, 0.2); c.fillRect(x, y, w, h);
        const n = Math.min(9000, (w * h) / 60);
        for (let i = 0; i < n; i++) {
          const k = R();
          c.fillStyle = rgb(col, 0.5 + k * 0.9, 0.18 + R() * 0.5);
          c.fillRect(x + R() * w, y + R() * h, 2 + R() * Math.min(26, w * 0.08), 1.5 + R() * 5);
        }
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
        c.fillStyle = pat.noise; c.globalAlpha = 0.9; c.fillRect(x, y, w, h);
        c.fillStyle = pat.rows; c.globalAlpha = 0.5; c.fillRect(x, y, w, h);
        c.restore();
        // a few embedded arrays
        const m = 2 + Math.floor(R() * 3);
        for (let i = 0; i < m; i++) {
          const aw = w * (0.12 + R() * 0.16), ah = h * (0.14 + R() * 0.2), ax = x + R() * (w - aw), ay = y + R() * (h - ah);
          c.fillStyle = rgb(col, 1.05, 0.85); c.fillRect(ax, ay, aw, ah);
          c.fillStyle = pat.cells; c.fillRect(ax, ay, aw, ah);
        }
        frame(c, x, y, w, h, col);
      },
      datapath(c, x, y, w, h, col, R) {
        c.fillStyle = rgb(col, 0.18); c.fillRect(x, y, w, h);
        const lanes = Math.max(3, Math.round(w / Math.max(18, h * 0.35)));
        for (let i = 0; i < lanes; i++) {
          const lx = x + (w / lanes) * i, lw = w / lanes;
          c.fillStyle = rgb(col, 0.45 + R() * 0.6, 0.9); c.fillRect(lx + lw * 0.06, y + h * 0.04, lw * 0.88, h * 0.92);
        }
        c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
        c.fillStyle = pat.cols; c.fillRect(x, y, w, h);
        c.fillStyle = pat.rows; c.globalAlpha = 0.6; c.fillRect(x, y, w, h);
        c.restore();
        frame(c, x, y, w, h, col);
      },
      analog(c, x, y, w, h, col, R) {
        c.fillStyle = rgb(col, 0.14); c.fillRect(x, y, w, h);
        const s = Math.max(10, Math.min(w, h) / 3.2), nx = Math.max(1, Math.floor(w / s)), ny = Math.max(1, Math.floor(h / s));
        const sx = w / nx, sy = h / ny;
        for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
          const ax = x + i * sx, ay = y + j * sy;
          c.strokeStyle = rgb(col, 1.1, 0.8); c.lineWidth = Math.max(1, s * 0.05);
          for (let k = 1; k <= 3; k++) { const q = (k / 4) * 0.5; c.strokeRect(ax + sx * q, ay + sy * q, sx * (1 - 2 * q), sy * (1 - 2 * q)); }
          c.fillStyle = rgb(col, 0.8, 0.5); c.fillRect(ax + sx * 0.44, ay + sy * 0.44, sx * 0.12, sy * 0.12);
        }
        frame(c, x, y, w, h, col);
      },
      pat
    };
  }

  function drawPCore(c, P, x, y, w, h, seed) {
    const R = TD.rng(seed);
    c.fillStyle = '#070912'; c.fillRect(x, y, w, h);
    TD.CORE_BLOCKS.forEach((b) => P[b.kind](c, x + b.x * w, y + b.y * h, b.w * w, b.h * h, DIE_COLS[b.col], R));
    // power / clock spine
    c.fillStyle = 'rgba(226,178,90,0.5)';
    [0.31, 0.545, 0.725].forEach((v) => c.fillRect(x + w * 0.04, y + v * h - Math.max(1, h * 0.002), w * 0.92, Math.max(2, h * 0.004)));
    c.strokeStyle = 'rgba(190,205,255,0.5)'; c.lineWidth = Math.max(1.5, w * 0.006); c.strokeRect(x, y, w, h);
  }

  function drawECore(c, P, x, y, w, h, seed) {
    const R = TD.rng(seed);
    c.fillStyle = '#070912'; c.fillRect(x, y, w, h);
    P.sram(c, x + w * 0.06, y + h * 0.05, w * 0.88, h * 0.2, DIE_COLS[1], R);
    P.logic(c, x + w * 0.06, y + h * 0.29, w * 0.42, h * 0.36, DIE_COLS[3], R);
    P.datapath(c, x + w * 0.52, y + h * 0.29, w * 0.42, h * 0.36, DIE_COLS[4], R);
    P.sram(c, x + w * 0.06, y + h * 0.69, w * 0.5, h * 0.26, DIE_COLS[2], R);
    P.logic(c, x + w * 0.6, y + h * 0.69, w * 0.34, h * 0.26, DIE_COLS[0], R);
    c.strokeStyle = 'rgba(190,205,255,0.45)'; c.lineWidth = Math.max(1, w * 0.008); c.strokeRect(x, y, w, h);
  }

  function drawDie(c, W, H) {
    const P = makePainters(c), R = TD.rng(1234), F = TD.FLOOR;
    c.fillStyle = '#05060c'; c.fillRect(0, 0, W, H);
    c.fillStyle = P.pat.noise; c.globalAlpha = 0.5; c.fillRect(0, 0, W, H); c.globalAlpha = 1;
    F.blocks.forEach((b) => {
      const x = b.x * W, y = b.y * H, w = b.w * W, h = b.h * H;
      if (b.kind === 'gpu') {
        // execution-unit slices + shared blocks
        const rows = 8;
        for (let i = 0; i < rows; i++) {
          const ry = y + (h * 0.78 / rows) * i, rh = (h * 0.78) / rows - H * 0.006;
          P.datapath(c, x, ry, w * 0.62, rh, DIE_COLS[0], R);
          P.logic(c, x + w * 0.65, ry, w * 0.35, rh, DIE_COLS[1], R);
        }
        P.sram(c, x, y + h * 0.8, w, h * 0.09, DIE_COLS[2], R);
        P.logic(c, x, y + h * 0.91, w, h * 0.09, DIE_COLS[5], R);
      } else if (b.kind === 'l3') {
        const n = 6;
        for (let i = 0; i < n; i++) P.sram(c, x + (w / n) * i + 2, y, w / n - 4, h * 0.4, DIE_COLS[0], R);
        P.datapath(c, x, y + h * 0.44, w, h * 0.12, DIE_COLS[4], R);
        for (let i = 0; i < n; i++) P.sram(c, x + (w / n) * i + 2, y + h * 0.6, w / n - 4, h * 0.4, DIE_COLS[0], R);
      } else P[b.kind](c, x, y, w, h, DIE_COLS[b.id === 'imc' ? 3 : b.id === 'pmu' ? 5 : 2], R);
    });
    F.pcores.forEach((b, i) => drawPCore(c, P, b.x * W, b.y * H, b.w * W, b.h * H, 500 + i));
    F.ecores.forEach((b, i) => drawECore(c, P, b.x * W, b.y * H, b.w * W, b.h * H, 900 + i));
    // seal ring + alignment marks
    c.strokeStyle = 'rgba(226,178,90,0.75)'; c.lineWidth = W * 0.0022; c.strokeRect(W * 0.008, H * 0.012, W * 0.984, H * 0.976);
    c.strokeStyle = 'rgba(160,180,255,0.4)'; c.lineWidth = W * 0.0008; c.strokeRect(W * 0.012, H * 0.018, W * 0.976, H * 0.964);
    c.fillStyle = 'rgba(226,178,90,0.9)';
    [[0.985, 0.975], [0.985, 0.022]].forEach(([u, v]) => { c.fillRect(u * W - 14, v * H - 2, 28, 4); c.fillRect(u * W - 2, v * H - 14, 4, 28); });
  }

  // ---- public factory ---------------------------------------------------
  TD.makeTextures = function (T) {
    const canvasTex = (w, h, draw) => {
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      draw(c.getContext('2d'), w, h);
      const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 16; return t;
    };

    const brushed = canvasTex(512, 512, (c, w, h) => {
      const R = TD.rng(7);
      c.fillStyle = 'rgb(128,128,128)'; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 2200; i++) { const v = 96 + R() * 68; c.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',0.45)'; c.fillRect(R() * w - 100, R() * h, 120 + R() * 380, 1); }
    });
    brushed.colorSpace = T.NoColorSpace; brushed.wrapS = brushed.wrapT = T.RepeatWrapping; brushed.repeat.set(0.07, 0.07);

    const chip = canvasTex(256, 256, (c, w, h) => {
      c.fillStyle = '#121316'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2c2f34'; c.beginPath(); c.arc(30, 30, 10, 0, Math.PI * 2); c.fill();
      c.fillStyle = '#6a6e76'; c.font = '500 30px ' + FONT_MONO;
      c.fillText('D5-8G', 56, 118); c.font = '400 22px ' + FONT_MONO; c.fillStyle = '#54585f'; c.fillText('2634 C1', 56, 156); c.fillText('KR-08', 56, 190);
    });

    const label = (text, sub, bg, fg) => canvasTex(512, 256, (c, w, h) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = fg; c.font = '600 54px ' + FONT_TEXT; c.fillText(text, 36, 110);
      c.font = '400 28px ' + FONT_MONO; c.fillText(sub, 36, 168);
      c.fillRect(36, 200, 440, 3);
      for (let i = 0; i < 26; i++) c.fillRect(380 + i * 4, 40, i % 3 ? 2 : 3, 44);
    });

    const pcb = (CW, CH, toC) => canvasTex(CW, CH, (c) => {
      const R = TD.rng(42);
      c.fillStyle = '#081b16'; c.fillRect(0, 0, CW, CH);
      // copper pours
      for (let i = 0; i < 40; i++) { c.fillStyle = 'rgba(16,58,46,' + (0.35 + R() * 0.4) + ')'; c.fillRect(R() * CW, R() * CH, 60 + R() * 320, 40 + R() * 200); }
      c.lineCap = 'round'; c.lineJoin = 'round';
      for (let i = 0; i < 420; i++) {
        let x = R() * CW, y = R() * CH;
        c.strokeStyle = R() < 0.85 ? '#13503d' : '#1a6a50'; c.lineWidth = 1.2 + R() * 2.6; c.beginPath(); c.moveTo(x, y);
        for (let k = 0; k < 5; k++) { const L = 20 + R() * 150; const d = Math.floor(R() * 4); if (d === 0) x += L; else if (d === 1) x -= L; else if (d === 2) y += L; else { x += L * 0.7; y += L * 0.7; } c.lineTo(x, y); }
        c.stroke();
        c.fillStyle = '#c9a24a'; c.beginPath(); c.arc(x, y, 3.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = '#04100c'; c.beginPath(); c.arc(x, y, 1.3, 0, Math.PI * 2); c.fill();
      }
      // bus bundles
      for (let i = 0; i < 14; i++) {
        const x0 = R() * CW * 0.8, y0 = R() * CH * 0.9, len = 160 + R() * 360, vert = R() < 0.4;
        c.strokeStyle = '#17604a'; c.lineWidth = 1.4;
        for (let k = 0; k < 12; k++) { c.beginPath(); if (vert) { c.moveTo(x0 + k * 4, y0); c.lineTo(x0 + k * 4, y0 + len); } else { c.moveTo(x0, y0 + k * 4); c.lineTo(x0 + len, y0 + k * 4); } c.stroke(); }
      }
      c.fillStyle = '#b8933f';
      for (let i = 0; i < 620; i++) c.fillRect(R() * CW, R() * CH, 4 + R() * 6, 3 + R() * 4);
      c.strokeStyle = 'rgba(230,235,240,0.7)'; c.fillStyle = 'rgba(230,235,240,0.75)'; c.lineWidth = 2;
      c.font = '500 17px ' + FONT_MONO;
      const box = (x, z, w, d, t) => { const [a, b] = toC(x - w / 2, z - d / 2); const [e, f] = toC(x + w / 2, z + d / 2); c.strokeRect(a, b, e - a, f - b); if (t) c.fillText(t, a, b - 8); };
      box(-2.2, -6.6, 3.9, 3.9, 'U1'); box(5.4, -1.4, 8.3, 2.5, 'J_M2'); box(-2.4, -1.5, 2.5, 3.3, 'J_WLAN');
      box(-7.8, -2.4, 7.2, 3.3, 'DIMM1'); box(-7.8, 0.7, 7.2, 3.3, 'DIMM2');
      [[-12.8, -1.4], [12.8, -1.4], [-7.1, -9.3], [7.1, -9.3], [0, 1.4]].forEach(([x, z]) => { const [a, b] = toC(x, z); c.strokeStyle = '#d8ab4c'; c.lineWidth = 6; c.beginPath(); c.arc(a, b, 14, 0, Math.PI * 2); c.stroke(); });
      c.fillStyle = 'rgba(230,235,240,0.75)'; c.font = '600 24px ' + FONT_TEXT;
      const [lx, ly] = toC(9.2, 1.3); c.fillText('CARTE MÈRE  REV 2.1', lx, ly);
      c.font = '400 15px ' + FONT_MONO; c.fillText('94V-0   E218460   2634', lx, ly + 24);
    });

    const drawScreen = (ctx, w, h) => {
      ctx.fillStyle = '#05070d'; ctx.fillRect(0, 0, w, h);
      const blob = (x, y, r, col) => { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); };
      blob(1700, 180, 1100, 'rgba(98,84,255,0.55)');
      blob(300, 1250, 1000, 'rgba(34,190,220,0.40)');
      blob(1250, 900, 700, 'rgba(244,114,182,0.22)');
      ctx.fillStyle = '#7DE3F4';
      ctx.font = '500 34px ' + FONT_MONO;
      ctx.fillText('DÉFILER  POUR  DÉMONTER', 160, 300);
      ctx.fillStyle = '#f4f6fa';
      ctx.font = '600 190px ' + FONT_DISPLAY;
      ctx.fillText('À l’intérieur.', 150, 540);
      ctx.fillStyle = 'rgba(220,228,240,0.72)';
      ctx.font = '400 44px ' + FONT_TEXT;
      ctx.fillText('Du châssis jusqu’à un seul cœur.', 160, 660);
      const tl = (x, col) => { ctx.fillStyle = col; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, 940, 400, 200, 28); else ctx.rect(x, 940, 400, 200); ctx.fill(); };
      const g1 = ctx.createLinearGradient(676, 940, 1076, 1140); g1.addColorStop(0, '#7DE3F4'); g1.addColorStop(1, '#5b8cff'); tl(676, g1);
      const g2 = ctx.createLinearGradient(1092, 940, 1492, 1140); g2.addColorStop(0, '#ffb86b'); g2.addColorStop(1, '#f472b6'); tl(1092, g2);
      tl(1508, '#eef1f6');
    };

    // subpixel patch sampled from the real screen image
    const patch = (screenCanvas, PX, PY, S, sx, sy, step) => {
      const src = screenCanvas.getContext('2d').getImageData(sx, sy, PX * step, PY * step).data;
      const t = canvasTex(PX * S, PY * S, (c) => {
        c.fillStyle = '#000'; c.fillRect(0, 0, PX * S, PY * S);
        for (let i = 0; i < PX; i++) for (let j = 0; j < PY; j++) {
          const o = ((j * step) * PX * step + i * step) * 4;
          const col = [src[o], src[o + 1], src[o + 2]];
          for (let k = 0; k < 3; k++) {
            const v = col[k];
            c.fillStyle = k === 0 ? 'rgb(' + v + ',' + Math.round(v * 0.08) + ',' + Math.round(v * 0.05) + ')' : k === 1 ? 'rgb(' + Math.round(v * 0.1) + ',' + v + ',' + Math.round(v * 0.15) + ')' : 'rgb(' + Math.round(v * 0.1) + ',' + Math.round(v * 0.2) + ',' + v + ')';
            c.beginPath(); if (c.roundRect) c.roundRect(i * S + 2 + k * 10, j * S + 3, 8, S - 6, 2); else c.rect(i * S + 2 + k * 10, j * S + 3, 8, S - 6); c.fill();
          }
        }
      });
      return t;
    };

    const keys = (W, H, rects) => canvasTex(W, H, (c) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = 'rgba(236,242,250,0.92)'; c.textAlign = 'center'; c.textBaseline = 'middle';
      rects.forEach((k) => {
        if (k.t.length > 1 && k.t.indexOf('|') > 0) {
          const [a, b] = k.t.split('|');
          c.font = '500 ' + Math.round(k.h * 0.3) + 'px ' + FONT_TEXT; c.fillText(a, k.x + k.w * 0.36, k.y + k.h * 0.62);
          c.font = '500 ' + Math.round(k.h * 0.2) + 'px ' + FONT_TEXT; c.fillText(b, k.x + k.w * 0.7, k.y + k.h * 0.32);
          return;
        }
        const big = k.t.length === 1;
        c.font = (big ? '500 ' + Math.round(k.h * 0.34) : '500 ' + Math.round(Math.min(k.h * 0.2, 26))) + 'px ' + FONT_TEXT;
        c.fillText(k.t, k.x + k.w / 2, k.y + k.h / 2 + 1);
      });
    });

    const die = canvasTex(4096, 2768, drawDie);
    const core = canvasTex(1536, 2392, (c, w, h) => drawPCore(c, makePainters(c), 0, 0, w, h, 500));

    const substrate = canvasTex(512, 512, (c, w, h) => {
      const R = TD.rng(5);
      c.fillStyle = '#14402f'; c.fillRect(0, 0, w, h);
      c.strokeStyle = 'rgba(40,120,90,0.6)'; c.lineWidth = 1;
      for (let i = 0; i < 300; i++) { const a = R() * Math.PI * 2, r0 = 120 + R() * 60, r1 = 250; c.beginPath(); c.moveTo(256 + Math.cos(a) * r0, 256 + Math.sin(a) * r0); c.lineTo(256 + Math.cos(a) * r1, 256 + Math.sin(a) * r1); c.stroke(); }
      c.fillStyle = '#d8ab4c'; c.beginPath(); c.moveTo(14, 498); c.lineTo(44, 498); c.lineTo(14, 468); c.fill();
      c.fillStyle = 'rgba(220,230,225,0.55)'; c.font = '500 15px ' + FONT_MONO; c.fillText('i5-1345U  2634', 290, 500);
    });

    return { canvasTex, brushed, chip, label, pcb, drawScreen, patch, keys, die, core, substrate };
  };
})();
