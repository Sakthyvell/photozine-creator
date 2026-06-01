import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the project shell', () => {
    render(<App />);

    expect(screen.getByText('Photo Zine Maker')).toBeInTheDocument();
    expect(
      screen.getByRole('navigation', { name: 'Main workflow' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Collect the cover assets and body photos',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Export PDF' }),
    ).toBeInTheDocument();
  });
});
