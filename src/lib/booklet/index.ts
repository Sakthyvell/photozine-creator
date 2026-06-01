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

