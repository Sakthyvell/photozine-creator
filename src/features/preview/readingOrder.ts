import type { ZinePage } from '../../types';
import type { IntakeAsset } from '../upload';
import { getBlankPageCount } from '../../lib/booklet';

export type PreviewAsset = Pick<
  IntakeAsset,
  'id' | 'fileName' | 'previewUrl' | 'rotationQuarterTurns'
>;

export type ReadingOrderPreviewResult = {
  pages: ZinePage[];
  assetMap: Record<string, PreviewAsset>;
  blankPageCount: number;
  totalPages: number;
};

type ReadingOrderPreviewInput = {
  frontCover: IntakeAsset | null;
  backCover: IntakeAsset | null;
  bodyPhotos: readonly IntakeAsset[];
  plannedBodyPages: readonly ZinePage[];
};

const coverFrameTemplate = {
  slotIndex: 0,
  x: 0.08,
  y: 0.06,
  width: 0.84,
  height: 0.88,
  fitMode: 'contain' as const,
};

function buildPreviewAssetMap(
  frontCover: IntakeAsset | null,
  backCover: IntakeAsset | null,
  bodyPhotos: readonly IntakeAsset[],
) {
  const assets = [frontCover, backCover, ...bodyPhotos].filter(
    (asset): asset is IntakeAsset => asset !== null,
  );

  return Object.fromEntries(
    assets.map((asset) => [
      asset.id,
      {
        id: asset.id,
        fileName: asset.fileName,
        previewUrl: asset.previewUrl,
        rotationQuarterTurns: asset.rotationQuarterTurns,
      },
    ]),
  );
}

function createCoverPage(
  pageId: string,
  pageNumber: number,
  role: 'front-cover' | 'back-cover',
  asset: IntakeAsset | null,
): ZinePage {
  if (!asset) {
    return {
      id: pageId,
      pageNumber,
      role,
      layoutId: 'blank',
      spreadId: null,
      locked: true,
      frames: [],
      sourceAssetIds: [],
      background: 'white',
      plannerNote:
        role === 'back-cover'
          ? 'Back cover falls back to a blank white page when no cover asset is supplied.'
          : null,
    };
  }

  return {
    id: pageId,
    pageNumber,
    role,
    layoutId: 'cover-full',
    spreadId: null,
    locked: true,
    frames: [
      {
        id: `${pageId}-frame-1`,
        pageId,
        assetId: asset.id,
        rotationQuarterTurns: asset.rotationQuarterTurns,
        ...coverFrameTemplate,
      },
    ],
    sourceAssetIds: [asset.id],
    background: 'white',
    plannerNote:
      role === 'front-cover'
        ? 'Front cover anchors the reading order.'
        : 'Back cover uses the uploaded cover asset.',
  };
}

function createAutoBlankPage(pageId: string, pageNumber: number): ZinePage {
  return {
    id: pageId,
    pageNumber,
    role: 'blank',
    layoutId: 'blank',
    spreadId: null,
    locked: true,
    frames: [],
    sourceAssetIds: [],
    background: 'white',
    plannerNote: 'Blank page inserted automatically to keep the booklet page count divisible by 4.',
  };
}

function renumberBodyPage(page: ZinePage, pageNumber: number): ZinePage {
  const pageId = `reading-page-${pageNumber}`;

  return {
    ...page,
    id: pageId,
    pageNumber,
    frames: page.frames.map((frame, index) => ({
      ...frame,
      id: `${pageId}-frame-${index + 1}`,
      pageId,
    })),
  };
}

export function buildReadingOrderPreview({
  frontCover,
  backCover,
  bodyPhotos,
  plannedBodyPages,
}: ReadingOrderPreviewInput): ReadingOrderPreviewResult {
  const pages: ZinePage[] = [];
  const assetMap = buildPreviewAssetMap(frontCover, backCover, bodyPhotos);

  if (frontCover) {
    pages.push(createCoverPage('reading-page-1', 1, 'front-cover', frontCover));
  }

  const bodyPageStart = pages.length + 1;
  plannedBodyPages.forEach((page, index) => {
    const pageNumber = bodyPageStart + index;
    pages.push(renumberBodyPage(page, pageNumber));
  });

  const totalWithoutPadding = pages.length + 1;
  const blankPageCount = getBlankPageCount(totalWithoutPadding);

  for (let index = 0; index < blankPageCount; index += 1) {
    const pageNumber = pages.length + 1;
    pages.push(createAutoBlankPage(`reading-page-${pageNumber}`, pageNumber));
  }

  pages.push(
    createCoverPage(`reading-page-${pages.length + 1}`, pages.length + 1, 'back-cover', backCover),
  );

  return {
    pages,
    assetMap,
    blankPageCount,
    totalPages: pages.length,
  };
}
