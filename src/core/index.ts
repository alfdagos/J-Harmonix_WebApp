// Model
export { Note } from './model/note';
export { Interval } from './model/interval';
export { ChordQuality } from './model/chord-quality';
export { ScaleType } from './model/scale-type';
export { Chord } from './model/chord';
export { Scale } from './model/scale';
export { KeySignature } from './model/key-signature';
export { Progression, ProgressionBuilder } from './model/progression';

// Types
export {
  HarmonyStyle,
  ComplexityLevel,
  ModulationFrequency,
  HarmonicFunction,
  createRequest,
} from './types';
export type { ProgressionRequest } from './types';

// Engine entry point
export { HarmonyGeneratorService } from './engine/harmony-generator';
