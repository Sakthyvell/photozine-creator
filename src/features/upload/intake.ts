import type {
  PhotoWarning,
  WarningScope,
} from '../../types';

export const supportedImageMimeTypes = new Set(['image/jpeg', 'image/png']);
export const supportedImageExtensions = new Set(['jpg', 'jpeg', 'png']);

export type UploadTarget = WarningScope;

export type IntakeAsset = {
  id: string;
  scope: UploadTarget;
  file: File;
  fileName: string;
  fileSizeBytes: number;
};

const scopeLabels: Record<UploadTarget, string> = {
  'front-cover': 'Front cover',
  'back-cover': 'Back cover',
  'body-photo': 'Body photos',
  planner: 'Planner',
  export: 'Export',
  session: 'Session',
};

function isSupportedExtension(fileName: string) {
  const extension = fileName.split('.').pop()?.toLowerCase();
  return extension ? supportedImageExtensions.has(extension) : false;
}

export function isSupportedImageFile(file: File) {
  return supportedImageMimeTypes.has(file.type) || isSupportedExtension(file.name);
}

export function getScopeLabel(scope: UploadTarget) {
  return scopeLabels[scope];
}

function createUnsupportedWarning(
  file: File,
  scope: UploadTarget,
  nextWarningId: () => string,
): PhotoWarning {
  return {
    id: nextWarningId(),
    code: 'unsupported-file-type',
    severity: 'warning',
    scope,
    message: `${file.name} was skipped from ${getScopeLabel(scope)}. Only JPG, JPEG, and PNG files are allowed.`,
    assetId: null,
  };
}

export function partitionSupportedFiles(
  files: readonly File[],
  scope: UploadTarget,
  nextWarningId: () => string,
) {
  const acceptedFiles: File[] = [];
  const warnings: PhotoWarning[] = [];

  for (const file of files) {
    if (isSupportedImageFile(file)) {
      acceptedFiles.push(file);
    } else {
      warnings.push(createUnsupportedWarning(file, scope, nextWarningId));
    }
  }

  return { acceptedFiles, warnings };
}

export function createIntakeAsset(
  file: File,
  scope: UploadTarget,
  nextAssetId: () => string,
): IntakeAsset {
  return {
    id: nextAssetId(),
    scope,
    file,
    fileName: file.name,
    fileSizeBytes: file.size,
  };
}
