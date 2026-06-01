import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

vi.mock('./lib/image', () => ({
  extractImageMetadata: async (file: File) => ({
    width: 2400,
    height: 3200,
    aspectRatio: 0.75,
    orientation: 'portrait',
    exifOrientation: 1,
    previewUrl: `blob:${file.name}`,
    rotationQuarterTurns: 0,
    format: 'image/png',
  }),
}));

function makeFile(name: string) {
  const pngBytes = Uint8Array.from([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82,
    0, 0, 0, 1, 0, 0, 0, 1, 8, 4, 0, 0, 0, 181, 28, 12,
    2, 0, 0, 0, 11, 73, 68, 65, 84, 120, 218, 99, 252, 255, 31, 0,
    2, 233, 1, 245, 81, 55, 117, 25, 0, 0, 0, 0, 73, 69, 78, 68,
    174, 66, 96, 130,
  ]);

  return new File([pngBytes], name, { type: 'image/png' });
}

describe('App export flow', () => {
  it('exports the imposed booklet PDF after upload and planning data exist', async () => {
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });

    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:download-pdf');
    const revokeObjectUrl = vi.spyOn(URL, 'revokeObjectURL').mockReturnValue();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    render(<App />);

    fireEvent.change(screen.getByLabelText('Front cover file picker'), {
      target: { files: [makeFile('cover.png')] },
    });

    fireEvent.change(screen.getByLabelText('Body photo file picker'), {
      target: { files: [makeFile('body.png')] },
    });

    fireEvent.click(await screen.findByRole('button', { name: 'Export PDF' }));

    await waitFor(() => {
      expect(createObjectUrl).toHaveBeenCalled();
      expect(click).toHaveBeenCalled();
      expect(revokeObjectUrl).toHaveBeenCalledWith('blob:download-pdf');
    });

    expect(await screen.findByText(/Exported .* PDF pages\./i)).toBeInTheDocument();
  });
});
