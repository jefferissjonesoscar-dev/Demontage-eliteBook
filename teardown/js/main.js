/* Teardown — boot. */
(function () {
  const TD = window.TD;
  const stageEl = document.getElementById('stage');
  const api = {};
  TD.mountHUD(document.getElementById('hud'), api);

  const fonts = ['600 40px "Space Grotesk"', '500 20px "JetBrains Mono"', '400 20px Inter', '600 20px Inter'];
  const ready = document.fonts && document.fonts.load ? Promise.all(fonts.map((f) => document.fonts.load(f))).catch(() => {}) : Promise.resolve();
  const timeout = new Promise((r) => setTimeout(r, 1800));

  Promise.race([ready, timeout]).then(() => {
    const stage = new TD.Stage({
      canvas: document.getElementById('gl'),
      root: stageEl,
      track: document.getElementById('track'),
      onStep: (i) => api.setStep && api.setStep(i),
      onFail: () => document.body.classList.add('no-gl')
    });
    api.go = (i) => stage.go(i);
    TD.stage = stage;
    requestAnimationFrame(() => { stage.start(); requestAnimationFrame(() => document.body.classList.add('ready')); });
  });
})();
