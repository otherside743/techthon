import { initBackgroundCanvas } from './canvas';

type ToastKind = 'ok' | 'err' | 'inf';
type TerminalKind = 'cmd' | 'out' | 'err' | 'sys' | 'ok';
type TerminalLine = readonly [TerminalKind, string];
type Student = { name: string; class: string; section: string; roll_no: string; sr_no: string };

const byId = <T extends HTMLElement>(id: string): T | null => document.getElementById(id) as T | null;
const toastElement = byId<HTMLDivElement>('toast');
let toastTimer = 0;

function toast(message: string, kind: ToastKind = 'inf'): void {
  if (!toastElement) return;
  toastElement.textContent = message;
  toastElement.className = `toast t-${kind} show`;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => { toastElement.className = 'toast'; }, 3600);
}

function initNavigation(): void {
  const header = byId<HTMLElement>('siteHeader');
  const button = byId<HTMLButtonElement>('hamburger');
  const nav = byId<HTMLUListElement>('navLinks');
  if (!header || !button || !nav) return;

  const closeMenu = (): void => {
    nav.classList.remove('open');
    button.classList.remove('open');
    button.setAttribute('aria-expanded', 'false');
  };
  window.addEventListener('scroll', () => header.classList.toggle('scrolled', window.scrollY > 20), { passive: true });
  button.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    button.classList.toggle('open', open);
    button.setAttribute('aria-expanded', String(open));
  });
  nav.querySelectorAll<HTMLAnchorElement>('.nav-link').forEach((link) => link.addEventListener('click', closeMenu));
  document.addEventListener('click', (event) => {
    if (event.target instanceof Node && !header.contains(event.target)) closeMenu();
  });

  const links = [...nav.querySelectorAll<HTMLAnchorElement>('.nav-link')];
  const sections = document.querySelectorAll<HTMLElement>('main section[id]');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((link) => link.classList.toggle('active', link.hash === `#${entry.target.id}`));
      });
    }, { threshold: 0.35 });
    sections.forEach((section) => observer.observe(section));
  }
}

function initRevealAnimations(): void {
  const items = document.querySelectorAll<HTMLElement>('.bcard, .app-card, .stat, .reg-info, .reg-form-wrap, .sec-head');
  items.forEach((item, index) => {
    item.classList.add('reveal');
    item.style.transitionDelay = `${(index % 5) * 55}ms`;
  });
  if (!('IntersectionObserver' in window)) {
    items.forEach((item) => item.classList.add('visible'));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  items.forEach((item) => observer.observe(item));
}

/** A small recursive-descent parser keeps calculator input data-only (no eval/Function). */
function calculate(expression: string): number {
  const tokens = expression.match(/\d+(?:\.\d*)?|\.\d+|[()+\-*/%]/g) ?? [];
  if (tokens.join('') !== expression.replace(/\s+/g, '')) throw new Error('Invalid expression.');
  let cursor = 0;
  const peek = (): string | undefined => tokens[cursor];
  const consume = (): string => {
    const token = tokens[cursor++];
    if (token === undefined) throw new Error('Incomplete expression.');
    return token;
  };
  const primary = (): number => {
    const token = consume();
    if (token === '+') return primary();
    if (token === '-') return -primary();
    if (token === '(') {
      const result = sum();
      if (consume() !== ')') throw new Error('Missing closing parenthesis.');
      return result;
    }
    const value = Number(token);
    if (!Number.isFinite(value)) throw new Error('Invalid number.');
    return value;
  };
  const product = (): number => {
    let value = primary();
    while (peek() === '*' || peek() === '/' || peek() === '%') {
      const operator = consume();
      const right = primary();
      if (operator === '*') value *= right;
      else if (operator === '/') value /= right;
      else value %= right;
    }
    return value;
  };
  const sum = (): number => {
    let value = product();
    while (peek() === '+' || peek() === '-') {
      const operator = consume();
      const right = product();
      value = operator === '+' ? value + right : value - right;
    }
    return value;
  };
  const result = sum();
  if (cursor !== tokens.length) throw new Error('Invalid expression.');
  if (!Number.isFinite(result)) throw new Error('Result is not finite.');
  return result;
}

function initTerminal(): void {
  const output = byId<HTMLDivElement>('termOut');
  const input = byId<HTMLInputElement>('termIn');
  const clearButton = byId<HTMLButtonElement>('termClear');
  if (!output || !input) return;
  let history: string[] = [];
  let historyIndex = -1;

  const jokes = [
    'Why do programmers prefer dark mode? Light attracts bugs! 🐛',
    'Why did the dev go broke? They used up all their cache! 💸',
    'How do you comfort a JS dev? You console them. 😅',
    "A SQL query walks into a bar and asks two tables... 'Can I JOIN you?' 😂",
    "There are 10 types of people: those who understand binary and those who don't. 👾",
  ];
  const help: TerminalLine[] = [
    ['ok', '┌─ Commands ───────────────────────────────┐'],
    ['ok', '│  help            Show this menu           │'], ['ok', '│  date            Current date & time      │'],
    ['ok', '│  whoami          About you                │'], ['ok', '│  calc <expr>     Calculator (e.g 5+3*2)   │'],
    ['ok', '│  echo <text>     Echo text                │'], ['ok', '│  joke            Random developer joke    │'],
    ['ok', '│  ascii           ASCII art                │'], ['ok', '│  flip            Flip a coin              │'],
    ['ok', '│  count <n>       Count 1 to n (max 20)    │'], ['ok', '│  reverse <text>  Reverse text             │'],
    ['ok', '│  upper <text>    UPPERCASE                │'], ['ok', '│  lower <text>    lowercase                │'],
    ['ok', '│  clear           Clear terminal           │'], ['ok', '└──────────────────────────────────────────┘'],
  ];

  const appendLine = (kind: TerminalKind, text: string, prompt = false): void => {
    const row = document.createElement('div');
    row.className = `tl tl-${kind}`;
    if (prompt) {
      const prefix = document.createElement('span');
      prefix.className = 'tps';
      prefix.textContent = '❯ ';
      prefix.setAttribute('aria-hidden', 'true');
      row.append(prefix);
    }
    const content = document.createElement('span');
    content.className = 'tt';
    content.textContent = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '').slice(0, 500);
    row.append(content);
    output.append(row);
    output.scrollTop = output.scrollHeight;
  };

  const respond = (command: string, args: string[]): TerminalLine[] => {
    const text = args.join(' ').trim();
    switch (command) {
      case 'help': return help;
      case 'date': {
        const now = new Date();
        return [['out', `📅  ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`], ['out', `⏰  ${now.toLocaleTimeString('en-IN')}`]];
      }
      case 'whoami': return [['out', '👤  Techthon 3.0 Participant'], ['out', '🏫  Guru Har Rai Academy, Kanpur'], ['out', '🚀  Future Innovator']];
      case 'calc': {
        if (!text) return [['err', 'Usage: calc <expression>  e.g. calc 10/2+3']];
        try { return [['ok', `${text} = ${calculate(text)}`]]; }
        catch (error) { return [['err', error instanceof Error ? error.message : 'Invalid expression.']]; }
      }
      case 'echo': return text ? [['out', text]] : [['err', 'Usage: echo <text>']];
      case 'joke': return [['out', jokes[Math.floor(Math.random() * jokes.length)] ?? 'Keep coding!']];
      case 'ascii': return [['ok', ' _____ _____ ____ _   _ _____ _   _  ___  _   _'], ['ok', '|_   _| ____/ ___| | | |_   _| | | |/ _ \\| \\ | |'], ['ok', '  | | |  _|| |   | |_| | | | | |_| | | | |  \\| |'], ['ok', '  | | | |__| |___|  _  | | | |  _  | |_| | |\\  |'], ['ok', '  |_| |_____\\____|_| |_| |_| |_| |_|\\___/|_| \\_|'], ['sys', '                          3.0  🚀']];
      case 'flip': return [['out', `Coin flipped → ${Math.random() < 0.5 ? '🪙 HEADS' : '🪙 TAILS'}`]];
      case 'count': {
        const countText = args[0] ?? '';
        const count = Number.parseInt(countText, 10);
        if (!/^\d+$/.test(countText) || !Number.isInteger(count) || count < 1 || count > 20) return [['err', 'Usage: count <1-20>']];
        return Array.from({ length: count }, (_, index): TerminalLine => ['out', `  ${index + 1}`]);
      }
      case 'reverse': return text ? [['out', [...text].reverse().join('')]] : [['err', 'Usage: reverse <text>']];
      case 'upper': return text ? [['out', text.toLocaleUpperCase()]] : [['err', 'Usage: upper <text>']];
      case 'lower': return text ? [['out', text.toLocaleLowerCase()]] : [['err', 'Usage: lower <text>']];
      case 'clear': output.replaceChildren(); return [];
      default: return [['err', `Unknown command: "${command}". Type help.`]];
    }
  };

  const run = (raw: string): void => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (history[0] !== trimmed) history = [trimmed, ...history].slice(0, 40);
    historyIndex = -1;
    appendLine('cmd', trimmed, true);
    const [command = '', ...args] = trimmed.split(/\s+/);
    respond(command.toLowerCase(), args).forEach(([kind, text]) => appendLine(kind, text));
  };

  const boot: TerminalLine[] = [['sys', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'], ['sys', '  Techthon 3.0 Terminal  —  GHA v1.0.0  '], ['sys', '  Guru Har Rai Academy, Kanpur             '], ['sys', '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'], ['out', 'Type "help" to see available commands.']];
  boot.forEach(([kind, text], index) => window.setTimeout(() => appendLine(kind, text), index * 80));
  input.addEventListener('keydown', (event: KeyboardEvent) => {
    if (event.key === 'Enter') { run(input.value); input.value = ''; }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (historyIndex < history.length - 1) { historyIndex += 1; input.value = history[historyIndex] ?? ''; }
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (historyIndex > 0) { historyIndex -= 1; input.value = history[historyIndex] ?? ''; }
      else { historyIndex = -1; input.value = ''; }
    }
  });
  clearButton?.addEventListener('click', () => { output.replaceChildren(); input.focus(); });
}

function initBase64Tool(): void {
  const input = byId<HTMLTextAreaElement>('b64In');
  const result = byId<HTMLTextAreaElement>('b64Out');
  const status = byId<HTMLDivElement>('b64St');
  const encodeButton = byId<HTMLButtonElement>('b64Enc');
  const decodeButton = byId<HTMLButtonElement>('b64Dec');
  const copyButton = byId<HTMLButtonElement>('b64Cpy');
  const swapButton = byId<HTMLButtonElement>('b64Swp');
  if (!input || !result || !status || !encodeButton || !decodeButton || !copyButton || !swapButton) return;
  let statusTimer = 0;
  const setStatus = (message: string, success: boolean): void => {
    status.textContent = message;
    status.className = `b64-status ${success ? 'ok' : 'bad'}`;
    window.clearTimeout(statusTimer);
    statusTimer = window.setTimeout(() => { status.textContent = ''; status.className = 'b64-status'; }, 2800);
  };
  const encode = (value: string): string => {
    const bytes = new TextEncoder().encode(value);
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  };
  const decode = (value: string): string => {
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(value)) throw new Error('Invalid Base64 string.');
    const binary = atob(value);
    return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, (character) => character.charCodeAt(0)));
  };
  encodeButton.addEventListener('click', () => {
    if (!input.value.trim()) { setStatus('Enter some text first.', false); return; }
    try { result.value = encode(input.value); setStatus('✓ Encoded!', true); }
    catch { setStatus('Could not encode.', false); }
  });
  decodeButton.addEventListener('click', () => {
    if (!input.value.trim()) { setStatus('Enter a Base64 string first.', false); return; }
    try { result.value = decode(input.value.trim()); setStatus('✓ Decoded!', true); }
    catch { setStatus('Invalid Base64 string.', false); }
  });
  copyButton.addEventListener('click', async () => {
    if (!result.value) { setStatus('Nothing to copy.', false); return; }
    try {
      if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(result.value);
      else {
        result.select();
        if (!document.execCommand('copy')) throw new Error('Copy failed.');
      }
      setStatus('✓ Copied!', true);
    } catch { setStatus('Could not copy to clipboard.', false); }
  });
  swapButton.addEventListener('click', () => { [input.value, result.value] = [result.value, input.value]; setStatus('Swapped!', true); });
}

function initRegistration(): void {
  const form = byId<HTMLFormElement>('regForm');
  const submitButton = byId<HTMLButtonElement>('subBtn');
  const submitText = byId<HTMLSpanElement>('subTxt');
  const submitLoading = byId<HTMLSpanElement>('subLoad');
  const modal = byId<HTMLDivElement>('modalBg');
  const modalClose = byId<HTMLButtonElement>('mClose');
  const modalMeta = byId<HTMLDivElement>('mMeta');
  if (!form || !submitButton || !submitText || !submitLoading || !modal || !modalClose || !modalMeta) return;

  const fields = {
    name: { element: byId<HTMLInputElement>('fName'), error: byId<HTMLSpanElement>('eN') },
    class: { element: byId<HTMLSelectElement>('fClass'), error: byId<HTMLSpanElement>('eC') },
    section: { element: byId<HTMLInputElement>('fSec'), error: byId<HTMLSpanElement>('eS') },
    roll_no: { element: byId<HTMLInputElement>('fRoll'), error: byId<HTMLSpanElement>('eR') },
    sr_no: { element: byId<HTMLInputElement>('fSr'), error: byId<HTMLSpanElement>('eSR') },
  };
  type FieldName = keyof typeof fields;
  const validators: Record<FieldName, (value: string) => string> = {
    name: (value) => !value ? 'Full name is required.' : value.length < 2 ? 'Name too short.' : !/^[\p{L}\s'.()-]+$/u.test(value) ? 'Use letters and spaces only.' : '',
    class: (value) => value ? '' : 'Please select your class.',
    section: (value) => !value ? 'Section is required.' : !/^[A-Za-z]{1,3}$/.test(value) ? 'Section should be 1-3 letters (e.g. A).' : '',
    roll_no: (value) => !value ? 'Roll number is required.' : !/^\d{1,4}$/.test(value) ? 'Roll number must be 1-4 digits.' : '',
    sr_no: (value) => !value ? 'SR number is required.' : value.length > 20 ? 'SR number too long.' : !/^[a-zA-Z0-9\-/]+$/.test(value) ? 'Letters, digits, hyphens only.' : '',
  };
  const clean = (value: string): string => value.trim();
  const valueOf = (key: FieldName): string => fields[key].element?.value.trim() ?? '';
  const setError = (key: FieldName, message: string): void => {
    const field = fields[key];
    if (!field.element || !field.error) return;
    field.error.textContent = message;
    field.element.classList.toggle('err', Boolean(message));
    field.element.setAttribute('aria-invalid', String(Boolean(message)));
  };
  const checkField = (key: FieldName): boolean => {
    const message = validators[key](valueOf(key));
    setError(key, message);
    return !message;
  };
  const fieldNames = Object.keys(fields) as FieldName[];
  fieldNames.forEach((key) => {
    const element = fields[key].element;
    element?.addEventListener('blur', () => checkField(key));
    element?.addEventListener('input', () => { if (element.classList.contains('err')) checkField(key); });
    element?.addEventListener('change', () => { if (element.classList.contains('err')) checkField(key); });
  });
  const setLoading = (loading: boolean): void => {
    submitButton.disabled = loading;
    submitText.classList.toggle('hidden', loading);
    submitLoading.classList.toggle('hidden', !loading);
  };
  const openModal = (student: Student): void => {
    modalMeta.replaceChildren();
    const details: [string, string][] = [['Name', student.name], ['Class', `Class ${student.class} — Section ${student.section}`], ['Roll No', student.roll_no], ['SR No', student.sr_no]];
    details.forEach(([label, value]) => {
      const row = document.createElement('div');
      const strong = document.createElement('strong');
      strong.textContent = `${label}:  `;
      row.append(strong, document.createTextNode(value));
      modalMeta.append(row);
    });
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => modalClose.focus(), 120);
    toast('Registration submitted successfully! 🎉', 'ok');
  };
  const closeModal = (): void => {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    submitButton.focus();
  };

  form.addEventListener('submit', async (event: SubmitEvent) => {
    event.preventDefault();
    const valid = fieldNames.map(checkField).every(Boolean);
    if (!valid) {
      fieldNames.find((key) => fields[key].element?.classList.contains('err') && fields[key].element?.focus());
      return;
    }
    if (!navigator.onLine) { toast('📡 No internet connection. Please reconnect and try again.', 'err'); return; }

    const student: Student = {
      name: clean(valueOf('name')),
      class: clean(valueOf('class')),
      section: clean(valueOf('section')).toUpperCase(),
      roll_no: clean(valueOf('roll_no')),
      sr_no: clean(valueOf('sr_no')),
    };
    const endpoint = 'https://script.google.com/macros/s/AKfycbyBWU5xWFfQWdr-vjn6zCv7n_5annSqedx9mptWiRIPACHfzkA7C8kngdBQ01vuKI3F/exec';
    const body = new URLSearchParams(student);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 12000);
    setLoading(true);
    try {
      // Apps Script endpoint uses a no-cors form post; its response is opaque by design.
      await fetch(endpoint, { method: 'POST', body, mode: 'no-cors', signal: controller.signal });
      form.reset();
      fieldNames.forEach((key) => setError(key, ''));
      openModal(student);
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') toast('⏱️ Request timed out. Check your connection and try again.', 'err');
      else toast('⚠️ Submission failed. Please try again in a moment.', 'err');
      console.error('[Techthon] Registration request failed:', error);
    } finally {
      window.clearTimeout(timeout);
      setLoading(false);
    }
  });
  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(); });
  document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && modal.classList.contains('show')) closeModal(); });
}

function init(): void {
  initBackgroundCanvas();
  initNavigation();
  initRevealAnimations();
  initTerminal();
  initBase64Tool();
  initRegistration();
}

document.addEventListener('DOMContentLoaded', init, { once: true });
