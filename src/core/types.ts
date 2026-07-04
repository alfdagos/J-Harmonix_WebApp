import { ScaleType } from './model/scale-type';

export const HarmonyStyle = {
  SIMPLE:        'SIMPLE',
  POP:           'POP',
  JAZZ_STANDARD: 'JAZZ_STANDARD',
  JAZZ_MODERN:   'JAZZ_MODERN',
} as const;
export type HarmonyStyle = (typeof HarmonyStyle)[keyof typeof HarmonyStyle];

export const ComplexityLevel = {
  TRIADS:          'TRIADS',
  SEVENTH_CHORDS:  'SEVENTH_CHORDS',
  NINTHS:          'NINTHS',
  FULL_EXTENSIONS: 'FULL_EXTENSIONS',
} as const;
export type ComplexityLevel = (typeof ComplexityLevel)[keyof typeof ComplexityLevel];

export const ModulationFrequency = {
  NONE:   'NONE',
  LOW:    'LOW',
  MEDIUM: 'MEDIUM',
  HIGH:   'HIGH',
} as const;
export type ModulationFrequency = (typeof ModulationFrequency)[keyof typeof ModulationFrequency];

export const HarmonicFunction = {
  TONIC:       'TONIC',
  SUBDOMINANT: 'SUBDOMINANT',
  DOMINANT:    'DOMINANT',
} as const;
export type HarmonicFunction = (typeof HarmonicFunction)[keyof typeof HarmonicFunction];

export interface ProgressionRequest {
  tonicName:           string;
  scaleType:           ScaleType;
  songForm:            string;
  style:               HarmonyStyle;
  complexity:          ComplexityLevel;
  modulationFrequency: ModulationFrequency;
  beatsPerBar:         number;
}

export function createRequest(params: Partial<ProgressionRequest> = {}): ProgressionRequest {
  return {
    tonicName:           'C',
    scaleType:           ScaleType.MAJOR,
    songForm:            'AABA',
    style:               HarmonyStyle.JAZZ_STANDARD,
    complexity:          ComplexityLevel.SEVENTH_CHORDS,
    modulationFrequency: ModulationFrequency.MEDIUM,
    beatsPerBar:         4,
    ...params,
  };
}
