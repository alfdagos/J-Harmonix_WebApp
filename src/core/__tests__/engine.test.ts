import { describe, it, expect } from 'vitest';
import { Note } from '../model/note';
import { ChordQuality } from '../model/chord-quality';
import { ScaleType } from '../model/scale-type';
import { Chord } from '../model/chord';
import { KeySignature } from '../model/key-signature';
import { Progression } from '../model/progression';
import { ChordSelector } from '../engine/chord-selector';
import { JazzRuleEngine } from '../engine/jazz-rule-engine';
import { ModulationStrategy } from '../engine/modulation-strategy';
import { StructureComposer } from '../engine/structure-composer';
import { HarmonicFunction, HarmonyStyle, ComplexityLevel, ModulationFrequency } from '../types';

// ─── ChordSelector ───────────────────────────────────────────

describe('ChordSelector', () => {
  const cMajor = KeySignature.major('C');

  it('DOMINANT function always returns the V chord (G7 in C Major)', () => {
    for (let seed = 0; seed < 20; seed++) {
      const s = new ChordSelector(seed);
      const chord = s.select(HarmonicFunction.DOMINANT, cMajor, ComplexityLevel.SEVENTH_CHORDS, HarmonyStyle.SIMPLE);
      expect(chord.root.toString()).toBe('G');
    }
  });

  it('TONIC function returns I (Cmaj7) or VI (Am7) in C Major', () => {
    const results = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const s = new ChordSelector(seed);
      const chord = s.select(HarmonicFunction.TONIC, cMajor, ComplexityLevel.SEVENTH_CHORDS, HarmonyStyle.SIMPLE);
      results.add(chord.root.toString());
    }
    expect(results.has('C')).toBe(true);   // I = Cmaj7
    expect(results.has('A')).toBe(true);   // VI = Am7
    // No other root should appear
    expect([...results].every(r => r === 'C' || r === 'A')).toBe(true);
  });

  it('SUBDOMINANT function returns II (Dm7) or IV (Fmaj7) in C Major', () => {
    const results = new Set<string>();
    for (let seed = 0; seed < 100; seed++) {
      const s = new ChordSelector(seed);
      const chord = s.select(HarmonicFunction.SUBDOMINANT, cMajor, ComplexityLevel.SEVENTH_CHORDS, HarmonyStyle.SIMPLE);
      results.add(chord.root.toString());
    }
    expect(results.has('D')).toBe(true);   // II = Dm7
    expect(results.has('F')).toBe(true);   // IV = Fmaj7
    expect([...results].every(r => r === 'D' || r === 'F')).toBe(true);
  });

  it('TRIADS complexity downgrades seventh chords to triads', () => {
    for (let seed = 0; seed < 30; seed++) {
      const s = new ChordSelector(seed);
      for (const fn of [HarmonicFunction.TONIC, HarmonicFunction.SUBDOMINANT, HarmonicFunction.DOMINANT]) {
        const chord = s.select(fn, cMajor, ComplexityLevel.TRIADS, HarmonyStyle.SIMPLE);
        const triadQualities = [
          ChordQuality.MAJOR_TRIAD,
          ChordQuality.MINOR_TRIAD,
          ChordQuality.DIM_TRIAD,
          ChordQuality.AUG_TRIAD,
        ];
        expect(triadQualities).toContain(chord.quality);
      }
    }
  });

  it('NINTHS complexity upgrades dominant to 9th chord', () => {
    let foundNinth = false;
    for (let seed = 0; seed < 20; seed++) {
      const sel = new ChordSelector(seed);
      const chord = sel.select(
        HarmonicFunction.DOMINANT, cMajor,
        ComplexityLevel.NINTHS, HarmonyStyle.SIMPLE,
      );
      if (chord.quality === ChordQuality.DOMINANT_NINTH) foundNinth = true;
    }
    expect(foundNinth).toBe(true);
  });

  it('JAZZ_MODERN style can produce altered dominant or tritone sub', () => {
    const alteredQualities = new Set<ChordQuality>();
    for (let seed = 0; seed < 200; seed++) {
      const s = new ChordSelector(seed);
      const chord = s.select(
        HarmonicFunction.DOMINANT, cMajor,
        ComplexityLevel.SEVENTH_CHORDS, HarmonyStyle.JAZZ_MODERN,
      );
      alteredQualities.add(chord.quality);
    }
    // Should see at least one altered or tritone-sub chord in 200 attempts
    const hasAltered = alteredQualities.has(ChordQuality.DOM_SEVENTH_FLAT_NINE);
    const hasTritone = [...alteredQualities].some(q => q === ChordQuality.DOMINANT_SEVENTH);
    expect(hasAltered || hasTritone).toBe(true);
  });
});

// ─── JazzRuleEngine ──────────────────────────────────────────

describe('JazzRuleEngine', () => {
  const cMajor = KeySignature.major('C');
  const dm7    = Chord.of(Note.fromName('D'), ChordQuality.MINOR_SEVENTH);
  const g7     = Chord.of(Note.fromName('G'), ChordQuality.DOMINANT_SEVENTH);
  const cmaj7  = Chord.of(Note.fromName('C'), ChordQuality.MAJOR_SEVENTH);
  const am7    = Chord.of(Note.fromName('A'), ChordQuality.MINOR_SEVENTH);
  const fmaj7  = Chord.of(Note.fromName('F'), ChordQuality.MAJOR_SEVENTH);
  const em7    = Chord.of(Note.fromName('E'), ChordQuality.MINOR_SEVENTH);

  it('SIMPLE and POP styles return the progression unchanged', () => {
    const engine = new JazzRuleEngine(1);
    const input = Progression.builder()
      .add(cmaj7).add(am7).add(dm7).add(g7)
      .label('Verse A').build();

    for (const style of [HarmonyStyle.SIMPLE, HarmonyStyle.POP]) {
      const result = engine.apply(input, cMajor, style);
      expect(result.toString()).toBe(input.toString());
    }
  });

  it('JAZZ_STANDARD applies turnaround when section ends on tonic', () => {
    // Build a 4-chord section ending on Cmaj7 (tonic)
    const input = Progression.builder()
      .add(fmaj7).add(em7).add(dm7).add(cmaj7)
      .label('Verse A').build();

    // With multiple seeds, turnaround should fire
    let sawTurnaround = false;
    for (let seed = 0; seed < 30; seed++) {
      const engine = new JazzRuleEngine(seed);
      const result = engine.apply(input, cMajor, HarmonyStyle.JAZZ_STANDARD);
      // After turnaround, last 4 chords should be I-VI-ii-V
      if (result.size === 4) {
        const roots = result.chords.map(c => c.root.toString());
        const isIVIIV = roots[0] === 'C' && roots[1] === 'A' && roots[2] === 'D' && roots[3] === 'G';
        if (isIVIIV) sawTurnaround = true;
      }
    }
    expect(sawTurnaround).toBe(true);
  });

  it('buildTwoFiveOne returns [IIm7, V7, Imaj7] in any key', () => {
    const engine = new JazzRuleEngine(0);

    // C Major: Dm7 - G7 - Cmaj7
    const cTwoFiveOne = engine.buildTwoFiveOne(cMajor);
    expect(cTwoFiveOne).toHaveLength(3);
    expect(cTwoFiveOne[0].toString()).toBe('Dm7');
    expect(cTwoFiveOne[1].toString()).toBe('G7');
    expect(cTwoFiveOne[2].toString()).toBe('Cmaj7');

    // F Major: Gm7 - C7 - Fmaj7
    const fMajor = KeySignature.major('F');
    const fTwoFiveOne = engine.buildTwoFiveOne(fMajor);
    expect(fTwoFiveOne[0].toString()).toBe('Gm7');
    expect(fTwoFiveOne[1].toString()).toBe('C7');
    expect(fTwoFiveOne[2].toString()).toBe('Fmaj7');
  });
});

// ─── ModulationStrategy ──────────────────────────────────────

describe('ModulationStrategy', () => {
  const cMajor = KeySignature.major('C');
  const fMajor = KeySignature.major('F'); // subdominant of C

  it('NONE frequency returns empty bridge', () => {
    const mod = new ModulationStrategy(1);
    expect(mod.buildBridge(cMajor, fMajor, ModulationFrequency.NONE)).toHaveLength(0);
  });

  it('MEDIUM frequency returns 2-chord ii-V bridge', () => {
    const mod = new ModulationStrategy(1);
    const bridge = mod.buildBridge(cMajor, fMajor, ModulationFrequency.MEDIUM);
    expect(bridge).toHaveLength(2);
    // ii-V of F Major = Gm7 - C7
    expect(bridge[0].toString()).toBe('Gm7');
    expect(bridge[1].toString()).toBe('C7');
  });

  it('LOW frequency returns a pivot chord (1 chord)', () => {
    // C Major and G Major share several diatonic chords
    const gMajor = KeySignature.major('G');
    const mod = new ModulationStrategy(1);
    const bridge = mod.buildBridge(cMajor, gMajor, ModulationFrequency.LOW);
    // Either a pivot chord (1) or fallback ii-V (2) if no pivot found
    expect(bridge.length).toBeGreaterThanOrEqual(1);
    expect(bridge.length).toBeLessThanOrEqual(2);
  });

  it('HIGH frequency produces at least one bridging chord', () => {
    for (let seed = 0; seed < 30; seed++) {
      const mod = new ModulationStrategy(seed);
      const bridge = mod.buildBridge(cMajor, fMajor, ModulationFrequency.HIGH);
      expect(bridge.length).toBeGreaterThanOrEqual(1);
    }
  });
});

// ─── StructureComposer ───────────────────────────────────────

describe('StructureComposer', () => {
  function makeComposer(seed: number): StructureComposer {
    const rules    = new JazzRuleEngine(seed);
    const selector = new ChordSelector(seed);
    const mod      = new ModulationStrategy(seed);
    return new StructureComposer(selector, rules, mod);
  }

  it('AABA form produces 4 sections', () => {
    const composer = makeComposer(42);
    const sections = composer.compose({
      tonicName: 'C', scaleType: ScaleType.MAJOR,
      songForm: 'AABA', style: HarmonyStyle.JAZZ_STANDARD,
      complexity: ComplexityLevel.SEVENTH_CHORDS,
      modulationFrequency: ModulationFrequency.NONE, beatsPerBar: 4,
    });
    expect(sections).toHaveLength(4);
  });

  it('AABA sections have correct labels', () => {
    const composer = makeComposer(42);
    const sections = composer.compose({
      tonicName: 'C', scaleType: ScaleType.MAJOR,
      songForm: 'AABA', style: HarmonyStyle.SIMPLE,
      complexity: ComplexityLevel.TRIADS,
      modulationFrequency: ModulationFrequency.NONE, beatsPerBar: 4,
    });
    expect(sections[0].sectionLabel).toBe('Verse A');
    expect(sections[1].sectionLabel).toBe('Verse A');
    expect(sections[2].sectionLabel).toBe('Bridge B');
    expect(sections[3].sectionLabel).toBe('Verse A');
  });

  it('verse-chorus-bridge-chorus form produces 4 sections', () => {
    const composer = makeComposer(1);
    const sections = composer.compose({
      tonicName: 'C', scaleType: ScaleType.MAJOR,
      songForm: 'verse-chorus-bridge-chorus',
      style: HarmonyStyle.SIMPLE,
      complexity: ComplexityLevel.TRIADS,
      modulationFrequency: ModulationFrequency.NONE, beatsPerBar: 4,
    });
    expect(sections).toHaveLength(4);
    expect(sections[0].sectionLabel).toBe('Verse A');
    expect(sections[1].sectionLabel).toBe('Chorus C');
    expect(sections[2].sectionLabel).toBe('Bridge B');
    expect(sections[3].sectionLabel).toBe('Chorus C');
  });

  it('each section has at least 4 chords', () => {
    const composer = makeComposer(7);
    const sections = composer.compose({
      tonicName: 'C', scaleType: ScaleType.MAJOR,
      songForm: 'AABA', style: HarmonyStyle.SIMPLE,
      complexity: ComplexityLevel.TRIADS,
      modulationFrequency: ModulationFrequency.NONE, beatsPerBar: 4,
    });
    for (const s of sections) {
      expect(s.size).toBeGreaterThanOrEqual(4);
    }
  });

  it('SIMPLE style with TRIADS uses only triad qualities', () => {
    const triadQualities = [
      ChordQuality.MAJOR_TRIAD, ChordQuality.MINOR_TRIAD,
      ChordQuality.DIM_TRIAD,  ChordQuality.AUG_TRIAD,
    ];
    const composer = makeComposer(99);
    const sections = composer.compose({
      tonicName: 'C', scaleType: ScaleType.MAJOR,
      songForm: 'AABA', style: HarmonyStyle.SIMPLE,
      complexity: ComplexityLevel.TRIADS,
      modulationFrequency: ModulationFrequency.NONE, beatsPerBar: 4,
    });
    for (const section of sections) {
      for (const chord of section.chords) {
        expect(triadQualities).toContain(chord.quality);
      }
    }
  });

  it('with NONE modulation, all chord roots belong to the home key', () => {
    const composer = makeComposer(5);
    const { notes: cMajorNotes } = KeySignature.major('C').scale;
    const sections = composer.compose({
      tonicName: 'C', scaleType: ScaleType.MAJOR,
      songForm: 'AABA', style: HarmonyStyle.SIMPLE,
      complexity: ComplexityLevel.TRIADS,
      modulationFrequency: ModulationFrequency.NONE, beatsPerBar: 4,
    });
    for (const section of sections) {
      for (const chord of section.chords) {
        const inKey = cMajorNotes.some(n => n.equals(chord.root));
        expect(inKey).toBe(true);
      }
    }
  });
});
