import './style.css';
import {
  HarmonyGeneratorService,
  ScaleType,
  HarmonyStyle,
  ComplexityLevel,
  ModulationFrequency,
  createRequest,
} from './core/index';
import type { Progression } from './core/index';

// ============================================================
// DATA
// ============================================================

const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;
const SHARP_DISP: Record<string, string> = {
  'C':'C','C#':'C♯','D':'D','D#':'D♯','E':'E',
  'F':'F','F#':'F♯','G':'G','G#':'G♯','A':'A','A#':'A♯','B':'B',
};
const FLAT_ALT: Record<string, string> = {
  'C#':'D♭','D#':'E♭','F#':'G♭','G#':'A♭','A#':'B♭',
};
const IS_SHARP: Record<string, boolean> = {
  'C#':true,'D#':true,'F#':true,'G#':true,'A#':true,
};

const SCALE_GROUPS = [
  {
    label: 'Common',
    scales: [
      { type: ScaleType.MAJOR,          name: 'Major',         desc: 'Bright — foundation of Western harmony' },
      { type: ScaleType.NATURAL_MINOR,  name: 'Natural Minor', desc: 'Dark, introspective — Aeolian mode' },
      { type: ScaleType.HARMONIC_MINOR, name: 'Harmonic Minor',desc: 'Raised 7th — classical minor cadences' },
      { type: ScaleType.MELODIC_MINOR,  name: 'Melodic Minor', desc: 'Jazz ascending form — Lydian Dominant' },
    ],
  },
  {
    label: 'Modes',
    scales: [
      { type: ScaleType.DORIAN,     name: 'Dorian',     desc: 'Minor + raised 6th — cool jazz, Latin' },
      { type: ScaleType.PHRYGIAN,   name: 'Phrygian',   desc: 'Flat 2nd — Spanish, flamenco, dark' },
      { type: ScaleType.LYDIAN,     name: 'Lydian',     desc: 'Major + ♯4 — bright, ethereal, cinematic' },
      { type: ScaleType.MIXOLYDIAN, name: 'Mixolydian', desc: 'Major + ♭7 — blues, rock, dominant feel' },
      { type: ScaleType.LOCRIAN,    name: 'Locrian',    desc: 'Diminished tonic — avant-garde, dissonant' },
    ],
  },
  {
    label: 'Pentatonic & Blues',
    scales: [
      { type: ScaleType.PENTATONIC_MAJOR, name: 'Major Pentatonic', desc: 'Country, pop — five-note major' },
      { type: ScaleType.PENTATONIC_MINOR, name: 'Minor Pentatonic', desc: 'Blues, rock — five-note minor' },
      { type: ScaleType.BLUES,            name: 'Blues',            desc: 'The blues scale — soulful, raw' },
    ],
  },
  {
    label: 'Symmetric',
    scales: [
      { type: ScaleType.WHOLE_TONE,    name: 'Whole Tone',     desc: 'Debussy, floating — no tonal centre' },
      { type: ScaleType.DIMINISHED_WH, name: 'Dim. Whole-Half',desc: 'Octatonic W-H — symmetric tension' },
      { type: ScaleType.DIMINISHED_HW, name: 'Dim. Half-Whole',desc: 'Octatonic H-W — bebop diminished' },
    ],
  },
] as const;

const FORM_PRESETS = [
  { id:'aaba',  label:'32-bar Standard', value:'AABA',                       hint:'AABA' },
  { id:'abac',  label:'32-bar (ABAC)',   value:'ABAC',                       hint:'ABAC' },
  { id:'vc',    label:'Verse · Chorus',  value:'verse-chorus-verse-chorus',  hint:'V-C-V-C' },
  { id:'vcb',   label:'V · C · Bridge', value:'verse-chorus-bridge-chorus', hint:'V-C-B-C' },
  { id:'ab',    label:'Two-part (AB)',   value:'AB',                         hint:'AB' },
  { id:'custom',label:'Custom…',         value:'',                           hint:'' },
] as const;

const STYLE_OPTIONS = [
  { key: HarmonyStyle.SIMPLE,        icon: '∿', label: 'Simple',       desc: 'Diatonic triads — folk, country, acoustic' },
  { key: HarmonyStyle.POP,           icon: '♩', label: 'Pop',          desc: 'Seventh chords — modern pop & rock harmony' },
  { key: HarmonyStyle.JAZZ_STANDARD, icon: '♪', label: 'Jazz Standard',desc: 'ii-V-I, turnarounds, secondary dominants' },
  { key: HarmonyStyle.JAZZ_MODERN,   icon: '♫', label: 'Jazz Modern',  desc: 'Altered doms, tritone subs, upper extensions' },
] as const;

const COMPLEXITY_OPTIONS = [
  { key: ComplexityLevel.TRIADS,          label: 'Triads',     sub: '1-3-5' },
  { key: ComplexityLevel.SEVENTH_CHORDS,  label: '7th Chords', sub: '+ 7th' },
  { key: ComplexityLevel.NINTHS,          label: '9th Chords', sub: '+ 9th' },
  { key: ComplexityLevel.FULL_EXTENSIONS, label: 'Full Ext.',  sub: '9-11-13' },
] as const;

const MODULATION_OPTIONS = [
  { key: ModulationFrequency.NONE,   label: 'None',   sub: 'one key' },
  { key: ModulationFrequency.LOW,    label: 'Low',    sub: 'pivot' },
  { key: ModulationFrequency.MEDIUM, label: 'Medium', sub: 'ii-V' },
  { key: ModulationFrequency.HIGH,   label: 'High',   sub: 'chromatic' },
] as const;

// ============================================================
// STATE
// ============================================================

interface State {
  tonic:          string;
  scaleType:      ScaleType;
  scaleGroup:     number;
  formPreset:     string;
  formCustom:     string;
  style:          HarmonyStyle;
  complexity:     ComplexityLevel;
  modulation:     ModulationFrequency;
  lastSeed:       number;
}

const state: State = {
  tonic:      'C',
  scaleType:  ScaleType.MAJOR,
  scaleGroup: 0,
  formPreset: 'aaba',
  formCustom: '',
  style:      HarmonyStyle.JAZZ_STANDARD,
  complexity: ComplexityLevel.SEVENTH_CHORDS,
  modulation: ModulationFrequency.MEDIUM,
  lastSeed:   0,
};

// ============================================================
// DOM HELPERS
// ============================================================

function q(sel: string): HTMLElement | null {
  return document.querySelector(sel);
}
function qa(sel: string): NodeListOf<HTMLElement> {
  return document.querySelectorAll(sel);
}
function setSelected(group: string, value: string) {
  qa(`[data-group="${group}"]`).forEach(el => {
    const match = el.dataset.value === value;
    el.classList.toggle('selected', match);
    el.setAttribute('aria-pressed', String(match));
  });
}
function showToast(msg: string) {
  let toast = document.getElementById('jh-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'jh-toast';
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast!.classList.remove('show'), 2000);
}

// ============================================================
// HTML BUILDERS
// ============================================================

function buildNoteGrid(): string {
  return NOTES.map(n => `
    <button class="note-btn ${IS_SHARP[n] ? 'accidental' : 'natural'} ${n === state.tonic ? 'selected' : ''}"
      data-action="set-note" data-group="note" data-value="${n}"
      aria-label="${n}${FLAT_ALT[n] ? ` / ${FLAT_ALT[n]}` : ''}" aria-pressed="${n === state.tonic}">
      <span class="nb-main">${SHARP_DISP[n]}</span>
      ${FLAT_ALT[n] ? `<span class="nb-alt">${FLAT_ALT[n]}</span>` : ''}
    </button>`).join('');
}

function buildScaleGrid(groupIdx: number): string {
  return SCALE_GROUPS[groupIdx].scales.map(s => `
    <button class="scale-btn ${s.type === state.scaleType ? 'selected' : ''}"
      data-action="set-scale" data-group="scale" data-value="${s.type.displayName}"
      aria-pressed="${s.type === state.scaleType}">
      <span class="sc-name">${s.name}</span>
      <span class="sc-desc">${s.desc}</span>
    </button>`).join('');
}

function buildScaleTabs(): string {
  return SCALE_GROUPS.map((g, i) => `
    <button class="scale-tab ${i === state.scaleGroup ? 'active' : ''}"
      data-action="scale-tab" data-value="${i}" aria-selected="${i === state.scaleGroup}">
      ${g.label}
    </button>`).join('');
}

function buildFormPresets(): string {
  return FORM_PRESETS.map(f => `
    <button class="form-chip ${f.id === state.formPreset ? 'selected' : ''}"
      data-action="set-form" data-group="form" data-value="${f.id}"
      aria-pressed="${f.id === state.formPreset}">
      <span class="form-chip-label">${f.label}</span>
      ${f.hint ? `<span class="form-chip-value">${f.hint}</span>` : ''}
    </button>`).join('');
}

function buildStyleGrid(): string {
  return STYLE_OPTIONS.map(s => `
    <button class="style-card ${s.key === state.style ? 'selected' : ''}"
      data-action="set-style" data-group="style" data-value="${s.key}"
      aria-pressed="${s.key === state.style}">
      <span class="sc-icon">${s.icon}</span>
      <span class="sc-title">${s.label}</span>
      <span class="sc-detail">${s.desc}</span>
    </button>`).join('');
}

function buildComplexityControl(): string {
  return COMPLEXITY_OPTIONS.map(c => `
    <button class="seg-btn ${c.key === state.complexity ? 'selected' : ''}"
      data-action="set-complexity" data-group="complexity" data-value="${c.key}"
      aria-pressed="${c.key === state.complexity}">
      <span class="seg-label">${c.label}</span>
      <span class="seg-sub">${c.sub}</span>
    </button>`).join('');
}

function buildModulationControl(): string {
  return MODULATION_OPTIONS.map(m => `
    <button class="seg-btn ${m.key === state.modulation ? 'selected' : ''}"
      data-action="set-modulation" data-group="modulation" data-value="${m.key}"
      aria-pressed="${m.key === state.modulation}">
      <span class="seg-label">${m.label}</span>
      <span class="seg-sub">${m.sub}</span>
    </button>`).join('');
}

// ============================================================
// FULL APP HTML (built once on init)
// ============================================================

function buildAppHTML(): string {
  return `
<div class="jh-wrap">
  <header class="jh-header">
    <div class="jh-logo">
      <span class="logo-note">♩</span>
      <span class="logo-text">J-Harmonix</span>
    </div>
    <p class="jh-tagline">Professional Jazz Harmony Generator</p>
  </header>

  <main class="jh-main">
    <!-- ── Config column ── -->
    <div class="config-col">

      <!-- Step 1: Key Center -->
      <section class="step-section">
        <div class="step-hd">
          <span class="step-n">01</span>
          <div>
            <h2 class="step-title">Key Center</h2>
            <p class="step-sub">The tonic note your progression revolves around</p>
          </div>
        </div>
        <div class="note-grid" role="group" aria-label="Select tonic note">
          ${buildNoteGrid()}
        </div>
      </section>

      <!-- Step 2: Scale -->
      <section class="step-section">
        <div class="step-hd">
          <span class="step-n">02</span>
          <div>
            <h2 class="step-title">Scale</h2>
            <p class="step-sub">Interval structure — shapes the harmonic colour</p>
          </div>
        </div>
        <div class="scale-tabs" role="tablist" id="scale-tabs">
          ${buildScaleTabs()}
        </div>
        <div class="scale-grid" id="scale-grid" role="group" aria-label="Select scale">
          ${buildScaleGrid(state.scaleGroup)}
        </div>
      </section>

      <!-- Step 3: Song Form -->
      <section class="step-section">
        <div class="step-hd">
          <span class="step-n">03</span>
          <div>
            <h2 class="step-title">Song Form</h2>
            <p class="step-sub">The structural blueprint of your composition</p>
          </div>
        </div>
        <div class="form-presets" role="group" aria-label="Select song form">
          ${buildFormPresets()}
        </div>
        <div class="form-custom-wrap ${state.formPreset === 'custom' ? 'visible' : ''}" id="form-custom-wrap">
          <label class="form-custom-label" for="form-custom-input">
            Enter section letters (e.g. <strong>AABA</strong>) or names (e.g. <strong>verse-chorus-bridge</strong>)
          </label>
          <input id="form-custom-input" class="form-custom-input" type="text"
            placeholder="AABA or verse-chorus-bridge-chorus"
            value="${state.formCustom}" autocomplete="off" spellcheck="false" />
          <p class="form-custom-hint">Letters A-Z map to sections · Use hyphens for named sections</p>
        </div>
      </section>

      <!-- Step 4: Harmony Style -->
      <section class="step-section">
        <div class="step-hd">
          <span class="step-n">04</span>
          <div>
            <h2 class="step-title">Harmony Style</h2>
            <p class="step-sub">Jazz sophistication level — from folk to modern jazz</p>
          </div>
        </div>
        <div class="style-grid" role="group" aria-label="Select harmony style">
          ${buildStyleGrid()}
        </div>
      </section>

      <!-- Step 5: Complexity -->
      <section class="step-section">
        <div class="step-hd">
          <span class="step-n">05</span>
          <div>
            <h2 class="step-title">Chord Complexity</h2>
            <p class="step-sub">Maximum voicing density — how many notes per chord</p>
          </div>
        </div>
        <div class="seg-control" role="group" aria-label="Select chord complexity">
          ${buildComplexityControl()}
        </div>
      </section>

      <!-- Step 6: Modulation -->
      <section class="step-section">
        <div class="step-hd">
          <span class="step-n">06</span>
          <div>
            <h2 class="step-title">Key Modulation</h2>
            <p class="step-sub">How often and how adventurously the key changes</p>
          </div>
        </div>
        <div class="seg-control" role="group" aria-label="Select modulation frequency">
          ${buildModulationControl()}
        </div>
      </section>

      <!-- Generate -->
      <div class="generate-area">
        <button id="generate-btn" class="generate-btn" data-action="generate">
          <span class="generate-icon">♫</span>
          <span>Generate Progression</span>
        </button>
        <p class="generate-hint">Press Enter or Space to generate</p>
      </div>
    </div>

    <!-- ── Output column ── -->
    <div class="output-col">
      <div id="output-zone">
        <div class="output-placeholder">
          <div class="ph-icon">♩</div>
          <p class="ph-title">Your progression appears here</p>
          <p class="ph-sub">Configure the parameters on the left, then hit Generate</p>
          <div class="ph-steps">
            <span class="ph-step"><span class="ph-step-num">tip</span> Default settings already produce great jazz progressions</span>
            <span class="ph-step"><span class="ph-step-num">tip</span> Regenerate multiple times — each result is unique</span>
          </div>
        </div>
      </div>
    </div>
  </main>
</div>`;
}

// ============================================================
// OUTPUT RENDERING
// ============================================================

function currentFormValue(): string {
  if (state.formPreset === 'custom') return state.formCustom || 'AABA';
  return FORM_PRESETS.find(f => f.id === state.formPreset)?.value || 'AABA';
}

function renderOutput(progressions: Progression[], seed: number): string {
  const formValue = currentFormValue();
  const styleName = STYLE_OPTIONS.find(s => s.key === state.style)?.label ?? state.style;
  const keyLabel  = `${state.tonic} ${state.scaleType.displayName.toUpperCase()}`;

  const banner = `
    <div class="output-banner">
      <div class="banner-meta">
        <span class="banner-note">♩</span>
        <span class="banner-key">${keyLabel}</span>
        <span class="banner-sep">·</span>
        <span class="banner-form">${formValue.toUpperCase()}</span>
        <span class="banner-sep">·</span>
        <span class="banner-style">${styleName}</span>
      </div>
      <div class="banner-actions">
        <button class="btn-act" data-action="copy">Copy</button>
        <button class="btn-act primary" data-action="regenerate">↺ New</button>
      </div>
    </div>`;

  const sections = progressions.map((prog, pi) => {
    const chips = prog.chords.map((chord, ci) => {
      const delay = (pi * 0.06 + ci * 0.035).toFixed(3);
      const root    = chord.root.toString();
      const quality = chord.quality.symbol;
      return `
        <div class="chord-chip" style="animation-delay:${delay}s" title="${chord.toString()}">
          <span class="chord-root">${root}</span>
          <span class="chord-quality">${quality}</span>
        </div>
        <div class="chord-sep"></div>`;
    }).join('');

    return `
      <div class="section-card">
        <div class="sec-header">
          <span class="sec-name">${prog.sectionLabel || 'Section'}</span>
          <span class="sec-bars">${prog.size} chords</span>
        </div>
        <div class="chord-row">${chips}</div>
      </div>`;
  }).join('');

  const seedInfo = `
    <div class="seed-info">
      <span class="seed-label">Seed</span>
      <span class="seed-value">${seed}</span>
    </div>`;

  return `<div class="output-content">${banner}<div class="section-cards">${sections}</div>${seedInfo}</div>`;
}

function buildPlainText(progressions: Progression[]): string {
  const bar  = '═'.repeat(60);
  const form = currentFormValue().toUpperCase();
  const key  = `${state.tonic} ${state.scaleType.displayName.toUpperCase()}`;
  let out = `${bar}\n  J-Harmonix  ·  Key: ${key}  ·  Form: ${form}\n${bar}\n\n`;
  for (const prog of progressions) {
    if (prog.sectionLabel) out += `[${prog.sectionLabel}]\n`;
    out += '| ' + prog.chords.map(c => c.toString()).join(' | ') + ' |\n\n';
  }
  return out.trim();
}

// ============================================================
// ACTIONS
// ============================================================

let lastProgressions: Progression[] = [];

function generate(seed?: number) {
  const btn = q('#generate-btn') as HTMLButtonElement;
  btn.disabled = true;
  btn.classList.add('loading');

  const actualSeed = seed ?? Math.floor(Math.random() * 2 ** 31);
  state.lastSeed = actualSeed;

  const request = createRequest({
    tonicName:           state.tonic,
    scaleType:           state.scaleType,
    songForm:            currentFormValue(),
    style:               state.style,
    complexity:          state.complexity,
    modulationFrequency: state.modulation,
  });

  // Defer to allow the loading state to paint
  setTimeout(() => {
    try {
      const svc = HarmonyGeneratorService.withSeed(actualSeed);
      lastProgressions = svc.generate(request);
      const zone = q('#output-zone')!;
      zone.innerHTML = renderOutput(lastProgressions, actualSeed);
    } catch (err) {
      const zone = q('#output-zone')!;
      zone.innerHTML = `<div class="output-placeholder">
        <div class="ph-icon" style="color:var(--danger)">⚠</div>
        <p class="ph-title" style="color:var(--danger)">Generation error</p>
        <p class="ph-sub">${String(err)}</p>
      </div>`;
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  }, 16);
}

function copyOutput() {
  if (!lastProgressions.length) return;
  const text = buildPlainText(lastProgressions);
  navigator.clipboard.writeText(text).then(
    () => showToast('Progression copied to clipboard'),
    () => showToast('Copy not available — try Ctrl+A, Ctrl+C'),
  );
}

// ============================================================
// EVENT SETUP
// ============================================================

function setupEvents(app: HTMLElement) {
  // Keyboard shortcut: Enter / Space to generate
  document.addEventListener('keydown', (e) => {
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      generate();
    }
  });

  // Custom form input
  app.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.id === 'form-custom-input') {
      state.formCustom = el.value;
    }
  });

  // Event delegation for all buttons
  app.addEventListener('click', (e) => {
    const target = (e.target as Element).closest('[data-action]') as HTMLElement | null;
    if (!target) return;
    const action = target.dataset.action!;
    const value  = target.dataset.value ?? '';

    switch (action) {
      case 'set-note': {
        state.tonic = value;
        setSelected('note', value);
        break;
      }
      case 'set-scale': {
        const found = ScaleType.ALL.find(s => s.displayName === value);
        if (found) { state.scaleType = found; setSelected('scale', value); }
        break;
      }
      case 'scale-tab': {
        state.scaleGroup = +value;
        qa('[data-action="scale-tab"]').forEach(el => {
          el.classList.toggle('active', el.dataset.value === value);
          el.setAttribute('aria-selected', String(el.dataset.value === value));
        });
        const grid = q('#scale-grid')!;
        grid.innerHTML = buildScaleGrid(state.scaleGroup);
        break;
      }
      case 'set-form': {
        state.formPreset = value;
        setSelected('form', value);
        const wrap = q('#form-custom-wrap')!;
        wrap.classList.toggle('visible', value === 'custom');
        if (value === 'custom') {
          (q('#form-custom-input') as HTMLInputElement)?.focus();
        }
        break;
      }
      case 'set-style': {
        state.style = value as HarmonyStyle;
        setSelected('style', value);
        break;
      }
      case 'set-complexity': {
        state.complexity = value as ComplexityLevel;
        setSelected('complexity', value);
        break;
      }
      case 'set-modulation': {
        state.modulation = value as ModulationFrequency;
        setSelected('modulation', value);
        break;
      }
      case 'generate':    generate();                 break;
      case 'regenerate':  generate();                 break;
      case 'copy':        copyOutput();               break;
    }
  });
}

// ============================================================
// INIT
// ============================================================

function init() {
  const app = document.getElementById('app')!;
  app.innerHTML = buildAppHTML();
  setupEvents(app);
}

init();
