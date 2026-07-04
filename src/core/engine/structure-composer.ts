import { KeySignature } from '../model/key-signature';
import { Progression } from '../model/progression';
import { HarmonicFunction, ModulationFrequency } from '../types';
import type { ProgressionRequest } from '../types';
import { ChordSelector } from './chord-selector';
import { JazzRuleEngine } from './jazz-rule-engine';
import { ModulationStrategy } from './modulation-strategy';

const VERSE_BARS  = 8;
const BRIDGE_BARS = 8;
const CHORUS_BARS = 8;
const OUTRO_BARS  = 4;

const PATTERN_8: readonly HarmonicFunction[] = [
  HarmonicFunction.TONIC,       HarmonicFunction.SUBDOMINANT,
  HarmonicFunction.DOMINANT,    HarmonicFunction.TONIC,
  HarmonicFunction.TONIC,       HarmonicFunction.SUBDOMINANT,
  HarmonicFunction.DOMINANT,    HarmonicFunction.TONIC,
];

const PATTERN_4: readonly HarmonicFunction[] = [
  HarmonicFunction.TONIC,       HarmonicFunction.SUBDOMINANT,
  HarmonicFunction.DOMINANT,    HarmonicFunction.TONIC,
];

export class StructureComposer {
  private readonly chordSelector: ChordSelector;
  private readonly ruleEngine:    JazzRuleEngine;
  private readonly modulation:    ModulationStrategy;

  constructor(
    chordSelector: ChordSelector,
    ruleEngine:    JazzRuleEngine,
    modulation:    ModulationStrategy,
  ) {
    this.chordSelector = chordSelector;
    this.ruleEngine    = ruleEngine;
    this.modulation    = modulation;
  }

  compose(request: ProgressionRequest): Progression[] {
    const homeKey  = KeySignature.of(request.tonicName, request.scaleType);
    const tokens   = parseSongForm(request.songForm);
    const sections: Progression[] = [];
    let currentKey = homeKey;

    for (const token of tokens) {
      const label      = labelFor(token);
      const sectionKey = this.resolveKey(token, homeKey, request);
      const bridge     = sectionKey.equals(currentKey)
        ? []
        : this.modulation.buildBridge(currentKey, sectionKey, request.modulationFrequency);
      const bars = barsForSection(token);

      let enriched = this.ruleEngine.apply(
        this.buildSection(label, sectionKey, bars, request),
        sectionKey,
        request.style,
      );

      if (bridge.length > 0) {
        enriched = Progression.builder()
          .addAll([...bridge, ...enriched.chords])
          .label(label)
          .build();
      }

      sections.push(enriched);
      currentKey = sectionKey;
    }

    return sections;
  }

  private buildSection(
    label:   string,
    key:     KeySignature,
    bars:    number,
    request: ProgressionRequest,
  ): Progression {
    const pattern = bars >= 8 ? PATTERN_8 : PATTERN_4;
    const builder = Progression.builder().label(label);
    for (let i = 0; i < bars; i++) {
      const fn = pattern[i % pattern.length];
      builder.add(this.chordSelector.select(fn, key, request.complexity, request.style));
    }
    return builder.build();
  }

  private resolveKey(
    token:   string,
    homeKey: KeySignature,
    request: ProgressionRequest,
  ): KeySignature {
    if (request.modulationFrequency === ModulationFrequency.NONE) return homeKey;
    const t = token.toLowerCase();
    if (t === 'b' || t === 'bridge') return homeKey.subdominantKey();
    return homeKey;
  }
}

function parseSongForm(form: string): string[] {
  if (!form || !form.trim()) return ['A', 'A', 'B', 'A'];
  const trimmed = form.trim();
  if (/^[A-Za-z]+$/.test(trimmed) && !trimmed.includes('-')) {
    return trimmed.toUpperCase().split('');
  }
  return trimmed.split(/[-_\s]+/);
}

function labelFor(token: string): string {
  switch (token.toUpperCase()) {
    case 'A': case 'VERSE':  return 'Verse A';
    case 'B': case 'BRIDGE': return 'Bridge B';
    case 'C': case 'CHORUS': return 'Chorus C';
    case 'OUTRO':            return 'Outro';
    default:                 return `Section ${token}`;
  }
}

function barsForSection(token: string): number {
  switch (token.toUpperCase()) {
    case 'A': case 'VERSE':  return VERSE_BARS;
    case 'B': case 'BRIDGE': return BRIDGE_BARS;
    case 'C': case 'CHORUS': return CHORUS_BARS;
    case 'OUTRO':            return OUTRO_BARS;
    default:                 return VERSE_BARS;
  }
}
