export const supportedImageMimeTypes = ['image/jpeg', 'image/png'] as const;

export function isSupportedImageMimeType(value: string): value is (typeof supportedImageMimeTypes)[number] {
  return supportedImageMimeTypes.includes(value as (typeof supportedImageMimeTypes)[number]);
}

