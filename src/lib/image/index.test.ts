import { describe, expect, it } from 'vitest';
import {
  classifyAspectOrientation,
  getRotationQuarterTurns,
  normalizeImageMetrics,
} from './index';

describe('image metadata helpers', () => {
  it('classifies strongly portrait and landscape images from aspect ratio', () => {
    expect(classifyAspectOrientation(0.72)).toBe('portrait');
    expect(classifyAspectOrientation(1.4)).toBe('landscape');
  });

  it('falls back near-square images to square orientation', () => {
    expect(classifyAspectOrientation(0.95)).toBe('square');
    expect(classifyAspectOrientation(1.08)).toBe('square');
  });

  it('maps EXIF orientation into normalized rotation quarter turns', () => {
    expect(getRotationQuarterTurns(1)).toBe(0);
    expect(getRotationQuarterTurns(6)).toBe(1);
    expect(getRotationQuarterTurns(3)).toBe(2);
    expect(getRotationQuarterTurns(8)).toBe(3);
  });

  it('swaps dimensions when EXIF rotation changes the viewing orientation', () => {
    expect(normalizeImageMetrics(1800, 2400, 1)).toEqual({
      width: 1800,
      height: 2400,
      aspectRatio: 0.75,
      orientation: 'portrait',
      rotationQuarterTurns: 0,
    });

    expect(normalizeImageMetrics(1800, 2400, 6)).toEqual({
      width: 2400,
      height: 1800,
      aspectRatio: 2400 / 1800,
      orientation: 'landscape',
      rotationQuarterTurns: 1,
    });
  });
});
