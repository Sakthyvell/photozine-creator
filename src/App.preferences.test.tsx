import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { App } from './App';

afterEach(() => {
  cleanup();
  window.localStorage.clear();
});

describe('App planning preferences', () => {
  it('persists the last-used planning mode and restores it on reload', () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'Favor fewer pages' }));

    expect(
      screen.getByRole('button', {
        name: 'Favor fewer pages',
        pressed: true,
      }),
    ).toBeInTheDocument();
    expect(window.localStorage.getItem('photo-zine-maker.planningMode')).toBe(
      'favor-fewer-pages',
    );

    cleanup();

    render(<App />);

    expect(
      screen.getByRole('button', {
        name: 'Favor fewer pages',
        pressed: true,
      }),
    ).toBeInTheDocument();
  });
});
