import type { ZinePage } from '../../types';
import { padToMultiple } from '../math';

export function padPageCountToMultipleOfFour(pageCount: number) {
  return padToMultiple(pageCount, 4);
}

export function getBlankPageCount(pageCount: number) {
  return padPageCountToMultipleOfFour(pageCount) - pageCount;
}

export function isBookletPageCountValid(pageCount: number) {
  return pageCount > 0 && pageCount % 4 === 0;
}

export type BookletSheetSide = {
  id: string;
  sheetNumber: number;
  side: 'front' | 'back';
  leftPage: ZinePage;
  rightPage: ZinePage;
};

export type BookletSheet = {
  id: string;
  sheetNumber: number;
  front: BookletSheetSide;
  back: BookletSheetSide;
};

export type BookletImpositionResult = {
  sheets: BookletSheet[];
  totalPages: number;
  totalSheets: number;
};

function createSheetSide(
  sheetNumber: number,
  side: 'front' | 'back',
  leftPage: ZinePage,
  rightPage: ZinePage,
): BookletSheetSide {
  return {
    id: `sheet-${sheetNumber}-${side}`,
    sheetNumber,
    side,
    leftPage,
    rightPage,
  };
}

export function imposeBookletPages(pages: readonly ZinePage[]): BookletImpositionResult {
  if (!isBookletPageCountValid(pages.length)) {
    throw new Error('Booklet imposition requires a positive page count divisible by 4.');
  }

  const pagesByNumber = new Map(pages.map((page) => [page.pageNumber, page]));
  const sheets: BookletSheet[] = [];

  let lowPageNumber = 1;
  let highPageNumber = pages.length;
  let sheetNumber = 1;

  while (lowPageNumber < highPageNumber) {
    const frontLeftPage = pagesByNumber.get(highPageNumber);
    const frontRightPage = pagesByNumber.get(lowPageNumber);

    if (!frontLeftPage || !frontRightPage) {
      throw new Error('Reading-order pages must have consecutive page numbers starting at 1.');
    }

    lowPageNumber += 1;
    highPageNumber -= 1;

    const backLeftPage = pagesByNumber.get(lowPageNumber);
    const backRightPage = pagesByNumber.get(highPageNumber);

    if (!backLeftPage || !backRightPage) {
      throw new Error('Reading-order pages must have consecutive page numbers starting at 1.');
    }

    const front = createSheetSide(sheetNumber, 'front', frontLeftPage, frontRightPage);
    const back = createSheetSide(sheetNumber, 'back', backLeftPage, backRightPage);

    sheets.push({
      id: `sheet-${sheetNumber}`,
      sheetNumber,
      front,
      back,
    });

    lowPageNumber += 1;
    highPageNumber -= 1;
    sheetNumber += 1;
  }

  return {
    sheets,
    totalPages: pages.length,
    totalSheets: sheets.length,
  };
}
