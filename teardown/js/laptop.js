/* Teardown — laptop model, built from primitives. */
(function () {
  const TD = window.TD;

  TD.buildLaptop = function (T, scene, tex) {
    const rr = (w, d, r) => {
      const s = new T.Shape(); const x = -w / 2, y = -d / 2; r = Math.min(r, w / 2, d / 2);
      s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
      s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
      s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
      s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
      return s;
    };
    const rbox = (w, h, d, r, bev) => {
      const b = bev ?? Math.min(0.04, h / 4);
      const g = new T.ExtrudeGeometry(rr(w - 2 * b, d - 2 * b, Math.max(0.001, r - b)), { depth: Math.max(0.001, h - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 3, curveSegments: 10 });
      g.rotateX(-Math.PI / 2); g.translate(0, b, 0); return g;
    };
    const flat = (m) => { m.rotation.x = -Math.PI / 2; return m; };

    const M = {
      alu: new T.MeshPhysicalMaterial({ color: 0xd2d5da, metalness: 0.88, roughness: 0.46, roughnessMap: tex.brushed, clearcoat: 0.08, clearcoatRoughness: 0.5 }),
      aluIn: new T.MeshStandardMaterial({ color: 0x8f949b, metalness: 1, roughness: 0.52 }),
      keycap: new T.MeshStandardMaterial({ color: 0x131417, roughness: 0.62 }),
      well: new T.MeshStandardMaterial({ color: 0x08090b, roughness: 0.85 }),
      pad: new T.MeshPhysicalMaterial({ color: 0xa3a8af, metalness: 0.6, roughness: 0.3, clearcoat: 0.5, clearcoatRoughness: 0.25 }),
      glass: new T.MeshPhysicalMaterial({ color: 0x040506, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02 }),
      plastic: new T.MeshStandardMaterial({ color: 0x131518, roughness: 0.55, side: T.DoubleSide }),
      blade: new T.MeshStandardMaterial({ color: 0x22262b, roughness: 0.42, side: T.DoubleSide }),
      copper: new T.MeshPhysicalMaterial({ color: 0xd4875a, metalness: 1, roughness: 0.24, clearcoat: 0.35, clearcoatRoughness: 0.2 }),
      fin: new T.MeshStandardMaterial({ color: 0xcfa27f, metalness: 1, roughness: 0.33 }),
      steel: new T.MeshStandardMaterial({ color: 0x8a8f96, metalness: 1, roughness: 0.3 }),
      gold: new T.MeshStandardMaterial({ color: 0xdcae4e, metalness: 1, roughness: 0.2 }),
      pcbEdge: new T.MeshStandardMaterial({ color: 0x0a1c15, roughness: 0.6 }),
      substrate: new T.MeshStandardMaterial({ map: tex.substrate, roughness: 0.38 }),
      die: new T.MeshPhysicalMaterial({ color: 0x12151a, metalness: 0.4, roughness: 0.07, clearcoat: 1, clearcoatRoughness: 0.03, iridescence: 0.6, iridescenceIOR: 1.6 }),
      chip: new T.MeshStandardMaterial({ map: tex.chip, roughness: 0.46 }),
      chipPlain: new T.MeshStandardMaterial({ color: 0x121316, roughness: 0.46 }),
      greenPcb: new T.MeshStandardMaterial({ color: 0x174a37, roughness: 0.42 }),
      blackPcb: new T.MeshStandardMaterial({ color: 0x121417, roughness: 0.42 }),
      bluePcb: new T.MeshStandardMaterial({ color: 0x143346, roughness: 0.42 }),
      cell: new T.MeshPhysicalMaterial({ color: 0x17191e, roughness: 0.36, clearcoat: 0.8, clearcoatRoughness: 0.18 }),
      cable: new T.MeshStandardMaterial({ color: 0x0c0d0f, roughness: 0.5 }),
      cam: new T.MeshPhysicalMaterial({ color: 0x0a0c10, roughness: 0.05, metalness: 0.5, clearcoat: 1 }),
      cap: new T.MeshStandardMaterial({ color: 0x9a7a4c, roughness: 0.45, metalness: 0.3 })
    };

    const add = (parent, geo, mat, x, y, z) => { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); parent.add(m); return m; };
    const mtx = new T.Matrix4(), col = new T.Color();
    const laptop = new T.Group(); scene.add(laptop);

    // ---------- base shell ----------
    add(laptop, rbox(30, 0.16, 21, 1.2, 0.05), M.alu);
    const ring = rr(30, 21, 1.2); ring.holes.push(rr(29.4, 20.4, 0.9));
    const wallGeo = new T.ExtrudeGeometry(ring, { depth: 1.14, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 10 });
    wallGeo.rotateX(-Math.PI / 2);
    add(laptop, wallGeo, M.alu, 0, 0.16, 0);
    flat(add(laptop, new T.PlaneGeometry(29.3, 20.3), M.aluIn, 0, 0.165, 0));
    [-4.2, -2.7].forEach((z) => add(laptop, rbox(0.06, 0.3, 0.9, 0.12, 0.01), M.cable, -15.0, 0.6, z));
    add(laptop, rbox(0.06, 0.3, 0.9, 0.12, 0.01), M.cable, 15.0, 0.6, -4.0);
    // chassis screw bosses
    [[-14.2, 9.6], [14.2, 9.6], [-14.2, -9.6], [14.2, -9.6], [0, 9.8]].forEach(([x, z]) => { add(laptop, new T.CylinderGeometry(0.26, 0.3, 0.9, 20), M.aluIn, x, 0.6, z); add(laptop, new T.CylinderGeometry(0.11, 0.11, 0.02, 12), M.well, x, 1.06, z); });

    // ---------- motherboard ----------
    const pcbShape = new T.Shape();
    [[-13.4, -2.0], [13.4, -2.0], [13.4, 3.9], [7.7, 3.9], [7.7, 9.9], [-7.7, 9.9], [-7.7, 3.9], [-13.4, 3.9]].forEach((p, i) => (i ? pcbShape.lineTo(p[0], p[1]) : pcbShape.moveTo(p[0], p[1])));
    const pcbBody = new T.ExtrudeGeometry(pcbShape, { depth: 0.1, bevelEnabled: false }); pcbBody.rotateX(-Math.PI / 2);
    add(laptop, pcbBody, M.pcbEdge, 0, 0.35, 0);
    const CW = 2048, CH = Math.round((2048 * 11.9) / 26.8);
    const pcbTex = tex.pcb(CW, CH, (x, z) => [((x + 13.4) / 26.8) * CW, ((9.9 + z) / 11.9) * CH]);
    pcbTex.repeat.set(1 / 26.8, 1 / 11.9); pcbTex.offset.set(13.4 / 26.8, 2.0 / 11.9);
    const pcbTop = new T.ShapeGeometry(pcbShape); pcbTop.rotateX(-Math.PI / 2);
    add(laptop, pcbTop, new T.MeshStandardMaterial({ map: pcbTex, roughness: 0.36, metalness: 0.08 }), 0, 0.452, 0);
    [[-12.8, -1.4], [12.8, -1.4], [-7.1, -9.3], [7.1, -9.3], [0, 1.4]].forEach(([x, z]) => {
      add(laptop, new T.CylinderGeometry(0.2, 0.2, 0.07, 20), M.steel, x, 0.49, z);
      const s = add(laptop, new T.BoxGeometry(0.24, 0.02, 0.05), M.well, x, 0.53, z); s.rotation.y = x * 1.7;
    });

    // surface-mount parts
    const R2 = TD.rng(9);
    const keep = [[-2.2, -6.6, 2.1, 2.1], [5.4, -1.4, 4.3, 1.4], [-2.4, -1.5, 1.3, 1.7], [-7.8, -0.9, 3.9, 3.6]];
    const smd = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshStandardMaterial({ roughness: 0.4, metalness: 0.25 }), 900);
    const pal = [0x2a2a2a, 0x8b6a3e, 0xbfc3c8, 0x1a1a1a, 0x6e5233, 0x3a3027];
    let n = 0;
    while (n < 900) {
      const x = -13.2 + R2() * 26.4, z = -9.7 + R2() * 11.6;
      if (!((z >= -3.9 && z <= 1.9) || Math.abs(x) <= 7.5)) continue;
      if (keep.some((k) => Math.abs(x - k[0]) < k[2] && Math.abs(z - k[1]) < k[3])) continue;
      const big = R2() < 0.1; const w = big ? 0.36 : 0.1 + R2() * 0.1, d = big ? 0.3 : 0.06 + R2() * 0.05, h = big ? 0.12 : 0.05;
      mtx.makeRotationY(R2() < 0.5 ? 0 : Math.PI / 2); mtx.scale(new T.Vector3(w, h, d)); mtx.setPosition(x, 0.452 + h / 2, z);
      smd.setMatrixAt(n, mtx); smd.setColorAt(n, col.setHex(pal[Math.floor(R2() * pal.length)])); n++;
    }
    laptop.add(smd);
    // power stage: inductors + polymer caps beside the CPU
    for (let i = 0; i < 6; i++) add(laptop, rbox(0.62, 0.3, 0.62, 0.08, 0.03), M.chipPlain, -5.0, 0.452, -8.9 + i * 0.78);
    for (let i = 0; i < 5; i++) add(laptop, new T.CylinderGeometry(0.2, 0.2, 0.26, 20), M.steel, -5.85, 0.58, -8.7 + i * 0.8);

    // ---------- CPU ----------
    add(laptop, rbox(3.6, 0.08, 3.6, 0.12, 0.02), M.substrate, -2.2, 0.452, -6.6);
    add(laptop, rbox(2.2, 0.07, 1.5, 0.04, 0.012), M.die, -2.55, 0.532, -6.9);
    add(laptop, rbox(0.9, 0.07, 1.2, 0.04, 0.012), M.die, -0.75, 0.532, -6.9);
    const caps = new T.InstancedMesh(new T.BoxGeometry(0.16, 0.06, 0.08), M.cap, 60);
    let ci0 = 0;
    for (let i = 0; i < 15; i++) { mtx.makeTranslation(-3.55 + i * 0.19, 0.56, -5.3); caps.setMatrixAt(ci0++, mtx); }
    for (let i = 0; i < 15; i++) { mtx.makeTranslation(-3.55 + i * 0.19, 0.56, -8.02); caps.setMatrixAt(ci0++, mtx); }
    for (let i = 0; i < 15; i++) { mtx.makeTranslation(-3.55 + i * 0.19, 0.56, -5.52); caps.setMatrixAt(ci0++, mtx); }
    for (let i = 0; i < 15; i++) { mtx.makeRotationY(Math.PI / 2); mtx.setPosition(-0.1, 0.56, -7.9 + i * 0.17); caps.setMatrixAt(ci0++, mtx); }
    laptop.add(caps);

    // die floorplan (revealed by a scan), core activity, single-core close-up
    const D = TD.DIE;
    const dieGroup = new T.Group(); laptop.add(dieGroup);
    const clip = new T.Plane(new T.Vector3(-1, 0, 0), 0);
    const floorMat = new T.MeshPhysicalMaterial({ map: tex.die, emissive: 0xffffff, emissiveMap: tex.die, emissiveIntensity: 0.7, metalness: 0.25, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.35, iridescence: 0.6, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 520], envMapIntensity: 0.45, transparent: true, opacity: 0, depthWrite: false, clippingPlanes: [clip] });
    const floor = flat(add(dieGroup, new T.PlaneGeometry(D.w, D.d), floorMat, D.cx, D.y, D.cz)); floor.renderOrder = 2;
    const coreGlow = [];
    TD.FLOOR.pcores.concat(TD.FLOOR.ecores).forEach((b, i) => {
      const m = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, clippingPlanes: [clip] });
      const p = TD.dieToWorld(b.x + b.w / 2, b.y + b.h / 2, 0.0006);
      const q = flat(add(dieGroup, new T.PlaneGeometry(b.w * D.w, b.h * D.d), m, p[0], p[1], p[2])); q.renderOrder = 3;
      coreGlow.push({ m, seed: i * 1.37 + 0.5, p: b.kind === 'pcore' });
    });
    const hc = TD.HERO_CORE, hp = TD.dieToWorld(hc.x + hc.w / 2, hc.y + hc.h / 2, 0.0012);
    const coreMat = new T.MeshPhysicalMaterial({ map: tex.core, emissive: 0xffffff, emissiveMap: tex.core, emissiveIntensity: 0.7, metalness: 0.25, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.35, iridescence: 0.6, iridescenceIOR: 1.6, iridescenceThicknessRange: [180, 520], envMapIntensity: 0.45, transparent: true, opacity: 0, depthWrite: false });
    const corePatch = flat(add(dieGroup, new T.PlaneGeometry(hc.w * D.w, hc.h * D.d), coreMat, hp[0], hp[1], hp[2])); corePatch.renderOrder = 4;
    const scanMat = new T.MeshBasicMaterial({ color: new T.Color(2.2, 3.4, 4), transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    const scan = add(dieGroup, new T.BoxGeometry(0.012, 0.004, D.d + 0.06), scanMat, D.cx, D.y + 0.004, D.cz); scan.renderOrder = 5;
    dieGroup.traverse((o) => { o.userData.noShadow = true; });

    // ---------- I/O daughterboard (right rear): no discrete GPU on this machine ----------
    add(laptop, new T.BoxGeometry(5.0, 0.1, 5.2), M.greenPcb, 10.7, 0.4, -6.9);
    add(laptop, rbox(1.3, 0.55, 1.5, 0.06, 0.02), M.steel, 12.6, 0.45, -8.4);
    add(laptop, rbox(1.3, 0.55, 1.5, 0.06, 0.02), M.steel, 12.6, 0.45, -6.4);
    add(laptop, rbox(0.9, 0.5, 0.9, 0.06, 0.02), M.plastic, 12.7, 0.45, -4.9);
    add(laptop, rbox(1.1, 0.1, 1.1, 0.05, 0.015), M.chipPlain, 10.2, 0.45, -7.6);
    add(laptop, rbox(0.7, 0.09, 0.9, 0.05, 0.015), M.chip, 10.4, 0.45, -5.6);
    for (let i = 0; i < 5; i++) add(laptop, new T.BoxGeometry(0.2, 0.06, 0.12), M.cap, 9.0 + i * 0.4, 0.48, -8.9);
    add(laptop, new T.BoxGeometry(1.6, 0.03, 2.4), new T.MeshStandardMaterial({ color: 0xb98a4a, roughness: 0.5 }), 8.0, 0.47, -5.2);

    // ---------- RAM ----------
    const ramSticks = [];
    const ram = (z) => {
      add(laptop, rbox(7.4, 0.42, 0.55, 0.05, 0.02), M.plastic, -7.8, 0.452, z - 1.55);
      [-3.55, 3.55].forEach((dx) => add(laptop, rbox(0.3, 0.36, 2.9, 0.05, 0.02), M.steel, -7.8 + dx, 0.452, z + 0.1));
      const piv = new T.Group(); piv.position.set(-7.8, 0.62, z - 1.5); laptop.add(piv);
      const g = new T.Group(); g.position.set(0, 0, 1.5); piv.add(g);
      add(g, new T.BoxGeometry(6.8, 0.08, 3.0), M.greenPcb);
      for (let i = 0; i < 4; i++) add(g, rbox(1.25, 0.1, 1.0, 0.05, 0.015), M.chip, -2.4 + i * 1.6, 0.04, 0.1);
      add(g, rbox(0.5, 0.07, 0.4, 0.03, 0.01), M.chipPlain, 0, 0.04, -0.9);
      add(g, new T.BoxGeometry(6.2, 0.02, 0.32), M.gold, 0, 0.045, -1.32);
      const lab = new T.Mesh(new T.PlaneGeometry(2.4, 0.6), new T.MeshStandardMaterial({ map: tex.label('SO-DIMM', 'DDR5-5200  8GB', '#b9bcc2', '#15171a'), roughness: 0.6 }));
      lab.rotation.x = -Math.PI / 2; lab.position.set(1.7, 0.042, 1.05); g.add(lab);
      ramSticks.push(piv);
    };
    ram(-2.4); ram(0.75);

    // ---------- Wi-Fi ----------
    add(laptop, new T.BoxGeometry(2.2, 0.08, 3.0), M.bluePcb, -2.4, 0.56, -1.5);
    add(laptop, rbox(1.6, 0.14, 1.6, 0.05, 0.02), M.steel, -2.4, 0.6, -1.8);
    [-2.9, -1.9].forEach((x, i) => {
      add(laptop, new T.CylinderGeometry(0.12, 0.12, 0.08, 16), M.gold, x, 0.66, -0.6);
      const cv = new T.CatmullRomCurve3([new T.Vector3(x, 0.7, -0.6), new T.Vector3(-3.85 - i * 0.14, 0.6, -0.1), new T.Vector3(-3.95 - i * 0.14, 0.6, -3.4), new T.Vector3(-4.3 - i * 0.2, 1.0, -4.6), new T.Vector3(-5.5 - i * 0.3, 1.2, -8.2), new T.Vector3(-5.8 - i * 0.3, 1.2, -10.0)]);
      add(laptop, new T.TubeGeometry(cv, 80, 0.045, 8), M.cable);
    });

    // ---------- SSD ----------
    const ssdPivot = new T.Group(); ssdPivot.position.set(1.5, 0.56, -1.4); laptop.add(ssdPivot);
    const ssd = new T.Group(); ssd.position.set(3.9, 0, 0); ssdPivot.add(ssd);
    add(ssd, new T.BoxGeometry(8.0, 0.08, 2.2), M.blackPcb);
    add(ssd, new T.BoxGeometry(0.5, 0.02, 1.9), M.gold, -3.7, 0.045, 0);
    add(ssd, rbox(1.0, 0.1, 1.0, 0.05, 0.015), M.chipPlain, -2.6, 0.04, 0);
    add(ssd, rbox(0.8, 0.09, 0.6, 0.05, 0.015), M.chip, -1.4, 0.04, 0.4);
    add(ssd, rbox(2.0, 0.11, 1.5, 0.05, 0.015), M.chip, 0.3, 0.04, 0);
    add(ssd, rbox(2.0, 0.11, 1.5, 0.05, 0.015), M.chip, 2.5, 0.04, 0);
    add(ssd, new T.CylinderGeometry(0.28, 0.28, 0.12, 24), M.steel, 3.75, 0.08, 0);
    add(laptop, new T.BoxGeometry(0.6, 0.35, 2.4), M.plastic, 1.2, 0.6, -1.4);
    const ssdLab = new T.Mesh(new T.PlaneGeometry(1.7, 0.85), new T.MeshStandardMaterial({ map: tex.label('NVMe 512GB', 'M.2 2280  PCIe 4.0', '#b4b8be', '#131518'), roughness: 0.6 }));
    ssdLab.rotation.x = -Math.PI / 2; ssdLab.position.set(-1.0, 0.135, -0.45); ssd.add(ssdLab);

    // ---------- battery ----------
    add(laptop, new T.BoxGeometry(26.4, 0.1, 0.7), M.greenPcb, 0, 0.3, 2.9);
    for (let i = 0; i < 6; i++) add(laptop, rbox(0.6, 0.1, 0.4, 0.04, 0.015), M.chipPlain, -11 + i * 4.4, 0.35, 2.9);
    const cellLab = tex.label('Li-ion  51Wh', '3-CELL  POLYMER', '#1b1e23', '#9aa3ad');
    [-8.8, 0, 8.8].forEach((x) => {
      add(laptop, rbox(8.4, 0.72, 6.4, 0.35, 0.12), M.cell, x, 0.17, 6.55);
      const l = new T.Mesh(new T.PlaneGeometry(3.6, 1.8), new T.MeshStandardMaterial({ map: cellLab, roughness: 0.5 })); l.rotation.x = -Math.PI / 2; l.position.set(x, 0.895, 6.8); laptop.add(l);
      add(laptop, new T.BoxGeometry(1.2, 0.04, 0.5), M.steel, x, 0.42, 3.3);
    });
    const bcv = new T.CatmullRomCurve3([new T.Vector3(6.6, 0.4, 2.9), new T.Vector3(7.2, 0.62, 2.2), new T.Vector3(8.6, 0.6, 1.2)]);
    [-0.12, 0, 0.12].forEach((o, i) => { const m = add(laptop, new T.TubeGeometry(bcv, 30, 0.05, 8), new T.MeshStandardMaterial({ color: [0xb3261e, 0x0c0d0f, 0xd9d9d9][i], roughness: 0.5 })); m.position.x = o; });

    // ---------- cooling assembly ----------
    const cool = new T.Group(); laptop.add(cool);
    add(cool, rbox(3.0, 0.14, 3.0, 0.1, 0.03), M.copper, -2.2, 0.6, -6.6);
    [[-2.2, -6.6]].forEach(([x, z]) => {
      [Math.PI / 4, -Math.PI / 4].forEach((a) => { const b = add(cool, new T.BoxGeometry(4.6, 0.05, 0.38), M.steel, x, 1.12, z); b.rotation.y = a; });
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([sx, sz]) => {
        const px = x + sx * 1.6, pz = z + sz * 1.6;
        add(cool, new T.CylinderGeometry(0.2, 0.2, 0.12, 20), M.steel, px, 1.16, pz);
        add(cool, new T.BoxGeometry(0.26, 0.02, 0.05), M.well, px, 1.225, pz).rotation.y = px + pz;
        add(cool, new T.CylinderGeometry(0.08, 0.08, 0.7, 10), M.steel, px, 0.8, pz);
      });
    });
    const pipe = (pts) => { const g = new T.TubeGeometry(new T.CatmullRomCurve3(pts.map((p) => new T.Vector3(p[0], p[1], p[2]))), 200, 0.24, 18); const m = add(cool, g, M.copper); m.scale.y = 0.55; m.position.y = 0.42; return m; };
    pipe([[-12.6, 0.95, -9.8], [-8.5, 0.95, -9.8], [-5.8, 0.92, -8.3], [-3.6, 0.9, -6.6], [-0.7, 0.9, -6.6]]);
    const fins = new T.InstancedMesh(new T.BoxGeometry(0.03, 0.9, 0.8), M.fin, 44);
    let fi = 0;
    [-1].forEach((side) => { for (let i = 0; i < 44; i++) { mtx.makeTranslation(side * (8.2 + i * 0.11), 0.72, -9.8); fins.setMatrixAt(fi++, mtx); } });
    cool.add(fins);
    const fanBlades = [];
    [-10.3].forEach((x) => {
      const f = new T.Group(); f.position.set(x, 0.2, -6.8); cool.add(f);
      add(f, new T.CylinderGeometry(2.5, 2.5, 0.8, 64, 1, true), M.plastic, 0, 0.4, 0);
      flat(add(f, new T.CircleGeometry(2.5, 64), M.plastic, 0, 0.01, 0));
      flat(add(f, new T.RingGeometry(2.0, 2.5, 64), M.plastic, 0, 0.8, 0));
      add(f, new T.BoxGeometry(4.6, 0.8, 0.6), M.plastic, x < 0 ? 1.2 : -1.2, 0.4, -2.55);
      const rot = new T.Group(); rot.position.y = 0.4; f.add(rot); fanBlades.push(rot);
      add(rot, new T.CylinderGeometry(0.6, 0.6, 0.5, 32), M.blade);
      flat(add(rot, new T.CircleGeometry(0.6, 32), new T.MeshStandardMaterial({ color: 0x2e3238, metalness: 0.5, roughness: 0.3 }), 0, 0.251, 0));
      flat(add(rot, new T.RingGeometry(0.2, 0.42, 32), M.steel, 0, 0.253, 0));
      for (let i = 0; i < 13; i++) {
        const piv = new T.Group(); piv.rotation.y = (i / 13) * Math.PI * 2; rot.add(piv);
        const bl = add(piv, new T.BoxGeometry(1.75, 0.025, 0.42), M.blade, 1.45, 0, 0); bl.rotation.x = 0.55; bl.rotation.y = 0.18;
      }
    });

    // ---------- keyboard deck ----------
    const deck = new T.Group(); laptop.add(deck);
    const deckShape = rr(30, 21, 1.2);
    const kbHole = new T.Path(); { const w = 25.4, x0 = -w / 2, z0 = -9.75, z1 = 0.45; kbHole.moveTo(x0, -z0); kbHole.lineTo(x0 + w, -z0); kbHole.lineTo(x0 + w, -z1); kbHole.lineTo(x0, -z1); kbHole.lineTo(x0, -z0); }
    deckShape.holes.push(kbHole);
    const deckGeo = new T.ExtrudeGeometry(deckShape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.04, bevelSegments: 3, curveSegments: 10 });
    deckGeo.rotateX(-Math.PI / 2);
    add(deck, deckGeo, M.alu, 0, 1.31, 0);
    flat(add(deck, new T.PlaneGeometry(25.4, 10.2), M.well, 0, 1.36, -4.65));
    const capGeo = rbox(1.55, 0.14, 1.5, 0.16, 0.035);
    const u = 1.72;
    // Swiss layout (QWERTZ, ISO): "main|secondary" = two legends on one key
    const rows = [
      { d: 0.9, ks: Array(14).fill(1), t: ['esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12', 'del'] },
      { d: 1.5, ks: Array(14).fill(1), t: ['§|°', '1|+', '2|"', '3|*', '4|ç', '5|%', '6|&', '7|/', '8|(', '9|)', '0|=', "'|?", '^|`', '⌫'] },
      { d: 1.5, ks: Array(14).fill(1), t: ['tab'].concat('QWERTZUIOP'.split(''), ['ü|è', '¨|!', '']) },
      { d: 1.5, ks: Array(14).fill(1), t: ['caps'].concat('ASDFGHJKL'.split(''), ['ö|é', 'ä|à', '$|£', '↵']) },
      { d: 1.5, ks: [1].concat(Array(11).fill(1), [2]), t: ['⇧', '<|>'].concat('YXCVBNM'.split(''), [',|;', '.|:', '-|_', '⇧']) },
      { d: 1.5, ks: [1, 1, 1, 1, 5, 1, 1, 1, 1, 1], t: ['ctrl', 'fn', 'win', 'alt', '', 'alt gr', 'ctrl', '◀', '▲▼', '▶'] }
    ];
    let count = 0; rows.forEach((r) => { count += r.ks.length; });
    const kcaps = new T.InstancedMesh(capGeo, M.keycap, count);
    const KS = 100, kx0 = -12.7, kz0 = -9.75, rects = [];
    let ci = 0, z = -9.45;
    rows.forEach((r) => {
      let x = -7 * u;
      r.ks.forEach((k, i) => {
        const w = k * u - 0.17;
        mtx.makeScale(w / 1.55, 1, r.d / 1.5); mtx.setPosition(x + (k * u) / 2, 1.38, z + r.d / 2); kcaps.setMatrixAt(ci++, mtx);
        rects.push({ t: r.t[i] || '', x: (x + 0.085 - kx0) * KS, y: (z - kz0) * KS, w: w * KS, h: r.d * KS });
        x += k * u;
      });
      z += r.d + 0.17;
    });
    deck.add(kcaps);
    const legends = flat(add(deck, new T.PlaneGeometry(25.4, 10.2), new T.MeshBasicMaterial({ map: tex.keys(2540, 1020, rects), transparent: true, depthWrite: false, toneMapped: false, color: 0xd6dde8 }), 0, 1.5215, -4.65));
    legends.userData.noShadow = true;
    add(deck, rbox(12, 0.03, 7.2, 0.45, 0.01), M.pad, 0, 1.535, 5.3);

    // ---------- hinge + lid ----------
    const hinge = add(laptop, new T.CylinderGeometry(0.34, 0.34, 21, 32), M.aluIn, 0, 1.3, -10.25); hinge.rotation.z = Math.PI / 2;
    const lid = new T.Group(); lid.position.set(0, 1.52, -10.3); lid.rotation.x = -1.83; laptop.add(lid);
    add(lid, rbox(30, 0.5, 20, 1.2, 0.06), M.alu, 0, 0, 10);
    const bez = add(lid, new T.PlaneGeometry(29.5, 19.5), M.glass, 0, -0.004, 10); bez.rotation.x = Math.PI / 2;
    const screenTex = tex.canvasTex(2048, 1280, tex.drawScreen);
    const screen = add(lid, new T.PlaneGeometry(28, 17.5), new T.MeshBasicMaterial({ map: screenTex, toneMapped: false }), 0, -0.008, 10.35);
    screen.rotation.x = Math.PI / 2;
    const camDot = add(lid, new T.CircleGeometry(0.12, 24), M.cam, 0, -0.01, 19.55); camDot.rotation.x = Math.PI / 2;
    // subpixel patch at true scale: one texture pixel of the screen = 0.137 mm
    const PX = 96, PY = 60, S = 32, PP = 28 / 2048;
    const patchTex = tex.patch(screenTex.image, PX, PY, S, 1452, 985, 1);
    patchTex.magFilter = T.NearestFilter;
    const patchMat = new T.MeshBasicMaterial({ map: patchTex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
    const patch = new T.Mesh(new T.PlaneGeometry(PX * PP, PY * PP), patchMat);
    patch.position.set((1500 / 2048 - 0.5) * 28, (0.5 - 1015 / 1280) * 17.5, 0.002);
    screen.add(patch);
    [screen, patch, bez].forEach((o) => { o.userData.noShadow = true; });

    laptop.traverse((o) => { if (o.isMesh && !o.userData.noShadow) { o.castShadow = true; o.receiveShadow = true; } });

    const fadeable = (group) => {
      const map = new Map(), mats = [];
      group.traverse((o) => { if (o.isMesh) { if (!map.has(o.material)) { const m = o.material.clone(); m.transparent = true; map.set(o.material, m); mats.push(m); } o.material = map.get(o.material); } });
      return mats;
    };

    return {
      laptop, deck, cool, deckMats: fadeable(deck), coolMats: fadeable(cool), fanBlades, ramSticks, ssdPivot,
      screen, screenTex, patch, patchMat, patchTex,
      clip, floorMat, coreMat, coreGlow, scan, scanMat
    };
  };
})();
