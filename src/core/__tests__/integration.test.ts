import { describe, it, expect } from 'vitest';
import { HarmonyGeneratorService } from '../engine/harmony-generator';
import { Note } from '../model/note';
import { Scale } from '../model/scale';
import { ScaleType } from '../model/scale-type';
import { ChordQuality } from '../model/chord-quality';
import {
  HarmonyStyle, ComplexityLevel, ModulationFrequency, createRequest,
} from '../types';

// ─── HarmonyGeneratorService — Integration ───────────────────

describe('HarmonyGeneratorService', () => {

  describe('determinism', () => {
    it('same seed → identical output', () => {
      const req  = createRequest();
      const out1 = HarmonyGeneratorService.withSeed(42).generate(req).map(p => p.toString());
      const out2 = HarmonyGeneratorService.withSeed(42).generate(req).map(p => p.toString());
      expect(out1).toEqual(out2);
    });

    it('different seeds → (usually) different output', () => {
      const req  = createRequest({ modulationFrequency: ModulationFrequency.NONE });
      const out1 = HarmonyGeneratorService.withSeed(1).generate(req).map(p => p.toString()).join('');
      const out2 = HarmonyGeneratorService.withSeed(999999).generate(req).map(p => p.toString()).join('');
      expect(out1).not.toEqual(out2);
    });
  });

  describe('output structure', () => {
    it('AABA produces exactly 4 sections', () => {
      const progressions = HarmonyGeneratorService.withSeed(1).generate(createRequest({ songForm: 'AABA' }));
      expect(progressions).toHaveLength(4);
    });

    it('ABAC produces exactly 4 sections', () => {
      const progressions = HarmonyGeneratorService.withSeed(1).generate(createRequest({ songForm: 'ABAC' }));
      expect(progressions).toHaveLength(4);
    });

    it('custom 6-section form produces 6 sections', () => {
      const progressions = HarmonyGeneratorService.withSeed(1).generate(
        createRequest({ songForm: 'AABABC' }),
      );
      expect(progressions).toHaveLength(6);
    });

    it('every section has at least one chord', () => {
      const progressions = HarmonyGeneratorService.withSeed(7).generate(createRequest());
      for (const p of progressions) {
        expect(p.size).toBeGreaterThan(0);
      }
    });

    it('every chord has a valid root pitch class (0-11)', () => {
      const progressions = HarmonyGeneratorService.withSeed(13).generate(createRequest());
      for (const p of progressions) {
        for (const chord of p.chords) {
          expect(chord.root.value).toBeGreaterThanOrEqual(0);
          expect(chord.root.value).toBeLessThanOrEqual(11);
        }
      }
    });
  });

  describe('SIMPLE style — diatonic correctness', () => {
    it('all chord roots belong to the home key scale', () => {
      const req  = createRequest({
        tonicName:           'C',
        scaleType:           ScaleType.MAJOR,
        style:               HarmonyStyle.SIMPLE,
        complexity:          ComplexityLevel.TRIADS,
        modulationFrequency: ModulationFrequency.NONE,
      });
      const cMajorNotes = Scale.of(Note.fromName('C'), ScaleType.MAJOR).notes;
      const progressions = HarmonyGeneratorService.withSeed(42).generate(req);

      for (const section of progressions) {
        for (const chord of section.chords) {
          const inKey = cMajorNotes.some(n => n.equals(chord.root));
          expect(inKey).toBe(true);
        }
      }
    });

    it('all chords are triads when TRIADS complexity is selected', () => {
      const req  = createRequest({
        style:               HarmonyStyle.SIMPLE,
        complexity:          ComplexityLevel.TRIADS,
        modulationFrequency: ModulationFrequency.NONE,
      });
      const triadSet = new Set([
        ChordQuality.MAJOR_TRIAD, ChordQuality.MINOR_TRIAD,
        ChordQuality.DIM_TRIAD,  ChordQuality.AUG_TRIAD,
      ]);
      const progressions = HarmonyGeneratorService.withSeed(5).generate(req);
      for (const section of progressions) {
        for (const chord of section.chords) {
          expect(triadSet.has(chord.quality)).toBe(true);
        }
      }
    });
  });

  describe('JAZZ_STANDARD style', () => {
    it('generates only seventh chords or extensions when SEVENTH_CHORDS requested', () => {
      const req = createRequest({
        style:               HarmonyStyle.JAZZ_STANDARD,
        complexity:          ComplexityLevel.SEVENTH_CHORDS,
        modulationFrequency: ModulationFrequency.NONE,
      });
      const triadSet = new Set([ChordQuality.MAJOR_TRIAD, ChordQuality.MINOR_TRIAD, ChordQuality.DIM_TRIAD]);
      const progressions = HarmonyGeneratorService.withSeed(100).generate(req);
      for (const section of progressions) {
        for (const chord of section.chords) {
          expect(triadSet.has(chord.quality)).toBe(false);
        }
      }
    });

    it('section labels are non-empty', () => {
      const progressions = HarmonyGeneratorService.withSeed(1).generate(createRequest());
      for (const p of progressions) {
        expect(p.sectionLabel.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('key centre — multiple tonics', () => {
    const tonics = ['C','D','E','F','G','A','B','C#','F#','Bb'];

    it('generates without throwing for all common tonic names', () => {
      for (const tonic of tonics) {
        expect(() => {
          HarmonyGeneratorService.withSeed(1).generate(
            createRequest({ tonicName: tonic }),
          );
        }).not.toThrow();
      }
    });

    it('I chord root matches the tonic for all keys (SIMPLE, no modulation)', () => {
      for (const tonic of tonics) {
        const req = createRequest({
          tonicName:           tonic,
          scaleType:           ScaleType.MAJOR,
          style:               HarmonyStyle.SIMPLE,
          complexity:          ComplexityLevel.SEVENTH_CHORDS,
          modulationFrequency: ModulationFrequency.NONE,
        });
        const progressions = HarmonyGeneratorService.withSeed(1).generate(req);
        const expectedRoot = Note.fromName(tonic).value;
        // At least one section must start with the tonic chord
        const firstSection = progressions[0];
        const hasTonicChord = firstSection.chords.some(c => c.root.value === expectedRoot);
        expect(hasTonicChord).toBe(true);
      }
    });
  });

  describe('all scale types', () => {
    it('generates without throwing for all 15 supported scales', () => {
      for (const scaleType of ScaleType.ALL) {
        expect(() => {
          HarmonyGeneratorService.withSeed(1).generate(
            createRequest({ scaleType }),
          );
        }).not.toThrow();
      }
    });
  });

  describe('JAZZ_MODERN style', () => {
    it('may introduce non-diatonic roots (tritone subs, altered dominants)', () => {
      const req = createRequest({
        tonicName:           'C',
        scaleType:           ScaleType.MAJOR,
        style:               HarmonyStyle.JAZZ_MODERN,
        complexity:          ComplexityLevel.FULL_EXTENSIONS,
        modulationFrequency: ModulationFrequency.MEDIUM,
      });
      const cMajorNotes = Scale.of(Note.fromName('C'), ScaleType.MAJOR).notes;

      let foundNonDiatonic = false;
      for (let seed = 0; seed < 50; seed++) {
        const progressions = HarmonyGeneratorService.withSeed(seed).generate(req);
        for (const section of progressions) {
          for (const chord of section.chords) {
            if (!cMajorNotes.some(n => n.equals(chord.root))) {
              foundNonDiatonic = true;
            }
          }
        }
        if (foundNonDiatonic) break;
      }
      expect(foundNonDiatonic).toBe(true);
    });
  });

  describe('modulation', () => {
    it('HIGH modulation may produce chord roots outside the home key', () => {
      const req = createRequest({
        tonicName:           'C',
        scaleType:           ScaleType.MAJOR,
        style:               HarmonyStyle.JAZZ_STANDARD,
        complexity:          ComplexityLevel.SEVENTH_CHORDS,
        modulationFrequency: ModulationFrequency.HIGH,
      });
      const cMajorNotes = Scale.of(Note.fromName('C'), ScaleType.MAJOR).notes;

      let foundForeignChord = false;
      for (let seed = 0; seed < 50; seed++) {
        const progressions = HarmonyGeneratorService.withSeed(seed).generate(req);
        for (const section of progressions) {
          for (const chord of section.chords) {
            if (!cMajorNotes.some(n => n.equals(chord.root))) {
              foundForeignChord = true;
            }
          }
        }
        if (foundForeignChord) break;
      }
      expect(foundForeignChord).toBe(true);
    });
  });

  describe('toString output format', () => {
    it('produces parseable lead-sheet text', () => {
      const progressions = HarmonyGeneratorService.withSeed(42).generate(
        createRequest({ style: HarmonyStyle.SIMPLE, modulationFrequency: ModulationFrequency.NONE }),
      );
      for (const p of progressions) {
        const text = p.toString();
        // Each non-label line should start and end with '|'
        const lines = text.split('\n');
        const chordLine = lines.find(l => l.includes('|'));
        expect(chordLine).toBeTruthy();
        expect(chordLine!.trimStart().startsWith('|')).toBe(true);
        expect(chordLine!.trimEnd().endsWith('|')).toBe(true);
      }
    });
  });
});
