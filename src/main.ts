import './style.css';
import {
  HarmonyGeneratorService,
  KeySignature,
  ScaleType,
  HarmonyStyle,
  ComplexityLevel,
  ModulationFrequency,
  createRequest,
} from './core/index';
import type { Progression } from './core/index';
import { t, setLocale, getLocale } from './i18n';
import type { Locale, TranslationKey } from './i18n';

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

function getScaleGroups() {
  return [
    {
      label: t('sgCommon'),
      scales: [
        { type: ScaleType.MAJOR,          name: t('nameMajor'),         desc: t('descMajor') },
        { type: ScaleType.NATURAL_MINOR,  name: t('nameNaturalMinor'),  desc: t('descNaturalMinor') },
        { type: ScaleType.HARMONIC_MINOR, name: t('nameHarmonicMinor'), desc: t('descHarmonicMinor') },
        { type: ScaleType.MELODIC_MINOR,  name: t('nameMelodicMinor'),  desc: t('descMelodicMinor') },
      ],
    },
    {
      label: t('sgModes'),
      scales: [
        { type: ScaleType.DORIAN,     name: t('nameDorian'),     desc: t('descDorian') },
        { type: ScaleType.PHRYGIAN,   name: t('namePhrygian'),   desc: t('descPhrygian') },
        { type: ScaleType.LYDIAN,     name: t('nameLydian'),     desc: t('descLydian') },
        { type: ScaleType.MIXOLYDIAN, name: t('nameMixolydian'), desc: t('descMixolydian') },
        { type: ScaleType.LOCRIAN,    name: t('nameLocrian'),    desc: t('descLocrian') },
      ],
    },
    {
      label: t('sgPentatonicBlues'),
      scales: [
        { type: ScaleType.PENTATONIC_MAJOR, name: t('namePentatonicMajor'), desc: t('descPentatonicMajor') },
        { type: ScaleType.PENTATONIC_MINOR, name: t('namePentatonicMinor'), desc: t('descPentatonicMinor') },
        { type: ScaleType.BLUES,            name: t('nameBlues'),           desc: t('descBlues') },
      ],
    },
    {
      label: t('sgSymmetric'),
      scales: [
        { type: ScaleType.WHOLE_TONE,    name: t('nameWholeTone'), desc: t('descWholeTone') },
        { type: ScaleType.DIMINISHED_WH, name: t('nameDimWH'),     desc: t('descDimWH') },
        { type: ScaleType.DIMINISHED_HW, name: t('nameDimHW'),     desc: t('descDimHW') },
      ],
    },
  ];
}

const FORM_PRESETS = [
  { id: 'aaba',   labelKey: 'formAaba'   as TranslationKey, value: 'AABA',                       hint: 'AABA' },
  { id: 'abac',   labelKey: 'formAbac'   as TranslationKey, value: 'ABAC',                       hint: 'ABAC' },
  { id: 'vc',     labelKey: 'formVc'     as TranslationKey, value: 'verse-chorus-verse-chorus',  hint: 'V-C-V-C' },
  { id: 'vcb',    labelKey: 'formVcb'    as TranslationKey, value: 'verse-chorus-bridge-chorus', hint: 'V-C-B-C' },
  { id: 'ab',     labelKey: 'formAb'     as TranslationKey, value: 'AB',                         hint: 'AB' },
  { id: 'custom', labelKey: 'formCustom' as TranslationKey, value: '',                            hint: '' },
];

const STYLE_OPTIONS = [
  { key: HarmonyStyle.SIMPLE,        icon: '∿', labelKey: 'styleSimpleLabel'  as TranslationKey, descKey: 'styleSimpleDesc'   as TranslationKey },
  { key: HarmonyStyle.POP,           icon: '♩', labelKey: 'stylePopLabel'     as TranslationKey, descKey: 'stylePopDesc'      as TranslationKey },
  { key: HarmonyStyle.JAZZ_STANDARD, icon: '♪', labelKey: 'styleJazzStdLabel' as TranslationKey, descKey: 'styleJazzStdDesc'  as TranslationKey },
  { key: HarmonyStyle.JAZZ_MODERN,   icon: '♫', labelKey: 'styleJazzModLabel' as TranslationKey, descKey: 'styleJazzModDesc'  as TranslationKey },
];

const COMPLEXITY_OPTIONS = [
  { key: ComplexityLevel.TRIADS,          labelKey: 'complexTriads'  as TranslationKey, sub: '1-3-5' },
  { key: ComplexityLevel.SEVENTH_CHORDS,  labelKey: 'complexSeventh' as TranslationKey, sub: '+ 7th' },
  { key: ComplexityLevel.NINTHS,          labelKey: 'complexNinth'   as TranslationKey, sub: '+ 9th' },
  { key: ComplexityLevel.FULL_EXTENSIONS, labelKey: 'complexFull'    as TranslationKey, sub: '9-11-13' },
];

const MODULATION_OPTIONS = [
  { key: ModulationFrequency.NONE,   labelKey: 'modNone'   as TranslationKey, subKey: 'modNoneSub'   as TranslationKey },
  { key: ModulationFrequency.LOW,    labelKey: 'modLow'    as TranslationKey, subKey: 'modLowSub'    as TranslationKey },
  { key: ModulationFrequency.MEDIUM, labelKey: 'modMedium' as TranslationKey, subKey: 'modMediumSub' as TranslationKey },
  { key: ModulationFrequency.HIGH,   labelKey: 'modHigh'   as TranslationKey, subKey: 'modHighSub'   as TranslationKey },
];

// Progressive-reveal metadata (index === data-step)
const STEP_META_KEYS: readonly TranslationKey[] = [
  'stepKey', 'stepScale', 'stepForm', 'stepStyle', 'stepComplexity', 'stepModulation',
];
const TOTAL_STEPS = STEP_META_KEYS.length;

const NEXT_PROMPT_KEYS: readonly TranslationKey[] = [
  'prompt0', 'prompt1', 'prompt2', 'prompt3', 'prompt4', 'prompt5', 'prompt6',
];

// ============================================================
// STATE
// ============================================================

interface State {
  tonic:          string | null;
  scaleType:      ScaleType | null;
  scaleGroup:     number;
  formPreset:     string | null;
  formCustom:     string;
  style:          HarmonyStyle | null;
  complexity:     ComplexityLevel | null;
  modulation:     ModulationFrequency | null;
  accidental:     'sharp' | 'flat' | null;  // null = auto (key convention)
  lastSeed:       number;
  revealed:       number;   // highest step index unlocked (0-based)
}

// Selectable parameters start empty — nothing is pre-selected until the user
// actually clicks. scaleGroup is just which tab is visible (navigation, not a
// musical choice), so it keeps a default.
const state: State = {
  tonic:      null,
  scaleType:  null,
  scaleGroup: 0,
  formPreset: null,
  formCustom: '',
  style:      null,
  complexity: null,
  modulation: null,
  accidental: null,
  lastSeed:   0,
  revealed:   0,
};

// Steps the user has actively configured (data-step indices)
const doneSteps = new Set<number>();

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
// NOTATION (♯ / ♭ preference)
// ============================================================

/** Whether the output should be spelled with flats, honouring an explicit
 *  user choice and otherwise falling back to the key's natural convention. */
function resolvedUseFlats(): boolean {
  if (state.accidental === 'flat')  return true;
  if (state.accidental === 'sharp') return false;
  if (state.tonic && state.scaleType) return KeySignature.of(state.tonic, state.scaleType).usesFlats;
  if (state.tonic)                    return KeySignature.of(state.tonic, ScaleType.MAJOR).usesFlats;
  return false;
}

/** Render '#'/'b' as proper ♯/♭ glyphs for display (not for copied text). */
function pretty(name: string): string {
  return name.replace('#', '♯').replace('b', '♭');
}

/** Highlight the accidental button matching the resolved preference. */
function updateNotationToggle() {
  const useFlats = resolvedUseFlats();
  qa('[data-action="set-accidental"]').forEach(el => {
    const on = (el.dataset.value === 'flat') === useFlats;
    el.classList.toggle('selected', on);
    el.setAttribute('aria-pressed', String(on));
  });
}

// ============================================================
// PROGRESSIVE REVEAL
// ============================================================

/** Human-readable value currently chosen for a given step. */
function stepValueLabel(idx: number): string {
  switch (idx) {
    case 0:
      if (!state.tonic) return '';
      return resolvedUseFlats() && FLAT_ALT[state.tonic]
        ? FLAT_ALT[state.tonic]
        : SHARP_DISP[state.tonic];
    case 1: {
      if (!state.scaleType) return '';
      const groups = getScaleGroups();
      for (const g of groups)
        for (const s of g.scales)
          if (s.type === state.scaleType) return s.name;
      return state.scaleType.displayName;
    }
    case 2: {
      if (state.formPreset === 'custom')
        return state.formCustom ? state.formCustom.toUpperCase() : t('formCustomValue');
      const f = FORM_PRESETS.find(f => f.id === state.formPreset);
      return f?.hint || (f ? t(f.labelKey) : '—');
    }
    case 3: {
      const opt = STYLE_OPTIONS.find(s => s.key === state.style);
      return opt ? t(opt.labelKey) : '';
    }
    case 4: {
      const opt = COMPLEXITY_OPTIONS.find(c => c.key === state.complexity);
      return opt ? t(opt.labelKey) : '';
    }
    case 5: {
      const opt = MODULATION_OPTIONS.find(m => m.key === state.modulation);
      return opt ? t(opt.labelKey) : '';
    }
    default: return '';
  }
}

function scrollSoft(el: Element) {
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/** Play the one-shot reveal/glow animation, then settle to the resting state. */
function flashReveal(el: Element) {
  el.classList.add('just-revealed');
  setTimeout(() => el.classList.remove('just-revealed'), 1700);
}

/** Reveal the next locked element (step or the generate area) with a glow. */
function revealFrontier() {
  const sections = qa('.step-section');
  const n = state.revealed;
  const target = n < sections.length ? sections[n] : q('.generate-area');
  if (!target) return;
  target.classList.add('revealed');
  flashReveal(target);
  requestAnimationFrame(() => scrollSoft(target));
}

/** Mark a step as configured, update its badge/summary, and unlock the next. */
function completeStep(idx: number) {
  doneSteps.add(idx);

  const sec = qa('.step-section')[idx];
  if (sec) {
    sec.classList.add('completed');
    const badge = sec.querySelector('.step-value') as HTMLElement | null;
    if (badge) badge.textContent = stepValueLabel(idx);
  }

  updateSummary();
  updateProgress();

  if (state.revealed <= idx) {
    state.revealed = idx + 1;
    revealFrontier();
  }
}

/** Header progress bar + label. */
function updateProgress() {
  const fill = q('#progress-fill');
  if (fill) fill.style.width = `${(doneSteps.size / TOTAL_STEPS) * 100}%`;
  const label = q('#progress-label');
  if (label) {
    label.textContent = doneSteps.size >= TOTAL_STEPS
      ? t('progressAllSet')
      : `${doneSteps.size} ${t('progressOf')} ${TOTAL_STEPS} ${t('progressConfigured')}`;
  }
}

/** Live "setup" list in the output column — grows as the user configures. */
function updateSummary() {
  const host = q('#setup-summary');
  if (host) {
    host.innerHTML = [...doneSteps].sort((a, b) => a - b).map(idx => `
      <div class="sum-row">
        <span class="sum-key">${t(STEP_META_KEYS[idx])}</span>
        <span class="sum-val">${stepValueLabel(idx)}</span>
      </div>`).join('');
  }
  const sub = q('#ph-sub');
  if (sub) sub.textContent = t(NEXT_PROMPT_KEYS[Math.min(doneSteps.size, NEXT_PROMPT_KEYS.length - 1)]);
}

// ============================================================
// HTML BUILDERS
// ============================================================

function buildNoteGrid(): string {
  const useFlats = resolvedUseFlats();
  return NOTES.map(n => {
    const isBlack = !!FLAT_ALT[n];
    // Main label follows the ♯/♭ preference; the small alt shows the other spelling.
    const main = useFlats && isBlack ? FLAT_ALT[n] : SHARP_DISP[n];
    const alt  = isBlack ? (useFlats ? SHARP_DISP[n] : FLAT_ALT[n]) : '';
    return `
    <button class="note-btn ${IS_SHARP[n] ? 'accidental' : 'natural'} ${n === state.tonic ? 'selected' : ''}"
      data-action="set-note" data-group="note" data-value="${n}"
      aria-label="${n}${FLAT_ALT[n] ? ` / ${FLAT_ALT[n]}` : ''}" aria-pressed="${n === state.tonic}">
      <span class="nb-main">${main}</span>
      ${alt ? `<span class="nb-alt">${alt}</span>` : ''}
    </button>`;
  }).join('');
}

/** Re-render the note grid so its labels reflect the current ♯/♭ preference. */
function refreshNoteGrid() {
  const grid = q('.note-grid');
  if (grid) grid.innerHTML = buildNoteGrid();
}

function buildScaleGrid(groupIdx: number): string {
  const groups = getScaleGroups();
  return groups[groupIdx].scales.map(s => `
    <button class="scale-btn ${s.type === state.scaleType ? 'selected' : ''}"
      data-action="set-scale" data-group="scale" data-value="${s.type.displayName}"
      aria-pressed="${s.type === state.scaleType}">
      <span class="sc-name">${s.name}</span>
      <span class="sc-desc">${s.desc}</span>
    </button>`).join('');
}

function buildScaleTabs(): string {
  const groups = getScaleGroups();
  return groups.map((g, i) => `
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
      <span class="form-chip-label">${t(f.labelKey)}</span>
      ${f.hint ? `<span class="form-chip-value">${f.hint}</span>` : ''}
    </button>`).join('');
}

function buildStyleGrid(): string {
  return STYLE_OPTIONS.map(s => `
    <button class="style-card ${s.key === state.style ? 'selected' : ''}"
      data-action="set-style" data-group="style" data-value="${s.key}"
      aria-pressed="${s.key === state.style}">
      <span class="sc-icon">${s.icon}</span>
      <span class="sc-title">${t(s.labelKey)}</span>
      <span class="sc-detail">${t(s.descKey)}</span>
    </button>`).join('');
}

function buildComplexityControl(): string {
  return COMPLEXITY_OPTIONS.map(c => `
    <button class="seg-btn ${c.key === state.complexity ? 'selected' : ''}"
      data-action="set-complexity" data-group="complexity" data-value="${c.key}"
      aria-pressed="${c.key === state.complexity}">
      <span class="seg-label">${t(c.labelKey)}</span>
      <span class="seg-sub">${c.sub}</span>
    </button>`).join('');
}

function buildModulationControl(): string {
  return MODULATION_OPTIONS.map(m => `
    <button class="seg-btn ${m.key === state.modulation ? 'selected' : ''}"
      data-action="set-modulation" data-group="modulation" data-value="${m.key}"
      aria-pressed="${m.key === state.modulation}">
      <span class="seg-label">${t(m.labelKey)}</span>
      <span class="seg-sub">${t(m.subKey)}</span>
    </button>`).join('');
}

// ============================================================
// FULL APP HTML (built once on init, rebuilt on language switch)
// ============================================================

function stepHead(n: string, title: string, sub: string): string {
  return `
    <div class="step-hd">
      <span class="step-n">${n}</span>
      <div class="step-hd-text">
        <h2 class="step-title">${title}</h2>
        <p class="step-sub">${sub}</p>
      </div>
      <span class="step-value" aria-hidden="true"></span>
    </div>`;
}

function buildAppHTML(): string {
  const locale = getLocale();
  return `
<div class="jh-wrap">
  <header class="jh-header">
    <div class="lang-toggle" role="group" aria-label="${t('langLabel')}">
      <button class="lang-btn ${locale === 'en' ? 'active' : ''}" data-action="set-lang" data-value="en" aria-pressed="${locale === 'en'}">EN</button>
      <button class="lang-btn ${locale === 'it' ? 'active' : ''}" data-action="set-lang" data-value="it" aria-pressed="${locale === 'it'}">IT</button>
    </div>
    <div class="jh-logo">
      <span class="logo-note">♩</span>
      <span class="logo-text">J-Harmonix</span>
    </div>
    <p class="jh-tagline">${t('tagline')}</p>
    <div class="jh-progress">
      <div class="jh-progress-track"><div class="jh-progress-fill" id="progress-fill"></div></div>
      <span class="jh-progress-label" id="progress-label">0 ${t('progressOf')} ${TOTAL_STEPS} ${t('progressConfigured')}</span>
    </div>
  </header>

  <main class="jh-main">
    <!-- ── Config column ── -->
    <div class="config-col">

      <!-- Step 1: Key Center -->
      <section class="step-section revealed" data-step="0">
        ${stepHead('01', t('step1Title'), t('step1Sub'))}
        <div class="note-grid" role="group" aria-label="${t('ariaSelectNote')}">
          ${buildNoteGrid()}
        </div>
        <div class="notation-row" id="notation-row">
          <span class="notation-label">${t('notationLabel')}</span>
          <div class="notation-toggle" role="group" aria-label="${t('ariaAccidental')}">
            <button class="notation-btn" data-action="set-accidental" data-value="sharp" aria-pressed="false">${t('notationSharps')}</button>
            <button class="notation-btn" data-action="set-accidental" data-value="flat" aria-pressed="false">${t('notationFlats')}</button>
          </div>
          <span class="notation-hint">${t('notationHint')}</span>
        </div>
      </section>

      <!-- Step 2: Scale -->
      <section class="step-section" data-step="1">
        ${stepHead('02', t('step2Title'), t('step2Sub'))}
        <div class="scale-tabs" role="tablist" id="scale-tabs">
          ${buildScaleTabs()}
        </div>
        <div class="scale-grid" id="scale-grid" role="group" aria-label="${t('ariaSelectScale')}">
          ${buildScaleGrid(state.scaleGroup)}
        </div>
      </section>

      <!-- Step 3: Song Form -->
      <section class="step-section" data-step="2">
        ${stepHead('03', t('step3Title'), t('step3Sub'))}
        <div class="form-presets" role="group" aria-label="${t('ariaSelectForm')}">
          ${buildFormPresets()}
        </div>
        <div class="form-custom-wrap ${state.formPreset === 'custom' ? 'visible' : ''}" id="form-custom-wrap">
          <label class="form-custom-label" for="form-custom-input">
            ${t('formCustomLabelHtml')}
          </label>
          <input id="form-custom-input" class="form-custom-input" type="text"
            placeholder="${t('formCustomPlaceholder')}"
            value="${state.formCustom}" autocomplete="off" spellcheck="false" />
          <p class="form-custom-hint">${t('formCustomHint')}</p>
        </div>
      </section>

      <!-- Step 4: Harmony Style -->
      <section class="step-section" data-step="3">
        ${stepHead('04', t('step4Title'), t('step4Sub'))}
        <div class="style-grid" role="group" aria-label="${t('ariaSelectStyle')}">
          ${buildStyleGrid()}
        </div>
      </section>

      <!-- Step 5: Complexity -->
      <section class="step-section" data-step="4">
        ${stepHead('05', t('step5Title'), t('step5Sub'))}
        <div class="seg-control" role="group" aria-label="${t('ariaSelectComplexity')}">
          ${buildComplexityControl()}
        </div>
      </section>

      <!-- Step 6: Modulation -->
      <section class="step-section" data-step="5">
        ${stepHead('06', t('step6Title'), t('step6Sub'))}
        <div class="seg-control" role="group" aria-label="${t('ariaSelectModulation')}">
          ${buildModulationControl()}
        </div>
      </section>

      <!-- Generate -->
      <div class="generate-area">
        <button id="generate-btn" class="generate-btn" data-action="generate">
          <span class="generate-icon">♫</span>
          <span>${t('generateBtn')}</span>
        </button>
        <p class="generate-hint">${t('generateHint')}</p>
      </div>
    </div>

    <!-- ── Output column ── -->
    <div class="output-col">
      <div id="output-zone">
        <div class="output-placeholder">
          <div class="ph-icon">♩</div>
          <p class="ph-title">${t('phTitle')}</p>
          <div class="setup-summary" id="setup-summary"></div>
          <p class="ph-sub" id="ph-sub">${t('prompt0')}</p>
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
  const styleOpt  = STYLE_OPTIONS.find(s => s.key === state.style);
  const styleName = styleOpt ? t(styleOpt.labelKey) : String(state.style);
  const useFlats  = resolvedUseFlats();
  const key       = KeySignature.of(state.tonic!, state.scaleType!);
  const keyLabel  = `${pretty(key.spellWith(key.tonic, useFlats))} ${state.scaleType!.displayName.toUpperCase()}`;

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
        <button class="btn-act" data-action="copy">${t('copyBtn')}</button>
        <button class="btn-act primary" data-action="regenerate">${t('regenerateBtn')}</button>
      </div>
    </div>`;

  const sections = progressions.map((prog, pi) => {
    const chips = prog.chords.map((chord, ci) => {
      const delay = (pi * 0.06 + ci * 0.035).toFixed(3);
      const root    = pretty(key.spellWith(chord.root, useFlats));
      const quality = chord.quality.symbol;
      return `
        <div class="chord-chip" style="animation-delay:${delay}s" title="${root}${quality}">
          <span class="chord-root">${root}</span>
          <span class="chord-quality">${quality}</span>
        </div>
        <div class="chord-sep"></div>`;
    }).join('');

    return `
      <div class="section-card">
        <div class="sec-header">
          <span class="sec-name">${prog.sectionLabel || t('sectionDefault')}</span>
          <span class="sec-bars">${prog.size} ${t('chords')}</span>
        </div>
        <div class="chord-row">${chips}</div>
      </div>`;
  }).join('');

  const seedInfo = `
    <div class="seed-info">
      <span class="seed-label">${t('seedLabel')}</span>
      <span class="seed-value">${seed}</span>
    </div>`;

  return `<div class="output-content">${banner}<div class="section-cards">${sections}</div>${seedInfo}</div>`;
}

function buildPlainText(progressions: Progression[]): string {
  const bar     = '═'.repeat(60);
  const form    = currentFormValue().toUpperCase();
  const useFlats = resolvedUseFlats();
  const key      = KeySignature.of(state.tonic!, state.scaleType!);
  const keyName  = `${key.spellWith(key.tonic, useFlats)} ${state.scaleType!.displayName.toUpperCase()}`;
  let out = `${bar}\n  J-Harmonix  ·  Key: ${keyName}  ·  Form: ${form}\n${bar}\n\n`;
  for (const prog of progressions) {
    if (prog.sectionLabel) out += `[${prog.sectionLabel}]\n`;
    out += '| ' + prog.chords.map(c => key.spellWith(c.root, useFlats) + c.quality.symbol).join(' | ') + ' |\n\n';
  }
  return out.trim();
}

// ============================================================
// ACTIONS
// ============================================================

let lastProgressions: Progression[] = [];

function generate(seed?: number) {
  // Every parameter must be chosen first (the generate button is only revealed
  // once all steps are configured, so this is a defensive guard).
  if (
    state.tonic == null || state.scaleType == null || state.formPreset == null ||
    state.style == null  || state.complexity == null || state.modulation == null
  ) return;

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
        <p class="ph-title" style="color:var(--danger)">${t('errorTitle')}</p>
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
    () => showToast(t('toastCopied')),
    () => showToast(t('toastCopyFail')),
  );
}

// ============================================================
// STATE REHYDRATION (after language switch)
// ============================================================

/** Restore CSS classes and dynamic content after a full HTML rebuild. */
function rehydrateState() {
  const sections = qa('.step-section');

  sections.forEach((sec, i) => {
    if (i < state.revealed) sec.classList.add('revealed');
    if (doneSteps.has(i)) {
      sec.classList.add('completed');
      const badge = sec.querySelector('.step-value') as HTMLElement | null;
      if (badge) badge.textContent = stepValueLabel(i);
    }
  });

  if (state.revealed >= sections.length) q('.generate-area')?.classList.add('revealed');
  if (state.tonic)                        q('#notation-row')?.classList.add('revealed');
  if (state.formPreset === 'custom')       q('#form-custom-wrap')?.classList.add('visible');

  updateNotationToggle();
  updateProgress();
  updateSummary();

  if (lastProgressions.length) {
    const zone = q('#output-zone');
    if (zone) zone.innerHTML = renderOutput(lastProgressions, state.lastSeed);
  }
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
      // Only once the flow has revealed the generate button
      if (!q('.generate-area')?.classList.contains('revealed')) return;
      e.preventDefault();
      generate();
    }
  });

  // Custom form input — keep the badge & live summary in sync while typing
  app.addEventListener('input', (e) => {
    const el = e.target as HTMLInputElement;
    if (el.id === 'form-custom-input') {
      state.formCustom = el.value;
      if (doneSteps.has(2)) {
        const badge = qa('.step-section')[2]?.querySelector('.step-value') as HTMLElement | null;
        if (badge) badge.textContent = stepValueLabel(2);
        updateSummary();
      }
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
        completeStep(0);
        // Reveal the ♯/♭ notation toggle now that there is a key to spell.
        q('#notation-row')?.classList.add('revealed');
        updateNotationToggle();
        refreshNoteGrid();
        break;
      }
      case 'set-accidental': {
        state.accidental = value as 'sharp' | 'flat';
        updateNotationToggle();
        refreshNoteGrid();
        // Refresh the key badge, the live summary and any shown progression.
        if (doneSteps.has(0)) {
          const badge = qa('.step-section')[0]?.querySelector('.step-value') as HTMLElement | null;
          if (badge) badge.textContent = stepValueLabel(0);
        }
        updateSummary();
        if (lastProgressions.length) {
          const zone = q('#output-zone');
          if (zone?.querySelector('.output-content')) {
            zone.innerHTML = renderOutput(lastProgressions, state.lastSeed);
          }
        }
        break;
      }
      case 'set-scale': {
        const found = ScaleType.ALL.find(s => s.displayName === value);
        if (found) {
          state.scaleType = found;
          setSelected('scale', value);
          completeStep(1);
          // In auto mode the flat/sharp default can flip (e.g. minor keys);
          // keep the toggle highlight, the note grid and the key badge in sync.
          if (state.accidental === null) {
            updateNotationToggle();
            refreshNoteGrid();
            const badge = qa('.step-section')[0]?.querySelector('.step-value') as HTMLElement | null;
            if (badge && doneSteps.has(0)) badge.textContent = stepValueLabel(0);
            updateSummary();
          }
        }
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
        completeStep(2);
        if (value === 'custom') {
          (q('#form-custom-input') as HTMLInputElement)?.focus();
        }
        break;
      }
      case 'set-style': {
        state.style = value as HarmonyStyle;
        setSelected('style', value);
        completeStep(3);
        break;
      }
      case 'set-complexity': {
        state.complexity = value as ComplexityLevel;
        setSelected('complexity', value);
        completeStep(4);
        break;
      }
      case 'set-modulation': {
        state.modulation = value as ModulationFrequency;
        setSelected('modulation', value);
        completeStep(5);
        break;
      }
      case 'generate':   generate();   break;
      case 'regenerate': generate();   break;
      case 'copy':       copyOutput(); break;
      case 'set-lang': {
        if (value === 'en' || value === 'it') {
          setLocale(value as Locale);
          app.innerHTML = buildAppHTML();
          rehydrateState();
        }
        break;
      }
    }
  });
}

// ============================================================
// INIT
// ============================================================

function init() {
  document.documentElement.lang = getLocale();
  const app = document.getElementById('app')!;
  app.innerHTML = buildAppHTML();
  setupEvents(app);
  updateProgress();
  updateSummary();
  // Entrance animation for the first (already-unlocked) step
  const first = qa('.step-section')[0];
  if (first) flashReveal(first);
}

// Register the PWA service worker (production only — avoids caching during dev).
function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const base = import.meta.env.BASE_URL;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`, { scope: base }).catch(() => {});
  });
}

init();
registerServiceWorker();
