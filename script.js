 'use strict';

/* ═══════════════════════════════════
   TOAST HELPER  (defined first so
   everything else can call it)
═══════════════════════════════════ */
function toast(msg, type) {
  /* type: 'ok' | 'err' | 'inf' */
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.className   = `toast t-${type || 'inf'} show`;
  clearTimeout(el._tid);
  el._tid = setTimeout(() => { el.className = 'toast'; }, 3600);
}


/* ═══════════════════════════════════
   SECURITY
═══════════════════════════════════ */
document.addEventListener('contextmenu', e => {
  e.preventDefault();
  toast('Right-click is disabled on this page.', 'inf');
});

document.addEventListener('keydown', e => {
  const block =
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) ||
    (e.ctrlKey && ['u','U','s','S'].includes(e.key));
  if (block) { e.preventDefault(); toast('Developer tools are restricted here.', 'inf'); }
});


/* ═══════════════════════════════════
   CANVAS BACKGROUND
═══════════════════════════════════ */
(function () {
  const cv  = document.getElementById('bgCanvas');
  if (!cv) return;
  const cx  = cv.getContext('2d');
  let W, H, pts = [], mx = -999, my = -999;

  function resize() {
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
  }

  function Pt() {
    this.x  = Math.random() * W;
    this.y  = Math.random() * H;
    this.vx = (Math.random() - .5) * .35;
    this.vy = (Math.random() - .5) * .35;
  }

  Pt.prototype.tick = function () {
    this.x += this.vx; this.y += this.vy;
    if (this.x < 0 || this.x > W) this.vx *= -1;
    if (this.y < 0 || this.y > H) this.vy *= -1;
  };

  function frame() {
    cx.clearRect(0, 0, W, H);
    pts.forEach(p => {
      cx.beginPath();
      cx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
      cx.fillStyle = 'rgba(148,163,184,.55)';
      cx.fill();
      p.tick();
    });
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < 130) {
          cx.beginPath();
          cx.moveTo(pts[i].x, pts[i].y);
          cx.lineTo(pts[j].x, pts[j].y);
          cx.strokeStyle = `rgba(99,102,241,${(1 - d/130)*.16})`;
          cx.lineWidth = .8; cx.stroke();
        }
      }
    }
    pts.forEach(p => {
      const dx = p.x - mx, dy = p.y - my;
      const d  = Math.sqrt(dx*dx + dy*dy);
      if (d < 110) {
        cx.beginPath(); cx.moveTo(p.x, p.y); cx.lineTo(mx, my);
        cx.strokeStyle = `rgba(6,182,212,${(1 - d/110)*.3})`;
        cx.lineWidth = .6; cx.stroke();
      }
    });
    requestAnimationFrame(frame);
  }

  function init() {
    resize();
    pts = Array.from({ length: 52 }, () => new Pt());
    frame();
  }

  window.addEventListener('resize', () => { resize(); pts = Array.from({length:52},()=>new Pt()); });
  window.addEventListener('mousemove', e => { mx = e.clientX; my = e.clientY; });
  window.addEventListener('touchmove', e => { mx = e.touches[0].clientX; my = e.touches[0].clientY; }, { passive:true });
  init();
})();


/* ═══════════════════════════════════
   HEADER — scroll + mobile menu
═══════════════════════════════════ */
(function () {
  const hdr  = document.getElementById('siteHeader');
  const btn  = document.getElementById('hamburger');
  const nav  = document.getElementById('navLinks');
  if (!hdr) return;

  window.addEventListener('scroll', () => {
    hdr.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });

  if (btn && nav) {
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
    nav.querySelectorAll('.nav-link').forEach(l => {
      l.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      });
    });
    document.addEventListener('click', e => {
      if (!hdr.contains(e.target)) {
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }
})();


/* ═══════════════════════════════════
   REVEAL ON SCROLL
═══════════════════════════════════ */
(function () {
  const els = document.querySelectorAll(
    '.bcard, .app-card, .stat, .reg-info, .reg-form-wrap, .sec-head'
  );
  els.forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 5) * 55}ms`;
  });
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: .1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => io.observe(el));
})();


/* ═══════════════════════════════════
   COUNTDOWN
═══════════════════════════════════ */
(function () {
   const TARGET = new Date('2026-09-15T09:00:00');
  const dEl = document.getElementById('cdDays');
  const hEl = document.getElementById('cdHours');
  const mEl = document.getElementById('cdMins');
  if (!dEl) return;
  const pad = n => String(n).padStart(2, '0');
  function tick() {
    const diff = TARGET - new Date();
    if (diff <= 0) { dEl.textContent = hEl.textContent = mEl.textContent = '00'; return; }
    const s = Math.floor(diff / 1000);
    dEl.textContent = pad(Math.floor(s / 86400));
    hEl.textContent = pad(Math.floor((s % 86400) / 3600));
    mEl.textContent = pad(Math.floor((s % 3600) / 60));
  }
  tick();
  setInterval(tick, 30000);
})();


/* ═══════════════════════════════════
   ACTIVE NAV LINK
═══════════════════════════════════ */
(function () {
  const secs = document.querySelectorAll('main section[id]');
  const lnks = document.querySelectorAll('.nav-link');
  const io   = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        lnks.forEach(l => {
          l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id);
        });
      }
    });
  }, { threshold: .4 });
  secs.forEach(s => io.observe(s));
})();


/* ═══════════════════════════════════
   TERMINAL EMULATOR
═══════════════════════════════════ */
(function () {
  const out   = document.getElementById('termOut');
  const inp   = document.getElementById('termIn');
  const clrB  = document.getElementById('termClear');
  if (!out || !inp) return;

  let hist = [], hIdx = -1;

  const JOKES = [
    'Why do programmers prefer dark mode? Light attracts bugs! 🐛',
    'Why did the dev go broke? They used up all their cache! 💸',
    'How do you comfort a JS dev? You console them. 😅',
    "A SQL query walks into a bar and asks two tables... 'Can I JOIN you?' 😂",
    'There are 10 types of people: those who understand binary and those who don\'t. 👾',
  ];

  function line(type, text, prompt) {
    const row = document.createElement('div');
    row.className = `tl tl-${type}`;
    if (prompt) {
      const ps = document.createElement('span');
      ps.className = 'tps'; ps.textContent = '❯ ';
      ps.setAttribute('aria-hidden','true');
      row.appendChild(ps);
    }
    const sp = document.createElement('span');
    sp.className = 'tt';
    sp.textContent = String(text).replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').slice(0,500);
    row.appendChild(sp);
    out.appendChild(row);
    out.scrollTop = out.scrollHeight;
  }

  const CMD = {
    help() {
      return [
        ['ok','┌─ Commands ───────────────────────────────┐'],
        ['ok','│  help            Show this menu           │'],
        ['ok','│  date            Current date & time      │'],
        ['ok','│  whoami          About you                │'],
        ['ok','│  calc <expr>     Calculator (e.g 5+3*2)   │'],
        ['ok','│  echo <text>     Echo text                │'],
        ['ok','│  joke            Random developer joke    │'],
        ['ok','│  ascii           ASCII art                │'],
        ['ok','│  flip            Flip a coin              │'],
        ['ok','│  count <n>       Count 1 to n (max 20)    │'],
        ['ok','│  reverse <text>  Reverse text             │'],
        ['ok','│  upper <text>    UPPERCASE                │'],
        ['ok','│  lower <text>    lowercase                │'],
        ['ok','│  clear           Clear terminal           │'],
        ['ok','└──────────────────────────────────────────┘'],
      ];
    },
    date() {
      const n = new Date();
      return [
        ['out', '📅  ' + n.toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})],
        ['out', '⏰  ' + n.toLocaleTimeString('en-IN')],
      ];
    },
    whoami() {
      return [
        ['out','👤  Techthon 3.0 Participant'],
        ['out','🏫  Guru Har Rai Academy, Kanpur'],
        ['out','🚀  Future Innovator'],
      ];
    },
    calc(args) {
      const ex = args.join(' ').trim();
      if (!ex) return [['err','Usage: calc <expression>  e.g. calc 10/2+3']];
      if (!/^[\d\s+\-*/.()%]+$/.test(ex)) return [['err','Only numeric expressions allowed.']];
      try {
        // eslint-disable-next-line no-new-func
        const r = Function('"use strict";return(' + ex + ')')();
        return isFinite(r) ? [['ok', ex + ' = ' + r]] : [['err','Result is not finite.']];
      } catch { return [['err','Invalid expression.']]; }
    },
    echo(args) {
      const t = args.join(' ').trim();
      return t ? [['out', t]] : [['err','Usage: echo <text>']];
    },
    joke() {
      return [['out', JOKES[Math.floor(Math.random() * JOKES.length)]]];
    },
    ascii() {
      return [
        ['ok',' _____ _____ ____ _   _ _____ _   _  ___  _   _'],
        ['ok','|_   _| ____/ ___| | | |_   _| | | |/ _ \\| \\ | |'],
        ['ok','  | | |  _|| |   | |_| | | | | |_| | | | |  \\| |'],
        ['ok','  | | | |__| |___|  _  | | | |  _  | |_| | |\\  |'],
        ['ok','  |_| |_____\\____|_| |_| |_| |_| |_|\\___/|_| \\_|'],
        ['sys','                          3.0  🚀'],
      ];
    },
    flip() {
      return [['out','Coin flipped → ' + (Math.random()<.5?'🪙 HEADS':'🪙 TAILS')]];
    },
    count(args) {
      const n = parseInt(args[0],10);
      if (isNaN(n)||n<1||n>20) return [['err','Usage: count <1-20>']];
      return Array.from({length:n},(_,i)=>['out','  '+(i+1)]);
    },
    reverse(args) {
      const t = args.join(' ').trim();
      return t ? [['out',t.split('').reverse().join('')]] : [['err','Usage: reverse <text>']];
    },
    upper(args) {
      const t = args.join(' ').trim();
      return t ? [['out',t.toUpperCase()]] : [['err','Usage: upper <text>']];
    },
    lower(args) {
      const t = args.join(' ').trim();
      return t ? [['out',t.toLowerCase()]] : [['err','Usage: lower <text>']];
    },
    clear() { out.innerHTML=''; return []; },
  };

  function run(raw) {
    const tr = raw.trim();
    if (!tr) return;
    if (hist[0] !== tr) { hist.unshift(tr); if (hist.length>40) hist.pop(); }
    hIdx = -1;
    line('cmd', tr, true);
    const parts = tr.split(/\s+/);
    const cmd   = parts[0].toLowerCase();
    const args  = parts.slice(1);
    if (CMD[cmd]) {
      CMD[cmd](args).forEach(([t,tx]) => line(t, tx, false));
    } else {
      line('err', 'Unknown command: "' + cmd + '". Type help.', false);
    }
  }

  /* Boot */
  const BOOT = [
    ['sys','━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
     ['sys','  Techthon 3.0 Terminal  —  GHA v1.0.0  '],
    ['sys','  Guru Har Rai Academy, Kanpur             '],
    ['sys','━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'],
    ['out','Type "help" to see available commands.'],
  ];
  BOOT.forEach(([t,tx],i) => setTimeout(() => line(t,tx,false), i*80));

  inp.addEventListener('keydown', function(e) {
    if (e.key==='Enter')     { run(this.value); this.value=''; }
    if (e.key==='ArrowUp')   { e.preventDefault(); if(hIdx<hist.length-1){hIdx++;this.value=hist[hIdx];} }
    if (e.key==='ArrowDown') { e.preventDefault(); hIdx>0?this.value=hist[--hIdx]:(hIdx=-1,this.value=''); }
  });

  if (clrB) clrB.addEventListener('click', () => { out.innerHTML=''; inp.focus(); });
})();


/* ═══════════════════════════════════
   BASE64 ENCODER / DECODER
═══════════════════════════════════ */
(function () {
  const iEl = document.getElementById('b64In');
  const oEl = document.getElementById('b64Out');
  const st  = document.getElementById('b64St');
  if (!iEl || !oEl) return;

  function setStatus(msg, ok) {
    st.textContent  = msg;
    st.className    = 'b64-status ' + (ok ? 'ok' : 'bad');
    setTimeout(() => { st.textContent=''; st.className='b64-status'; }, 2800);
  }

  function encode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g,
      (_, p) => String.fromCharCode(parseInt(p,16))));
  }
  function decode(str) {
    return decodeURIComponent(
      atob(str).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join('')
    );
  }

  document.getElementById('b64Enc').addEventListener('click', () => {
    if (!iEl.value.trim()) { setStatus('Enter some text first.', false); return; }
    try { oEl.value = encode(iEl.value); setStatus('✓ Encoded!', true); }
    catch { setStatus('Could not encode.', false); }
  });

  document.getElementById('b64Dec').addEventListener('click', () => {
    if (!iEl.value.trim()) { setStatus('Enter a Base64 string first.', false); return; }
    try { oEl.value = decode(iEl.value.trim()); setStatus('✓ Decoded!', true); }
    catch { setStatus('Invalid Base64 string.', false); }
  });

  document.getElementById('b64Cpy').addEventListener('click', () => {
    if (!oEl.value) { setStatus('Nothing to copy.', false); return; }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(oEl.value)
        .then(() => setStatus('✓ Copied!', true))
        .catch(() => { oEl.select(); document.execCommand('copy'); setStatus('✓ Copied!', true); });
    } else {
      oEl.select(); document.execCommand('copy'); setStatus('✓ Copied!', true);
    }
  });

  document.getElementById('b64Swp').addEventListener('click', () => {
    const tmp = iEl.value; iEl.value = oEl.value; oEl.value = tmp;
    setStatus('Swapped!', true);
  });

  let dbt;
  iEl.addEventListener('input', () => {
    clearTimeout(dbt);
    dbt = setTimeout(() => {
      if (iEl.value.trim()) {
        try { oEl.value = encode(iEl.value); } catch { oEl.value = ''; }
      } else { oEl.value = ''; }
    }, 350);
  });
})();


/* ═══════════════════════════════════
   REGISTRATION FORM
═══════════════════════════════════ */
(function () {

  const SHEETS_URL =
    'https://script.google.com/macros/s/AKfycbyBWU5xWFfQWdr-vjn6zCv7n_5annSqedx9mptWiRIPACHfzkA7C8kngdBQ01vuKI3F/exec';

  const form   = document.getElementById('regForm');
  const subBtn = document.getElementById('subBtn');
  const subTxt = document.getElementById('subTxt');
  const subLdr = document.getElementById('subLoad');
  if (!form) return;

  /* Field map */
  const F = {
    name:    { el: document.getElementById('fName'),  err: document.getElementById('eN')  },
    class:   { el: document.getElementById('fClass'), err: document.getElementById('eC')  },
    section: { el: document.getElementById('fSec'),   err: document.getElementById('eS')  },
    roll_no: { el: document.getElementById('fRoll'),  err: document.getElementById('eR')  },
    sr_no:   { el: document.getElementById('fSr'),    err: document.getElementById('eSR') },
  };

  /* Sanitize */
  function clean(v) {
    return String(v)
      .replace(/[<>"'`]/g, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+=/gi, '')
      .trim();
  }

  /* Validators */
  const V = {
    name(v)   {
      if (!v)           return 'Full name is required.';
      if (v.length < 2) return 'Name too short.';
      if (!/^[a-zA-Z\s'.()-]+$/.test(v)) return 'Letters and spaces only.';
      return '';
    },
    class(v)  { return v ? '' : 'Please select your class.'; },
    section(v){
      if (!v)                        return 'Section is required.';
      if (!/^[A-Za-z]{1,3}$/.test(v)) return 'Section should be 1-3 letters (e.g. A).';
      return '';
    },
    roll_no(v){
      if (!v)                  return 'Roll number is required.';
      if (!/^\d{1,4}$/.test(v)) return 'Roll number must be 1-4 digits.';
      return '';
    },
    sr_no(v)  {
      if (!v)             return 'SR number is required.';
      if (v.length > 20)  return 'SR number too long.';
      if (!/^[a-zA-Z0-9\-/]+$/.test(v)) return 'Letters, digits, hyphens only.';
      return '';
    },
  };

  function setErr(key, msg) {
    const { el, err } = F[key];
    err.textContent = msg;
    el.classList.toggle('err', !!msg);
  }

  function checkField(key) {
    const v = clean(F[key].el.value);
    setErr(key, V[key](v));
    return !V[key](v);
  }

  function checkAll() {
    return Object.keys(F).map(checkField).every(Boolean);
  }

  /* Blur / input listeners */
  Object.keys(F).forEach(k => {
    F[k].el.addEventListener('blur',  () => checkField(k));
    F[k].el.addEventListener('input', () => { if(F[k].el.classList.contains('err')) checkField(k); });
  });

  /* Loading toggle */
  function setLoading(on) {
    subBtn.disabled = on;
    subTxt.classList.toggle('hidden',  on);
    subLdr.classList.toggle('hidden', !on);
  }

  /* SUBMIT */
  form.addEventListener('submit', async function(e) {
    e.preventDefault();           /* ← stops page reload */
    e.stopPropagation();

    if (!checkAll()) {
      const first = Object.keys(F).find(k => F[k].el.classList.contains('err'));
      if (first) F[first].el.focus();
      return;
    }

    if (!navigator.onLine) {
      toast('📡 No internet connection. Please reconnect and try again.', 'err');
      return;
    }

    setLoading(true);

    /* Build URLSearchParams — keys match Apps Script exactly */
    const body = new URLSearchParams({
      name:    clean(F.name.el.value),
      class:   clean(F.class.el.value),
      section: clean(F.section.el.value).toUpperCase(),
      roll_no: clean(F.roll_no.el.value),
      sr_no:   clean(F.sr_no.el.value),
    });

    const snapshot = {
      name:    body.get('name'),
      class:   body.get('class'),
      section: body.get('section'),
      roll_no: body.get('roll_no'),
      sr_no:   body.get('sr_no'),
    };

    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 12000);

    try {
      await fetch(SHEETS_URL, {
        method:  'POST',
        body:    body,
        mode:    'no-cors',   /* Google Apps Script needs this */
        signal:  ctrl.signal,
      });

      clearTimeout(tid);

      /* With no-cors the response is opaque — no error = success */
      form.reset();
      Object.keys(F).forEach(k => setErr(k, ''));
      showModal(snapshot);

    } catch (err) {
      clearTimeout(tid);
      if (err.name === 'AbortError') {
        toast('⏱️ Request timed out. Check your connection and try again.', 'err');
      } else {
        toast('⚠️ Submission failed. Please try again in a moment.', 'err');
      }
      console.error('[Techthon] fetch error:', err);
    } finally {
      setLoading(false);
    }
  });

})();


/* ═══════════════════════════════════
   MODAL
═══════════════════════════════════ */
function showModal(data) {
  const bg   = document.getElementById('modalBg');
  const meta = document.getElementById('mMeta');
  const cls  = document.getElementById('mClose');
  if (!bg) return;

  if (meta) {
    meta.innerHTML = '';
    [
      ['Name',    data.name],
      ['Class',   'Class ' + data.class + ' — Section ' + data.section],
      ['Roll No', data.roll_no],
      ['SR No',   data.sr_no],
    ].forEach(([l, v]) => {
      const d  = document.createElement('div');
      const b  = document.createElement('strong');
      b.textContent = l + ':  ';
      d.appendChild(b);
      d.appendChild(document.createTextNode(v));
      meta.appendChild(d);
    });
  }

  bg.classList.add('show');
  bg.setAttribute('aria-hidden','false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => cls && cls.focus(), 120);
  toast('Registration submitted successfully! 🎉', 'ok');
}

(function () {
  const bg  = document.getElementById('modalBg');
  const cls = document.getElementById('mClose');
  if (!bg || !cls) return;

  function close() {
    bg.classList.remove('show');
    bg.setAttribute('aria-hidden','true');
    document.body.style.overflow = '';
    const sb = document.getElementById('subBtn');
    if (sb) sb.focus();
  }

  cls.addEventListener('click', close);
  bg.addEventListener('click', e => { if (e.target === bg) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && bg.classList.contains('show')) close();
  });
})();