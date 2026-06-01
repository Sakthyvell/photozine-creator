import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

function makeFile(name: string, type: string) {
  return new File(['test-file-content'], name, { type });
}

describe('App upload intake', () => {
  it('keeps valid body photos from a mixed batch and requires a front cover before export', () => {
    render(<App />);
    const uploadWorkspace = screen
      .getByRole('heading', { name: 'Collect the cover assets and body photos' })
      .closest('section');

    expect(uploadWorkspace).not.toBeNull();

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

    expect(within(uploadWorkspace as HTMLElement).getByText('market-stall.jpg')).toBeInTheDocument();
    expect(
      within(uploadWorkspace as HTMLElement).getByText(
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

    expect(within(uploadWorkspace as HTMLElement).getByText('front-cover.png')).toBeInTheDocument();
    expect(exportButton).not.toBeDisabled();
  });
});
