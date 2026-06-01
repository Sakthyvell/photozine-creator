import { describe, expect, it } from 'vitest';
import { imposeBookletPages } from './index';
import type { ZinePage } from '../../types';

function makePage(pageNumber: number): ZinePage {
  return {
    id: `page-${pageNumber}`,
    pageNumber,
    role: pageNumber === 1 ? 'front-cover' : pageNumber === 8 ? 'back-cover' : 'body',
    layoutId: pageNumber === 1 || pageNumber === 8 ? 'cover-full' : 'single-portrait',
    spreadId: null,
    locked: false,
    frames: [],
    sourceAssetIds: [],
    background: 'white',
    plannerNote: null,
  };
}

function pageRange(count: number) {
  return Array.from({ length: count }, (_, index) => makePage(index + 1));
}

describe('booklet imposition', () => {
  it('imposes a 4-page booklet in printer order', () => {
    const result = imposeBookletPages(pageRange(4));

    expect(result.totalSheets).toBe(1);
    expect(result.sheets[0]?.front.leftPage.pageNumber).toBe(4);
    expect(result.sheets[0]?.front.rightPage.pageNumber).toBe(1);
    expect(result.sheets[0]?.back.leftPage.pageNumber).toBe(2);
    expect(result.sheets[0]?.back.rightPage.pageNumber).toBe(3);
  });

  it('imposes an 8-page booklet in printer order', () => {
    const result = imposeBookletPages(pageRange(8));

    expect(result.totalSheets).toBe(2);
    expect(result.sheets.map((sheet) => ({
      front: [sheet.front.leftPage.pageNumber, sheet.front.rightPage.pageNumber],
      back: [sheet.back.leftPage.pageNumber, sheet.back.rightPage.pageNumber],
    }))).toEqual([
      { front: [8, 1], back: [2, 7] },
      { front: [6, 3], back: [4, 5] },
    ]);
  });

  it('imposes a 12-page booklet and keeps covers at the outer positions', () => {
    const result = imposeBookletPages(pageRange(12));

    expect(result.totalSheets).toBe(3);
    expect(result.sheets[0]?.front.leftPage.pageNumber).toBe(12);
    expect(result.sheets[0]?.front.rightPage.pageNumber).toBe(1);
    expect(result.sheets[2]?.back.leftPage.pageNumber).toBe(6);
    expect(result.sheets[2]?.back.rightPage.pageNumber).toBe(7);
  });

  it('rejects page counts that are not divisible by 4', () => {
    expect(() => imposeBookletPages(pageRange(6))).toThrow(/divisible by 4/i);
  });
});
