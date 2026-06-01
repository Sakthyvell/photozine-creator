import { describe, expect, it } from 'vitest';
import { isSupportedImageFile, partitionSupportedFiles } from './intake';

function makeFile(name: string, type: string) {
  return new File(['content'], name, { type });
}

describe('upload intake validation', () => {
  it('accepts JPG, JPEG, and PNG files by mime type or extension', () => {
    expect(isSupportedImageFile(makeFile('cover.jpg', 'image/jpeg'))).toBe(true);
    expect(isSupportedImageFile(makeFile('cover.jpeg', ''))).toBe(true);
    expect(isSupportedImageFile(makeFile('cover.png', 'image/png'))).toBe(true);
  });

  it('rejects unsupported files while keeping valid files from the same batch', () => {
    const nextWarningId = () => 'warning-1';
    const result = partitionSupportedFiles(
      [
        makeFile('body-one.jpg', 'image/jpeg'),
        makeFile('notes.txt', 'text/plain'),
      ],
      'body-photo',
      nextWarningId,
    );

    expect(result.acceptedFiles).toHaveLength(1);
    expect(result.acceptedFiles[0]?.name).toBe('body-one.jpg');
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0]).toEqual(
      expect.objectContaining({
        code: 'unsupported-file-type',
        scope: 'body-photo',
      }),
    );
  });
});
