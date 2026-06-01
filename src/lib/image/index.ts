import exifr from 'exifr';
import type { Orientation, QuarterTurn, SupportedImageFormat } from '../../types';

export const supportedImageMimeTypes = ['image/jpeg', 'image/png'] as const;

const squareAspectTolerance = 0.1;

const exifOrientationQuarterTurns: Record<number, QuarterTurn> = {
  1: 0,
  2: 0,
  3: 2,
  4: 2,
  5: 1,
  6: 1,
  7: 3,
  8: 3,
};

export type NormalizedImageMetrics = {
  width: number;
  height: number;
  aspectRatio: number;
  orientation: Orientation;
  rotationQuarterTurns: QuarterTurn;
};

export type ExtractedImageMetadata = NormalizedImageMetrics & {
  exifOrientation: number | null;
  format: SupportedImageFormat;
  previewUrl: string;
};

export function classifyAspectOrientation(aspectRatio: number): Orientation {
  if (aspectRatio > 1 + squareAspectTolerance) {
    return 'landscape';
  }

  if (aspectRatio < 1 - squareAspectTolerance) {
    return 'portrait';
  }

  return 'square';
}

export function getRotationQuarterTurns(exifOrientation: number | null | undefined): QuarterTurn {
  if (!exifOrientation) {
    return 0;
  }

  return exifOrientationQuarterTurns[exifOrientation] ?? 0;
}

export function normalizeImageMetrics(
  rawWidth: number,
  rawHeight: number,
  exifOrientation: number | null | undefined,
): NormalizedImageMetrics {
  const rotationQuarterTurns = getRotationQuarterTurns(exifOrientation);
  const dimensionSwapped = rotationQuarterTurns === 1 || rotationQuarterTurns === 3;
  const width = dimensionSwapped ? rawHeight : rawWidth;
  const height = dimensionSwapped ? rawWidth : rawHeight;
  const aspectRatio = width / height;

  return {
    width,
    height,
    aspectRatio,
    orientation: classifyAspectOrientation(aspectRatio),
    rotationQuarterTurns,
  };
}

function revokeObjectUrl(previewUrl: string) {
  URL.revokeObjectURL(previewUrl);
}

async function loadImageDimensions(previewUrl: string) {
  return new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => {
      reject(new Error('Failed to load image dimensions.'));
    };
    image.src = previewUrl;
  });
}

export async function extractImageMetadata(file: File): Promise<ExtractedImageMetadata> {
  const previewUrl = URL.createObjectURL(file);

  try {
    const [{ width: rawWidth, height: rawHeight }, exifOrientation] = await Promise.all([
      loadImageDimensions(previewUrl),
      exifr.orientation(file).catch(() => undefined),
    ]);

    const normalized = normalizeImageMetrics(rawWidth, rawHeight, exifOrientation ?? null);

    return {
      ...normalized,
      exifOrientation: exifOrientation ?? null,
      format: file.type as SupportedImageFormat,
      previewUrl,
    };
  } catch (error) {
    revokeObjectUrl(previewUrl);
    throw error;
  }
}
