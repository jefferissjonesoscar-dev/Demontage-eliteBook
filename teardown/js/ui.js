/* Teardown — HUD, written as React components (no build step: plain createElement). */
(function () {
  const TD = window.TD;
  const { createElement: h, useState, useEffect } = window.React;
  const pad = (n) => String(n).padStart(2, '0');

  function Header({ step }) {
    const s = TD.steps[step];
    return h('header', { className: 'top' },
      h('div', { className: 'brand' },
        h('svg', { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true },
          h('rect', { x: 4, y: 5, width: 16, height: 11, rx: 1.5 }), h('path', { d: 'M2 19h20' })),
        h('span', null, 'DÉMONTAGE'), h('em', null, 'ELITEBOOK 840 G10 · i5 vPro')),
      h('div', { className: 'where' },
        h('span', { className: 'count' }, pad(step), h('i', null, ' / ' + pad(TD.steps.length - 1))),
        h('span', { className: 'name' }, s.label)));
  }

  function Info({ s, i, onReplay }) {
    return h('section', { className: 'info', 'data-info': i, 'aria-hidden': true },
      h('div', { className: 'kicker' }, h('b', null, pad(i)), s.kicker),
      h('h2', null, s.title),
      h('p', null, s.line),
      h('dl', { className: 'stats' }, s.stats.map(([v, l], k) => h('div', { key: k }, h('dt', null, v), h('dd', null, l)))),
      s.end && h('button', { className: 'replay', type: 'button', onClick: onReplay }, '↑  Redémonter'));
  }

  function Callout({ c, i }) {
    const [dx, dy] = c.d;
    const len = Math.hypot(dx, dy), ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    return h('div', { className: 'co', 'data-co': i, 'data-at': JSON.stringify(c.at) },
      h('i', { className: 'co-dot' }),
      h('i', { className: 'co-line', style: { width: len + 'px', transform: 'rotate(' + ang + 'deg) scaleX(var(--grow,1))' } }),
      h('div', { className: 'co-label' + (dx < 0 ? ' left' : ''), style: { left: dx + 'px', top: dy + 'px' } },
        h('b', null, c.t), c.s ? h('span', null, c.s) : null));
  }

  function Rail({ step, go }) {
    return h('nav', { className: 'rail', 'aria-label': 'Étapes' },
      TD.steps.map((s, i) => h('button', { key: s.id, type: 'button', className: i === step ? 'on' : '', 'aria-label': 'Aller à : ' + s.label, 'aria-current': i === step ? 'step' : undefined, onClick: () => go(i) },
        h('em', null, s.label), h('i', null))));
  }

  function Foot() {
    return h('footer', { className: 'foot' },
      h('div', { className: 'hint', 'data-hint': true }, h('span', null, 'DÉFILER'), h('i', null)),
      h('div', { className: 'scale' },
        h('span', { className: 'zoom', 'data-zoom': true }, '×1.0'),
        h('span', { className: 'scale-bar', 'data-scale-bar': true }),
        h('span', { className: 'scale-txt', 'data-scale-txt': true }, '')),
      h('div', { className: 'bar', 'data-bar': true }));
  }

  function App({ api }) {
    const [step, setStep] = useState(0);
    useEffect(() => { api.setStep = setStep; }, []);
    const go = (i) => api.go && api.go(i);
    return h('div', { className: 'hud-inner' },
      h(Header, { step }),
      TD.steps.map((s, i) => (s.hero ? null : h(Info, { key: s.id, s, i, onReplay: () => go(0) }))),
      h('div', { className: 'callouts', 'aria-hidden': true }, TD.steps.map((s, i) => (s.co || []).map((c, k) => h(Callout, { key: s.id + k, c, i })))),
      h(Rail, { step, go }),
      h(Foot));
  }

  TD.mountHUD = function (el, api) {
    const root = window.ReactDOM.createRoot(el);
    window.ReactDOM.flushSync(() => root.render(h(App, { api })));
  };
})();
