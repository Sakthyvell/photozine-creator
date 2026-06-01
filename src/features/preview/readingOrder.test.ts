import { describe, expect, it } from 'vitest';
import { buildReadingOrderPreview } from './readingOrder';
import type { IntakeAsset } from '../upload';
import type { ZinePage } from '../../types';

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
    previewUrl: overrides.previewUrl ?? `blob:${overrides.fileName ?? 'photo.jpg'}`,
    rotationQuarterTurns: overrides.rotationQuarterTurns ?? 0,
  };
}

function makeBodyPage(pageNumber: number, assetIds: string[]): ZinePage {
  return {
    id: `planned-page-${pageNumber}`,
    pageNumber,
    role: 'body',
    layoutId: assetIds.length > 1 ? 'two-portraits' : 'single-portrait',
    spreadId: null,
    locked: false,
    frames: assetIds.map((assetId, index) => ({
      id: `planned-page-${pageNumber}-frame-${index + 1}`,
      pageId: `planned-page-${pageNumber}`,
      assetId,
      slotIndex: index,
      x: 0.1,
      y: 0.08 + index * 0.4,
      width: 0.8,
      height: 0.34,
      fitMode: 'contain',
      rotationQuarterTurns: 0,
    })),
    sourceAssetIds: assetIds,
    background: 'white',
    plannerNote: null,
  };
}

describe('reading-order preview preparation', () => {
  it('includes front cover, auto-padding blanks, and a fallback blank back cover', () => {
    const frontCover = makeAsset({
      id: 'front-cover',
      scope: 'front-cover',
      fileName: 'front-cover.jpg',
    });
    const bodyPhoto = makeAsset({
      id: 'body-1',
      fileName: 'body-1.jpg',
    });

    const result = buildReadingOrderPreview({
      frontCover,
      backCover: null,
      bodyPhotos: [bodyPhoto],
      plannedBodyPages: [makeBodyPage(1, ['body-1'])],
    });

    expect(result.totalPages).toBe(4);
    expect(result.blankPageCount).toBe(1);
    expect(result.pages.map((page) => page.role)).toEqual([
      'front-cover',
      'body',
      'blank',
      'back-cover',
    ]);
    expect(result.pages[3]?.layoutId).toBe('blank');
  });

  it('keeps the uploaded back cover as the final page and renumbers body pages sequentially', () => {
    const frontCover = makeAsset({
      id: 'front-cover',
      scope: 'front-cover',
      fileName: 'front-cover.jpg',
    });
    const backCover = makeAsset({
      id: 'back-cover',
      scope: 'back-cover',
      fileName: 'back-cover.jpg',
    });
    const bodyPhotoA = makeAsset({ id: 'body-1', fileName: 'body-1.jpg' });
    const bodyPhotoB = makeAsset({ id: 'body-2', fileName: 'body-2.jpg' });

    const result = buildReadingOrderPreview({
      frontCover,
      backCover,
      bodyPhotos: [bodyPhotoA, bodyPhotoB],
      plannedBodyPages: [makeBodyPage(1, ['body-1']), makeBodyPage(2, ['body-2'])],
    });

    expect(result.pages.map((page) => page.pageNumber)).toEqual([1, 2, 3, 4]);
    expect(result.pages[3]?.role).toBe('back-cover');
    expect(result.pages[3]?.layoutId).toBe('cover-full');
    expect(result.pages[3]?.sourceAssetIds).toEqual(['back-cover']);
  });
});
