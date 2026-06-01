import { describe, expect, it } from 'vitest';
import {
  appSessionStateSchema,
  bodyPhotoSchema,
  coverAssetSchema,
  exportSettingsSchema,
  overrideStateSchema,
  pageFrameSchema,
  photoWarningSchema,
  zinePageSchema,
  zineSpreadSchema,
} from './contracts';
import {
  sampleAppSessionState,
  sampleBackCover,
  sampleBodyPhotos,
  sampleExportSettings,
  sampleFrontCover,
  sampleOverrideState,
  samplePageFrames,
  samplePages,
  samplePhotoWarning,
  sampleSpread,
} from '../fixtures/sample-data';

describe('core contract fixtures', () => {
  it('validates the standalone fixtures for each major type', () => {
    expect(() => photoWarningSchema.parse(samplePhotoWarning)).not.toThrow();
    expect(() => coverAssetSchema.parse(sampleFrontCover)).not.toThrow();
    expect(() => coverAssetSchema.parse(sampleBackCover)).not.toThrow();
    expect(() => bodyPhotoSchema.parse(sampleBodyPhotos[0])).not.toThrow();
    expect(() => pageFrameSchema.parse(samplePageFrames[0])).not.toThrow();
    expect(() => zinePageSchema.parse(samplePages[0])).not.toThrow();
    expect(() => zineSpreadSchema.parse(sampleSpread)).not.toThrow();
    expect(() => overrideStateSchema.parse(sampleOverrideState)).not.toThrow();
    expect(() => exportSettingsSchema.parse(sampleExportSettings)).not.toThrow();
  });

  it('validates the assembled app session fixture', () => {
    expect(() => appSessionStateSchema.parse(sampleAppSessionState)).not.toThrow();
  });
});

