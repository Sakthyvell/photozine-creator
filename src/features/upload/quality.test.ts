import { describe, expect, it } from 'vitest';
import { buildQualityWarnings, findLikelyDuplicate, isLowResolutionForPrint } from './quality';
import type { IntakeAsset } from './intake';

function makeAsset(overrides: Partial<IntakeAsset> = {}): IntakeAsset {
  return {
    id: overrides.id ?? 'asset-1',
    scope: overrides.scope ?? 'body-photo',
    file: new File(['image'], overrides.fileName ?? 'photo.jpg', { type: 'image/jpeg' }),
    fileName: overrides.fileName ?? 'photo.jpg',
    format: overrides.format ?? 'image/jpeg',
    width: overrides.width ?? 2400,
    height: overrides.height ?? 3200,
    fileSizeBytes: overrides.fileSizeBytes ?? 900_000,
    aspectRatio: overrides.aspectRatio ?? 0.75,
    orientation: overrides.orientation ?? 'portrait',
    exifOrientation: overrides.exifOrientation ?? 1,
    previewUrl: overrides.previewUrl ?? 'blob:photo',
    rotationQuarterTurns: overrides.rotationQuarterTurns ?? 0,
  };
}

describe('upload quality heuristics', () => {
  it('warns when a cover falls below the A5 print heuristic', () => {
    const asset = makeAsset({
      id: 'cover-1',
      scope: 'front-cover',
      fileName: 'front-cover.jpg',
      width: 1200,
      height: 1600,
    });

    expect(isLowResolutionForPrint(asset)).toBe(true);
    expect(buildQualityWarnings(asset, [], () => 'warning-1')).toEqual([
      expect.objectContaining({
        code: 'low-resolution',
        assetId: 'cover-1',
        scope: 'front-cover',
      }),
    ]);
  });

  it('does not warn when a body photo clears the body heuristic', () => {
    const asset = makeAsset({
      width: 1600,
      height: 2200,
    });

    expect(isLowResolutionForPrint(asset)).toBe(false);
  });

  it('detects likely duplicates from filename, size, and dimensions', () => {
    const original = makeAsset({
      id: 'asset-1',
      fileName: 'Market Stall.jpg',
      width: 1800,
      height: 2400,
      fileSizeBytes: 700_000,
    });
    const duplicate = makeAsset({
      id: 'asset-2',
      fileName: 'market_stall.jpeg',
      width: 1800,
      height: 2400,
      fileSizeBytes: 700_000,
    });

    expect(findLikelyDuplicate(duplicate, [original])).toEqual({
      asset: original,
      duplicateReason: 'the same filename, file size, and dimensions',
    });
  });
});
