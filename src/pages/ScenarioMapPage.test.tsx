import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { ScenarioMapPage } from './ScenarioMapPage';

describe('ScenarioMapPage', () => {
  it('shows the scenario screens, goals and A/B test plan', () => {
    render(
      <MemoryRouter>
        <ScenarioMapPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole('heading', { name: 'От первого клика до звонка эксперта' }),
    ).toBeInTheDocument();
    expect(screen.getByText('mortgage_start')).toBeInTheDocument();
    expect(screen.getByText('mortgage_application_sent')).toBeInTheDocument();
    expect(screen.getByText('6 000')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Открыть сценарий/ })).toHaveAttribute(
      'href',
      '/mortgage',
    );
  });
});
