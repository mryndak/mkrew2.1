/**
 * Unit tests dla RckikHeader component
 *
 * Test framework: Vitest (do zainstalowania)
 * Testing library: @testing-library/react
 *
 * Instalacja:
 * npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RckikHeader } from '../RckikHeader';
import type { RckikDetailDto } from '@/types/rckik';

// Mock data
const mockRckik: RckikDetailDto = {
  id: 1,
  name: 'Regionalne Centrum Krwiodawstwa i Krwiolecznictwa w Warszawie',
  code: 'RCKIK-WAW-1',
  city: 'Warszawa',
  address: 'ul. Kasprzaka 17, 01-211 Warszawa',
  latitude: 52.2319,
  longitude: 20.9728,
  aliases: ['RCKiK Warszawa', 'RCKIK WAW'],
  active: true,
  createdAt: '2024-01-01T00:00:00',
  updatedAt: '2025-01-01T00:00:00',
  currentBloodLevels: [],
  lastSuccessfulScrape: '2025-01-01T00:00:00',
  scrapingStatus: 'OK',
};

describe('RckikHeader', () => {
  describe('Rendering', () => {
    it('should render RCKiK name', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByText(mockRckik.name)).toBeInTheDocument();
    });

    it('should render RCKiK code', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByText(/Kod: RCKIK-WAW-1/)).toBeInTheDocument();
    });

    it('should render address with location icon', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByText(mockRckik.address)).toBeInTheDocument();
    });

    it('should render active badge when RCKiK is active', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByText('Aktywne')).toBeInTheDocument();
    });

    it('should render inactive badge when RCKiK is not active', () => {
      const inactiveRckik = { ...mockRckik, active: false };

      render(
        <RckikHeader
          rckik={inactiveRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByText('Nieaktywne')).toBeInTheDocument();
    });

    it('should render aliases when available', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByText(/Inne nazwy:/)).toBeInTheDocument();
      expect(screen.getByText(/RCKiK Warszawa, RCKIK WAW/)).toBeInTheDocument();
    });

    it('should not render aliases section when no aliases', () => {
      const noAliasesRckik = { ...mockRckik, aliases: [] };

      render(
        <RckikHeader
          rckik={noAliasesRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.queryByText(/Inne nazwy:/)).not.toBeInTheDocument();
    });
  });

  describe('Map link', () => {
    it('should render map link when coordinates are available', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      const mapLink = screen.getByText('Zobacz na mapie').closest('a');
      expect(mapLink).toBeInTheDocument();
      expect(mapLink).toHaveAttribute(
        'href',
        `https://www.google.com/maps/search/?api=1&query=${mockRckik.latitude},${mockRckik.longitude}`
      );
      expect(mapLink).toHaveAttribute('target', '_blank');
      expect(mapLink).toHaveAttribute('rel', 'noopener noreferrer');
    });

    it('should not render map link when coordinates are missing', () => {
      const noLocationRckik = { ...mockRckik, latitude: null, longitude: null };

      render(
        <RckikHeader
          rckik={noLocationRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.queryByText('Zobacz na mapie')).not.toBeInTheDocument();
    });
  });

  describe('Favorite button', () => {
    it('should render "Dodaj do ulubionych" when not authenticated', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByLabelText('Zaloguj się, aby dodać do ulubionych')).toBeInTheDocument();
    });

    it('should render "Dodaj do ulubionych" when authenticated and not favorite', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={true}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByLabelText('Dodaj do ulubionych')).toBeInTheDocument();
    });

    it('should render "Usuń z ulubionych" when authenticated and is favorite', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={true}
          isAuthenticated={true}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByLabelText('Usuń z ulubionych')).toBeInTheDocument();
    });

    it('should call onToggleFavorite when button clicked', async () => {
      const user = userEvent.setup();
      const onToggleFavorite = vi.fn();

      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={true}
          onToggleFavorite={onToggleFavorite}
        />
      );

      const button = screen.getByLabelText('Dodaj do ulubionych');
      await user.click(button);

      expect(onToggleFavorite).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent(mockRckik.name);
    });

    it('should have proper aria-label on favorite button', () => {
      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={true}
          onToggleFavorite={() => {}}
        />
      );

      const button = screen.getByRole('button', { name: /dodaj do ulubionych/i });
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup();
      const onToggleFavorite = vi.fn();

      render(
        <RckikHeader
          rckik={mockRckik}
          isFavorite={false}
          isAuthenticated={true}
          onToggleFavorite={onToggleFavorite}
        />
      );

      // Tab to favorite button
      await user.tab();

      // Press Enter
      await user.keyboard('{Enter}');

      expect(onToggleFavorite).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long RCKiK names', () => {
      const longNameRckik = {
        ...mockRckik,
        name: 'A'.repeat(200),
      };

      render(
        <RckikHeader
          rckik={longNameRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalRckik = {
        ...mockRckik,
        aliases: undefined,
        latitude: null,
        longitude: null,
      };

      render(
        <RckikHeader
          rckik={minimalRckik}
          isFavorite={false}
          isAuthenticated={false}
          onToggleFavorite={() => {}}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    });
  });
});
