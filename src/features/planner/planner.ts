import type { BodyLayoutId, PageFrame, PlanningMode, QuarterTurn, ZinePage } from '../../types';

export type PlannerPhoto = {
  id: string;
  fileName: string;
  orientation: 'portrait' | 'landscape' | 'square';
  rotationQuarterTurns: QuarterTurn;
  sourceOrder?: number;
  included?: boolean;
};

type FrameTemplate = Omit<PageFrame, 'id' | 'pageId' | 'assetId' | 'rotationQuarterTurns'>;

export type MinimalPlannerResult = {
  pages: ZinePage[];
  layoutCounts: Record<BodyLayoutId, number>;
  photoCount: number;
};

const plannerLayoutConfigs: Record<BodyLayoutId, { frameTemplates: FrameTemplate[] }> = {
  'single-portrait': {
    frameTemplates: [
      {
        slotIndex: 0,
        x: 0.1,
        y: 0.08,
        width: 0.8,
        height: 0.84,
        fitMode: 'contain',
      },
    ],
  },
  'two-portraits': {
    frameTemplates: [
      {
        slotIndex: 0,
        x: 0.08,
        y: 0.1,
        width: 0.38,
        height: 0.78,
        fitMode: 'contain',
      },
      {
        slotIndex: 1,
        x: 0.54,
        y: 0.1,
        width: 0.38,
        height: 0.78,
        fitMode: 'contain',
      },
    ],
  },
  'two-landscapes': {
    frameTemplates: [
      {
        slotIndex: 0,
        x: 0.08,
        y: 0.08,
        width: 0.84,
        height: 0.36,
        fitMode: 'contain',
      },
      {
        slotIndex: 1,
        x: 0.08,
        y: 0.56,
        width: 0.84,
        height: 0.36,
        fitMode: 'contain',
      },
    ],
  },
  'landscape-spread': {
    frameTemplates: [
      {
        slotIndex: 0,
        x: 0.04,
        y: 0.12,
        width: 0.92,
        height: 0.76,
        fitMode: 'contain',
      },
    ],
  },
};

function buildPlannerNote(layoutId: BodyLayoutId, photoNames: string[]) {
  if (layoutId === 'two-portraits') {
    return `${photoNames[0]} and ${photoNames[1]} were paired to keep two portrait photos together on one page.`;
  }

  if (layoutId === 'two-landscapes') {
    return `${photoNames[0]} and ${photoNames[1]} were paired to keep two landscape photos together on one page.`;
  }

  return `${photoNames[0]} was given a full single-image page for a larger presentation.`;
}

function createFrames(pageId: string, assetIds: string[], rotations: QuarterTurn[], layoutId: BodyLayoutId) {
  const layout = plannerLayoutConfigs[layoutId];

  return layout.frameTemplates.slice(0, assetIds.length).map((template, index) => ({
    ...template,
    id: `${pageId}-frame-${index + 1}`,
    pageId,
    assetId: assetIds[index] ?? null,
    rotationQuarterTurns: rotations[index] ?? 0,
  }));
}

function createPlannerPage(
  pageNumber: number,
  layoutId: BodyLayoutId,
  photos: PlannerPhoto[],
): ZinePage {
  const pageId = `planned-page-${pageNumber}`;
  const assetIds = photos.map((photo) => photo.id);
  const rotations = photos.map((photo) => photo.rotationQuarterTurns);

  return {
    id: pageId,
    pageNumber,
    role: 'body',
    layoutId,
    spreadId: null,
    locked: false,
    frames: createFrames(pageId, assetIds, rotations, layoutId),
    sourceAssetIds: assetIds,
    background: 'white',
    plannerNote: buildPlannerNote(
      layoutId,
      photos.map((photo) => photo.fileName),
    ),
  };
}

function sortIncludedPhotos(photos: readonly PlannerPhoto[]) {
  return [...photos]
    .filter((photo) => photo.included !== false)
    .sort(
      (left, right) => (left.sourceOrder ?? Number.MAX_SAFE_INTEGER) - (right.sourceOrder ?? Number.MAX_SAFE_INTEGER),
    );
}

function shouldPairPortraits(mode: PlanningMode) {
  return mode === 'favor-fewer-pages';
}

export function createMinimalPlan(
  photos: readonly PlannerPhoto[],
  planningMode: PlanningMode,
): MinimalPlannerResult {
  const sortedPhotos = sortIncludedPhotos(photos);
  const pages: ZinePage[] = [];
  const layoutCounts: Record<BodyLayoutId, number> = {
    'single-portrait': 0,
    'two-portraits': 0,
    'two-landscapes': 0,
    'landscape-spread': 0,
  };

  let pageNumber = 1;
  let index = 0;

  while (index < sortedPhotos.length) {
    const currentPhoto = sortedPhotos[index];
    const nextPhoto = sortedPhotos[index + 1];

    if (
      currentPhoto.orientation === 'landscape' &&
      nextPhoto?.orientation === 'landscape'
    ) {
      pages.push(createPlannerPage(pageNumber, 'two-landscapes', [currentPhoto, nextPhoto]));
      layoutCounts['two-landscapes'] += 1;
      pageNumber += 1;
      index += 2;
      continue;
    }

    if (
      currentPhoto.orientation !== 'landscape' &&
      nextPhoto &&
      nextPhoto.orientation !== 'landscape' &&
      shouldPairPortraits(planningMode)
    ) {
      pages.push(createPlannerPage(pageNumber, 'two-portraits', [currentPhoto, nextPhoto]));
      layoutCounts['two-portraits'] += 1;
      pageNumber += 1;
      index += 2;
      continue;
    }

    pages.push(createPlannerPage(pageNumber, 'single-portrait', [currentPhoto]));
    layoutCounts['single-portrait'] += 1;
    pageNumber += 1;
    index += 1;
  }

  return {
    pages,
    layoutCounts,
    photoCount: sortedPhotos.length,
  };
}
