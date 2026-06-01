import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

vi.mock('./lib/image', () => ({
  extractImageMetadata: async (file: File) => {
    if (file.name === 'cover.jpg') {
      return {
        width: 1800,
        height: 2400,
        aspectRatio: 0.75,
        orientation: 'portrait',
        exifOrientation: 1,
        previewUrl: `blob:${file.name}`,
        rotationQuarterTurns: 0,
        format: file.type,
      };
    }

    return {
      width: 2400,
      height: 3200,
      aspectRatio: 0.75,
      orientation: 'portrait',
      exifOrientation: 1,
      previewUrl: `blob:${file.name}`,
      rotationQuarterTurns: 0,
      format: file.type,
    };
  },
}));

function makeFile(name: string, type: string) {
  return new File(['image'], name, { type });
}

describe('App preview flow', () => {
  it('shows reading-order pages with auto-padding once a front cover and body photo exist', async () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText('Front cover file picker'), {
      target: { files: [makeFile('cover.jpg', 'image/jpeg')] },
    });

    fireEvent.change(screen.getByLabelText('Body photo file picker'), {
      target: { files: [makeFile('body.jpg', 'image/jpeg')] },
    });

    const previewSection = await screen
      .findByRole('heading', { name: 'Preview the reading order' })
      .then((heading) => heading.closest('article'));

    expect(previewSection).not.toBeNull();
    expect(
      within(previewSection as HTMLElement).getByText(/4 reading-order pages with 1 auto blank/i),
    ).toBeInTheDocument();
    expect(within(previewSection as HTMLElement).getAllByText('Blank page').length).toBeGreaterThan(0);
    expect(within(previewSection as HTMLElement).getAllByText('Back cover').length).toBeGreaterThan(0);
    expect(within(previewSection as HTMLElement).getByText('Sheet 1')).toBeInTheDocument();
    expect(within(previewSection as HTMLElement).getByText('Front side')).toBeInTheDocument();
  });
});
