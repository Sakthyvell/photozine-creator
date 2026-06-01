import { vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

vi.mock('./lib/image', () => ({
  extractImageMetadata: async (file: File) => {
    if (file.name === 'front-cover.png') {
      return {
        width: 1200,
        height: 1600,
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

function makeFile(name: string, type: string, contents = 'test-file-content') {
  return new File([contents], name, { type });
}

describe('App upload intake', () => {
  it('keeps valid body photos from a mixed batch and requires a front cover before export', async () => {
    render(<App />);
    const uploadWorkspace = screen
      .getByRole('heading', { name: 'Collect the cover assets and body photos' })
      .closest('section');
    const sourceOrganizer = screen
      .getByRole('heading', { name: 'Review the uploaded sources' })
      .closest('section');

    expect(uploadWorkspace).not.toBeNull();
    expect(sourceOrganizer).not.toBeNull();

    const exportButton = screen.getByRole('button', { name: 'Export PDF' });
    expect(exportButton).toBeDisabled();

    const bodyInput = screen.getByLabelText('Body photo file picker');
    fireEvent.change(bodyInput, {
      target: {
        files: [
          makeFile('market-stall.jpg', 'image/jpeg'),
          makeFile('notes.txt', 'text/plain'),
        ],
      },
    });

    expect(
      await within(uploadWorkspace as HTMLElement).findByText('market-stall.jpg'),
    ).toBeInTheDocument();
    expect(
      await within(uploadWorkspace as HTMLElement).findByText(
        /notes\.txt was skipped from Body photos/i,
      ),
    ).toBeInTheDocument();
    expect(exportButton).toBeDisabled();

    const frontInput = screen.getByLabelText('Front cover file picker');
    fireEvent.change(frontInput, {
      target: {
        files: [makeFile('front-cover.png', 'image/png')],
      },
    });

    const frontCoverPreview = await screen.findByAltText('front-cover.png preview');
    expect(frontCoverPreview.closest('.source-organizer')).not.toBeNull();
    expect(exportButton).not.toBeDisabled();
    expect(
      await screen.findByText(/front-cover\.png may print softly/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/front-cover\.png may print softly/i).closest('.source-organizer'),
    ).not.toBeNull();
  });

  it('surfaces duplicate warnings without blocking uploads and allows dismissal', async () => {
    render(<App />);
    const sourceOrganizer = screen
      .getByRole('heading', { name: 'Review the uploaded sources' })
      .closest('section');

    expect(sourceOrganizer).not.toBeNull();

    const bodyInput = screen.getByLabelText('Body photo file picker');
    fireEvent.change(bodyInput, {
      target: {
        files: [makeFile('market-stall.jpg', 'image/jpeg', 'same-image')],
      },
    });

    const bodyPhotoPreview = await screen.findByAltText('market-stall.jpg preview');
    expect(bodyPhotoPreview.closest('.source-organizer')).not.toBeNull();

    fireEvent.change(bodyInput, {
      target: {
        files: [makeFile('market-stall-copy.jpg', 'image/jpeg', 'same-image')],
      },
    });

    const duplicateWarning = await screen.findByText(
      /market-stall-copy\.jpg looks like a duplicate of market-stall\.jpg/i,
    );
    expect(duplicateWarning).toBeInTheDocument();
    expect(duplicateWarning.closest('.source-organizer')).not.toBeNull();

    fireEvent.click(within(sourceOrganizer as HTMLElement).getByRole('button', { name: 'Dismiss' }));
    expect(duplicateWarning).not.toBeInTheDocument();
  });
});
