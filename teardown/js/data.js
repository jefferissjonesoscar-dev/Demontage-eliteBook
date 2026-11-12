/* Démontage — données des étapes, plan de la puce et utilitaires.
   Modèle de référence : HP EliteBook 840 G10, Intel Core i5-1345U vPro.
   1 unité de scène = 10 mm. */
(function () {
  const TD = (window.TD = {});

  TD.UNIT_MM = 10;

  // Puce CPU (face supérieure) dans le repère du portable
  TD.DIE = { cx: -2.55, cz: -6.9, w: 2.16, d: 1.46, y: 0.6035 };
  TD.dieToWorld = (nx, ny, lift) => [
    TD.DIE.cx - TD.DIE.w / 2 + nx * TD.DIE.w,
    TD.DIE.y + (lift || 0),
    TD.DIE.cz - TD.DIE.d / 2 + ny * TD.DIE.d
  ];

  // Plan de la puce, normalisé 0..1 (x → droite, y → avant) : 2 cœurs P + 8 cœurs E + graphique intégré
  const pc = [
    { id: 'p0', kind: 'pcore', x: 0.315, y: 0.04, w: 0.18, h: 0.40 },
    { id: 'p1', kind: 'pcore', x: 0.50, y: 0.04, w: 0.18, h: 0.40 }
  ];
  const ec = [];
  [0.315, 0.505].forEach((x0, c) => {
    for (let i = 0; i < 4; i++) ec.push({ id: 'e' + (c * 4 + i), kind: 'ecore', x: x0 + (i % 2) * 0.091, y: 0.58 + Math.floor(i / 2) * 0.194, w: 0.087, h: 0.188 });
  });
  TD.FLOOR = {
    pcores: pc,
    ecores: ec,
    blocks: [
      { id: 'igpu', kind: 'gpu', x: 0.02, y: 0.04, w: 0.28, h: 0.74 },
      { id: 'media', kind: 'analog', x: 0.02, y: 0.80, w: 0.28, h: 0.16 },
      { id: 'l3', kind: 'l3', x: 0.315, y: 0.455, w: 0.56, h: 0.11 },
      { id: 'sys', kind: 'logic', x: 0.695, y: 0.04, w: 0.18, h: 0.40 },
      { id: 'disp', kind: 'analog', x: 0.695, y: 0.58, w: 0.18, h: 0.38 },
      { id: 'imc', kind: 'logic', x: 0.885, y: 0.04, w: 0.095, h: 0.26 },
      { id: 'pcie', kind: 'analog', x: 0.885, y: 0.32, w: 0.095, h: 0.22 },
      { id: 'tb', kind: 'analog', x: 0.885, y: 0.56, w: 0.095, h: 0.2 },
      { id: 'pmu', kind: 'logic', x: 0.885, y: 0.78, w: 0.095, h: 0.18 }
    ]
  };
  TD.HERO_CORE = pc[0];

  // Blocs à l'intérieur d'un cœur P, normalisés par rapport au cœur
  TD.CORE_BLOCKS = [
    { id: 'l2', kind: 'sram', col: 0, x: 0.04, y: 0.03, w: 0.50, h: 0.27 },
    { id: 'l1d', kind: 'sram', col: 1, x: 0.57, y: 0.03, w: 0.39, h: 0.13 },
    { id: 'tlb', kind: 'logic', col: 2, x: 0.57, y: 0.18, w: 0.39, h: 0.12 },
    { id: 'ooo', kind: 'logic', col: 3, x: 0.04, y: 0.33, w: 0.44, h: 0.20 },
    { id: 'alu', kind: 'datapath', col: 4, x: 0.51, y: 0.33, w: 0.45, h: 0.20 },
    { id: 'vec', kind: 'datapath', col: 5, x: 0.04, y: 0.56, w: 0.92, h: 0.15 },
    { id: 'bpu', kind: 'sram', col: 2, x: 0.04, y: 0.74, w: 0.30, h: 0.22 },
    { id: 'uop', kind: 'sram', col: 0, x: 0.37, y: 0.74, w: 0.27, h: 0.22 },
    { id: 'dec', kind: 'logic', col: 3, x: 0.67, y: 0.74, w: 0.29, h: 0.22 }
  ];
  const H = TD.HERO_CORE;
  const cb = (id) => {
    const b = TD.CORE_BLOCKS.find((q) => q.id === id);
    return TD.dieToWorld(H.x + (b.x + b.w / 2) * H.w, H.y + (b.y + b.h / 2) * H.h, 0.002);
  };
  const fb = (b) => TD.dieToWorld(b.x + b.w / 2, b.y + b.h / 2, 0.002);
  const F = (id) => fb(TD.FLOOR.blocks.find((q) => q.id === id));

  const dieC = TD.dieToWorld(0.5, 0.5);
  const coresC = TD.dieToWorld(0.56, 0.46);
  const coreC = TD.dieToWorld(H.x + H.w / 2, H.y + H.h / 2);
  const gpuC = TD.dieToWorld(0.16, 0.48);
  const off = (c, o) => [c[0] + o[0], c[1] + o[1], c[2] + o[2]];

  // repère : { at:[x,y,z], d:[dx,dy] décalage de l'étiquette en px, t: titre, s: sous-titre }
  TD.steps = [
    { id: 'overview', label: 'Portable', accent: '#7DE3F4', p: [31.5, 30, 46], t: [0, 6, -3], hero: true },

    { id: 'inside', label: 'Intérieur', accent: '#7DE3F4', p: [0, 36.9, 24.1], t: [0, 0.8, -1],
      kicker: 'CHÂSSIS', title: 'Châssis ouvert', line: 'Une carte, une batterie, un ventilateur.',
      stats: [['1', 'carte mère'], ['3', 'cellules'], ['1', 'ventilateur']],
      co: [
        { at: [9.5, 0.5, 0.6], d: [70, -50], t: 'CARTE MÈRE', s: 'CPU + graphique intégré' },
        { at: [8.8, 0.9, 5.0], d: [70, 60], t: 'BATTERIE', s: '51 Wh' },
        { at: [-10.3, 1.1, -6.8], d: [-80, -40], t: 'VENTILATEUR', s: '×1' },
        { at: [-2.4, 0.75, -1.8], d: [-30, 110], t: 'CARTE WI-FI', s: 'Wi-Fi 6E · Bluetooth' },
        { at: [10.6, 0.5, -6.9], d: [80, -50], t: 'CARTE E/S', s: 'USB · audio' }
      ] },

    { id: 'cooling', label: 'Refroidissement', accent: '#FF9E64', p: [-14, 29, 17.8], t: [0, 0.8, -7],
      kicker: 'THERMIQUE', title: 'Refroidissement', line: 'Le cuivre déplace la chaleur. Le ventilateur l’évacue.',
      stats: [['1', 'caloduc'], ['44', 'ailettes'], ['13', 'pales']],
      co: [
        { at: [-2.2, 1.15, -6.6], d: [70, 80], t: 'PLAQUE FROIDE', s: 'sur le CPU' },
        { at: [-5.6, 1.1, -8.1], d: [40, -80], t: 'CALODUC', s: 'cuivre' },
        { at: [-10.5, 1.2, -9.8], d: [-50, -60], t: 'RADIATEUR', s: 'ailettes de 0,3 mm' },
        { at: [-10.3, 1.0, -6.8], d: [-90, 40], t: 'VENTILATEUR RADIAL', s: '13 pales' }
      ] },

    { id: 'cpu', label: 'CPU', accent: '#7DE3F4', p: [0.3, 8.1, -0.5], t: [-2.2, 0.55, -6.6],
      kicker: 'INTEL CORE i5-1345U vPro', title: 'CPU', line: 'Processeur et carte graphique sur la même puce.',
      stats: [['10', 'cœurs'], ['12', 'threads'], ['15', 'W']],
      co: [
        { at: [-2.55, 0.61, -6.9], d: [-90, -60], t: 'PUCE DE CALCUL', s: 'CPU + GPU' },
        { at: [-0.75, 0.61, -6.9], d: [80, -70], t: 'PUCE E/S', s: 'contrôleur de plateforme' },
        { at: [-3.6, 0.54, -5.25], d: [-80, 50], t: 'SUBSTRAT', s: 'BGA 1744' },
        { at: [-1.2, 0.56, -5.3], d: [70, 60], t: 'DÉCOUPLAGE', s: 'condensateurs' }
      ] },

    { id: 'die', label: 'Puce', accent: '#9B8CFF', p: off(dieC, [0.5, 3.7, 1.5]), t: dieC,
      kicker: 'SILICIUM', title: 'La puce', line: 'Couches retirées. Voici le plan de la puce.',
      stats: [['Intel 7', 'gravure'], ['12', 'Mo de cache L3'], ['80', 'EU graphiques']],
      co: [
        { at: F('igpu'), d: [-90, -30], t: 'GRAPHIQUE', s: 'Iris Xe intégré' },
        { at: fb(pc[0]), d: [-40, -110], t: 'CŒURS P', s: '× 2' },
        { at: fb(ec[5]), d: [50, 120], t: 'CŒURS E', s: '× 8' },
        { at: F('l3'), d: [-60, 150], t: 'CACHE L3', s: '12 Mo partagés' },
        { at: F('pcie'), d: [30, -120], t: 'E/S', s: 'PCIe · mémoire · Thunderbolt' }
      ] },

    { id: 'cores', label: 'Cœurs', accent: '#C084FC', p: off(coresC, [0.2, 2.6, 0.95]), t: coresC,
      kicker: 'CALCUL', title: 'Cœurs', line: 'Deux rapides. Huit économes.',
      stats: [['2', 'cœurs P'], ['8', 'cœurs E'], ['4,7', 'GHz max']],
      co: [
        { at: fb(pc[0]), d: [-60, -120], t: 'CŒUR P 0', s: '2 threads' },
        { at: fb(pc[1]), d: [60, -120], t: 'CŒUR P 1', s: '2 threads' },
        { at: fb(ec[6]), d: [110, 70], t: 'GRAPPE E', s: '4 cœurs · L2 partagé' },
        { at: F('l3'), d: [150, -10], t: 'ANNEAU + L3', s: 'relie tous les cœurs' }
      ] },

    { id: 'core', label: 'Un cœur', accent: '#F472B6', p: off(coreC, [0.07, 1.16, 0.26]), t: coreC,
      kicker: 'CŒUR P 0', title: 'Un cœur', line: 'Un ordinateur entier dans quelques mm².',
      stats: [['1,25', 'Mo de L2'], ['6', 'décodeurs'], ['512', 'entrées ROB']],
      co: [
        { at: cb('l2'), d: [-150, -40], t: 'CACHE L2', s: '1,25 Mo' },
        { at: cb('l1d'), d: [130, -50], t: 'L1 DONNÉES', s: '48 Ko' },
        { at: cb('ooo'), d: [-170, 10], t: 'EXÉC. DANS LE DÉSORDRE', s: 'ordonnanceur · tampon ROB' },
        { at: cb('alu'), d: [150, 0], t: 'ENTIERS', s: 'UAL' },
        { at: cb('vec'), d: [170, 50], t: 'VECTORIEL / FLOTTANT', s: '256 bits' },
        { at: cb('bpu'), d: [20, 150], t: 'PRÉDICTEUR DE BRANCHEMENT', s: '' },
        { at: cb('dec'), d: [140, 90], t: 'DÉCODAGE', s: '+ cache de µops' }
      ] },

    { id: 'igpu', label: 'Graphique', accent: '#5EEAD4', p: off(gpuC, [-0.1, 1.9, 0.7]), t: gpuC,
      kicker: 'INTEL IRIS Xe', title: 'Graphique intégré', line: 'Pas de carte graphique : le GPU vit dans le CPU.',
      stats: [['80', 'unités d’exécution'], ['1,25', 'GHz max'], ['0', 'puce dédiée']],
      co: [
        { at: TD.dieToWorld(0.11, 0.3, 0.002), d: [-110, -60], t: 'UNITÉS D’EXÉCUTION', s: '× 80' },
        { at: TD.dieToWorld(0.25, 0.4, 0.002), d: [120, -90], t: 'ÉCHANTILLONNAGE', s: 'textures · rastérisation' },
        { at: F('media'), d: [-90, 80], t: 'MÉDIA + AFFICHAGE', s: 'encodage vidéo · sorties écran' }
      ] },

    { id: 'ram', label: 'RAM', accent: '#60A5FA', p: [-3.9, 9.9, 7.25], t: [-7.8, 0.7, -0.8],
      kicker: 'MÉMOIRE', title: 'RAM', line: 'Rapide. Oublie tout à l’extinction.',
      stats: [['16', 'Go'], ['5200', 'MT/s'], ['2', 'SO-DIMM']],
      co: [
        { at: [-10.2, 0.75, 0.6], d: [-70, 80], t: 'DRAM', s: '4 puces / barrette' },
        { at: [-7.8, 0.9, -3.95], d: [40, -90], t: 'CONNECTEUR', s: '262 broches' },
        { at: [-6.1, 0.72, 1.4], d: [110, 70], t: 'SO-DIMM', s: 'DDR5 · 8 Go' }
      ] },

    { id: 'ssd', label: 'SSD', accent: '#818CF8', p: [2.5, 9.2, 6.4], t: [5.4, 0.6, -1.4],
      kicker: 'STOCKAGE', title: 'SSD', line: 'Aucune pièce mobile. Juste des charges piégées.',
      stats: [['512', 'Go'], ['4.0 ×4', 'PCIe NVMe'], ['2280', 'M.2']],
      co: [
        { at: [2.8, 0.72, -1.4], d: [-70, -80], t: 'CONTRÔLEUR', s: 'NVMe' },
        { at: [5.7, 0.74, -1.4], d: [20, -100], t: 'FLASH NAND', s: 'TLC' },
        { at: [1.7, 0.66, -1.4], d: [-110, 50], t: 'CLÉ M', s: 'PCIe 4.0 ×4' }
      ] },

    { id: 'battery', label: 'Batterie', accent: '#FBBF24', p: [0, 34.6, 24.4], t: [0, 0.6, 3.2],
      kicker: 'ÉNERGIE', title: 'Batterie', line: 'La moitié du châssis, c’est de l’énergie stockée.',
      stats: [['51', 'Wh'], ['3', 'cellules'], ['65', 'W en USB-C']],
      co: [
        { at: [-8.8, 0.9, 5.4], d: [-60, 70], t: 'CELLULE SOUPLE', s: 'Li-ion polymère' },
        { at: [6.6, 0.4, 2.9], d: [70, -70], t: 'BMS', s: 'protection + jauge' }
      ] },

    { id: 'display', label: 'Écran', accent: '#7DD3FC', cam: 'display',
      kicker: 'DALLE IPS', title: 'Écran', line: 'De la lumière, filtrée pixel par pixel.',
      stats: [['14', 'pouces'], ['1920×1200', 'px'], ['60', 'Hz']],
      co: [] },

    { id: 'pixels', label: 'Pixels', accent: '#FDA4AF', cam: 'pixels',
      kicker: 'SOUS-PIXELS', title: 'Pixels', line: 'Rouge, vert, bleu. Rien d’autre.',
      stats: [['2,3', 'M de pixels'], ['6,9', 'M de sous-pixels'], ['162', 'ppp']],
      co: [] },

    { id: 'final', label: 'Assemblé', accent: '#7DE3F4', p: [31.5, 30, 46], t: [0, 6, -3], end: true,
      kicker: 'RÉASSEMBLÉ', title: '19 mm d’épaisseur', line: 'Tout ça. Là-dedans.',
      stats: [['1,36', 'kg'], ['10', 'cœurs'], ['51', 'Wh']],
      co: [] }
  ];
  TD.idx = (id) => TD.steps.findIndex((s) => s.id === id);

  TD.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  TD.clamp = (x) => Math.max(0, Math.min(1, x));
  TD.smooth = (x) => x * x * (3 - 2 * x);
})();
