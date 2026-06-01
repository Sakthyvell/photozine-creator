import type { PhotoWarning } from '../../types';
import type { IntakeAsset } from './intake';

const qualityThresholds = {
  'front-cover': {
    shortEdgePx: 1748,
    longEdgePx: 2480,
    label: 'full A5 page at 300 DPI',
  },
  'back-cover': {
    shortEdgePx: 1748,
    longEdgePx: 2480,
    label: 'full A5 page at 300 DPI',
  },
  'body-photo': {
    shortEdgePx: 1200,
    longEdgePx: 1600,
    label: 'most single-page placements',
  },
} as const;

function normalizeFileName(fileName: string) {
  return fileName
    .replace(/\.[^.]+$/, '')
    .trim()
    .toLowerCase()
    .replace(/[_\-\s]+/g, ' ');
}

function sortEdges(asset: IntakeAsset) {
  return {
    shortEdgePx: Math.min(asset.width, asset.height),
    longEdgePx: Math.max(asset.width, asset.height),
  };
}

function describeDuplicateMatch(candidate: IntakeAsset, existingAsset: IntakeAsset) {
  const sameDimensions =
    candidate.width === existingAsset.width && candidate.height === existingAsset.height;
  const sameFileSize = candidate.fileSizeBytes === existingAsset.fileSizeBytes;
  const sameBaseName =
    normalizeFileName(candidate.fileName) === normalizeFileName(existingAsset.fileName);

  if (sameBaseName && sameFileSize && sameDimensions) {
    return 'the same filename, file size, and dimensions';
  }

  if (sameFileSize && sameDimensions) {
    return 'the same file size and dimensions';
  }

  if (sameBaseName && sameDimensions) {
    return 'a matching filename and dimensions';
  }

  return null;
}

export function isLowResolutionForPrint(asset: IntakeAsset) {
  const threshold = qualityThresholds[asset.scope];

  if (!threshold) {
    return false;
  }

  const { shortEdgePx, longEdgePx } = sortEdges(asset);

  return shortEdgePx < threshold.shortEdgePx || longEdgePx < threshold.longEdgePx;
}

export function findLikelyDuplicate(candidate: IntakeAsset, existingAssets: IntakeAsset[]) {
  for (const existingAsset of existingAssets) {
    const duplicateReason = describeDuplicateMatch(candidate, existingAsset);

    if (duplicateReason) {
      return {
        asset: existingAsset,
        duplicateReason,
      };
    }
  }

  return null;
}

export function buildQualityWarnings(
  asset: IntakeAsset,
  existingAssets: IntakeAsset[],
  nextWarningId: () => string,
) {
  const warnings: PhotoWarning[] = [];
  const threshold = qualityThresholds[asset.scope];

  if (threshold && isLowResolutionForPrint(asset)) {
    warnings.push({
      id: nextWarningId(),
      code: 'low-resolution',
      severity: 'warning',
      scope: asset.scope,
      assetId: asset.id,
      message: `${asset.fileName} may print softly. This ${asset.scope.replace('-', ' ')} is below the ${threshold.label} heuristic of ${threshold.shortEdgePx} x ${threshold.longEdgePx}px.`,
    });
  }

  const duplicateMatch = findLikelyDuplicate(asset, existingAssets);
  if (duplicateMatch) {
    warnings.push({
      id: nextWarningId(),
      code: 'possible-duplicate',
      severity: 'info',
      scope: asset.scope,
      assetId: asset.id,
      message: `${asset.fileName} looks like a duplicate of ${duplicateMatch.asset.fileName} based on ${duplicateMatch.duplicateReason}.`,
    });
  }

  return warnings;
}
