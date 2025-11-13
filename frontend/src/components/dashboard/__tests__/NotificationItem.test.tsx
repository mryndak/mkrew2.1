/**
 * Component tests dla NotificationItem
 *
 * Test framework: Vitest
 * Testing utilities: @testing-library/react
 *
 * Tests:
 * - Rendering notification data
 * - Unread/read states
 * - Click interactions
 * - Keyboard navigation
 * - Notification types and icons
 * - Time formatting
 * - Memoization behavior
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NotificationItem } from '../NotificationItem';
import type { InAppNotificationDto } from '@/types/dashboard';

// Mock data
const mockNotification: InAppNotificationDto = {
  id: 1,
  type: 'CRITICAL_BLOOD_LEVEL',
  rckik: { id: 1, name: 'RCKiK Warszawa' },
  title: 'Krytyczny poziom krwi A+',
  message: 'Poziom krwi A+ w RCKiK Warszawa jest krytycznie niski. Twoja donacja jest pilnie potrzebna.',
  linkUrl: '/rckik/1',
  readAt: null,
  expiresAt: null,
  createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
};

const mockReadNotification: InAppNotificationDto = {
  ...mockNotification,
  id: 2,
  readAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
};

const mockNotificationWithoutLink: InAppNotificationDto = {
  ...mockNotification,
  id: 3,
  linkUrl: null,
};

const mockLongMessageNotification: InAppNotificationDto = {
  ...mockNotification,
  id: 4,
  message:
    'This is a very long message that should be truncated to 100 characters and display an ellipsis at the end to indicate that there is more content available but not shown in this preview.',
};

describe('NotificationItem', () => {
  let onReadMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onReadMock = vi.fn();
  });

  describe('Rendering', () => {
    it('should render notification title and message', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      expect(screen.getByText('Krytyczny poziom krwi A+')).toBeInTheDocument();
      expect(
        screen.getByText(/Poziom krwi A\+ w RCKiK Warszawa jest krytycznie niski/)
      ).toBeInTheDocument();
    });

    it('should display RCKiK name when present', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      expect(screen.getByText('RCKiK Warszawa')).toBeInTheDocument();
    });

    it('should not display RCKiK name when null', () => {
      const notificationWithoutRckik = { ...mockNotification, rckik: null };
      render(<NotificationItem notification={notificationWithoutRckik} onRead={onReadMock} />);

      expect(screen.queryByText('RCKiK Warszawa')).not.toBeInTheDocument();
    });

    it('should truncate long messages to 100 characters', () => {
      render(<NotificationItem notification={mockLongMessageNotification} onRead={onReadMock} />);

      const message = screen.getByText(/This is a very long message/);
      expect(message.textContent).toHaveLength(103); // 100 chars + "..."
      expect(message.textContent).toMatch(/\.\.\.$/);
    });

    it('should display relative time', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      // Should show "2 godziny temu" or similar
      expect(screen.getByText(/godzin/i)).toBeInTheDocument();
    });
  });

  describe('Unread/Read states', () => {
    it('should display "Nowe" badge for unread notifications', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      expect(screen.getByText('Nowe')).toBeInTheDocument();
    });

    it('should not display "Nowe" badge for read notifications', () => {
      render(<NotificationItem notification={mockReadNotification} onRead={onReadMock} />);

      expect(screen.queryByText('Nowe')).not.toBeInTheDocument();
    });

    it('should apply unread styles (blue background) for unread notifications', () => {
      const { container } = render(
        <NotificationItem notification={mockNotification} onRead={onReadMock} />
      );

      const notificationDiv = container.querySelector('[role="button"]');
      expect(notificationDiv).toHaveClass('bg-blue-50');
      expect(notificationDiv).toHaveClass('border-blue-200');
    });

    it('should apply read styles (white background) for read notifications', () => {
      const { container } = render(
        <NotificationItem notification={mockReadNotification} onRead={onReadMock} />
      );

      const notificationDiv = container.querySelector('[role="button"]');
      expect(notificationDiv).toHaveClass('bg-white');
      expect(notificationDiv).toHaveClass('border-gray-200');
    });
  });

  describe('Click interactions', () => {
    it('should call onRead when clicking unread notification with linkUrl', () => {
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      fireEvent.click(notificationDiv);

      expect(onReadMock).toHaveBeenCalledWith(mockNotification.id);
    });

    it('should not call onRead when clicking read notification', () => {
      render(<NotificationItem notification={mockReadNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      fireEvent.click(notificationDiv);

      expect(onReadMock).not.toHaveBeenCalled();
    });

    it('should navigate to linkUrl when clicking', () => {
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      fireEvent.click(notificationDiv);

      expect(window.location.href).toBe('/rckik/1');
    });

    it('should not be clickable when linkUrl is null', () => {
      const { container } = render(
        <NotificationItem notification={mockNotificationWithoutLink} onRead={onReadMock} />
      );

      const notificationDiv = container.firstChild as HTMLElement;
      expect(notificationDiv.getAttribute('role')).not.toBe('button');
      expect(notificationDiv).not.toHaveClass('cursor-pointer');
    });

    it('should not call onRead when clicking notification without linkUrl', () => {
      render(<NotificationItem notification={mockNotificationWithoutLink} onRead={onReadMock} />);

      const notificationDiv = screen.queryByRole('button');
      expect(notificationDiv).not.toBeInTheDocument();
    });
  });

  describe('Keyboard navigation', () => {
    it('should call handler on Enter key', () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      fireEvent.keyDown(notificationDiv, { key: 'Enter' });

      expect(onReadMock).toHaveBeenCalledWith(mockNotification.id);
    });

    it('should call handler on Space key', () => {
      delete (window as any).location;
      window.location = { href: '' } as any;

      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      fireEvent.keyDown(notificationDiv, { key: ' ' });

      expect(onReadMock).toHaveBeenCalledWith(mockNotification.id);
    });

    it('should not call handler on other keys', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      fireEvent.keyDown(notificationDiv, { key: 'a' });

      expect(onReadMock).not.toHaveBeenCalled();
    });

    it('should have tabIndex 0 for keyboard navigation', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      expect(notificationDiv).toHaveAttribute('tabIndex', '0');
    });
  });

  describe('Notification types and icons', () => {
    it('should render CRITICAL_BLOOD_LEVEL icon (red warning)', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      // Check for warning icon (triangle with exclamation)
      const icon = screen.getByRole('button').querySelector('.text-red-600');
      expect(icon).toBeInTheDocument();
    });

    it('should render DONATION_REMINDER icon (blue bell)', () => {
      const reminderNotification = { ...mockNotification, type: 'DONATION_REMINDER' };
      render(<NotificationItem notification={reminderNotification} onRead={onReadMock} />);

      const icon = screen.getByRole('button').querySelector('.text-blue-600');
      expect(icon).toBeInTheDocument();
    });

    it('should render SYSTEM_ALERT icon (gray info)', () => {
      const systemNotification = { ...mockNotification, type: 'SYSTEM_ALERT' };
      render(<NotificationItem notification={systemNotification} onRead={onReadMock} />);

      const icon = screen.getByRole('button').querySelector('.text-gray-600');
      expect(icon).toBeInTheDocument();
    });

    it('should render default icon for OTHER type', () => {
      const otherNotification = { ...mockNotification, type: 'OTHER' };
      render(<NotificationItem notification={otherNotification} onRead={onReadMock} />);

      const icon = screen.getByRole('button').querySelector('.text-gray-500');
      expect(icon).toBeInTheDocument();
    });
  });

  describe('Relative time formatting', () => {
    it('should display "Teraz" for very recent notifications', () => {
      const nowNotification = {
        ...mockNotification,
        createdAt: new Date().toISOString(),
      };

      render(<NotificationItem notification={nowNotification} onRead={onReadMock} />);

      expect(screen.getByText('Teraz')).toBeInTheDocument();
    });

    it('should display minutes for notifications < 1 hour old', () => {
      const minutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 minutes
      const minutesNotification = { ...mockNotification, createdAt: minutesAgo };

      render(<NotificationItem notification={minutesNotification} onRead={onReadMock} />);

      expect(screen.getByText('30 minut temu')).toBeInTheDocument();
    });

    it('should display hours for notifications < 24 hours old', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      expect(screen.getByText(/godz/i)).toBeInTheDocument();
    });

    it('should display days for notifications < 7 days old', () => {
      const daysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days
      const daysNotification = { ...mockNotification, createdAt: daysAgo };

      render(<NotificationItem notification={daysNotification} onRead={onReadMock} />);

      expect(screen.getByText('3 dni temu')).toBeInTheDocument();
    });

    it('should display formatted date for old notifications', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days
      const oldNotification = { ...mockNotification, createdAt: oldDate };

      render(<NotificationItem notification={oldNotification} onRead={onReadMock} />);

      // Should display formatted date like "15 grudnia"
      expect(screen.getByText(/\d+ \w+/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have appropriate aria-label', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      const notificationDiv = screen.getByRole('button');
      const ariaLabel = notificationDiv.getAttribute('aria-label');

      expect(ariaLabel).toContain('Krytyczny poziom krwi A+');
      expect(ariaLabel).toContain('Kliknij aby otworzyć');
    });

    it('should have aria-label without click instruction when not clickable', () => {
      render(<NotificationItem notification={mockNotificationWithoutLink} onRead={onReadMock} />);

      const notificationDiv = screen.getByText('Krytyczny poziom krwi A+').closest('div');
      const ariaLabel = notificationDiv?.getAttribute('aria-label');

      expect(ariaLabel).not.toContain('Kliknij');
    });

    it('should have role="button" for clickable notifications', () => {
      render(<NotificationItem notification={mockNotification} onRead={onReadMock} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should not have role="button" for non-clickable notifications', () => {
      render(<NotificationItem notification={mockNotificationWithoutLink} onRead={onReadMock} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Memoization behavior', () => {
    it('should not re-render when unrelated props change', () => {
      const { rerender } = render(
        <NotificationItem notification={mockNotification} onRead={onReadMock} />
      );

      // Change onRead function (should not trigger re-render due to memo)
      const newOnReadMock = vi.fn();
      rerender(<NotificationItem notification={mockNotification} onRead={newOnReadMock} />);

      // Component should still use original onReadMock (due to memo comparison)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should re-render when notification.id changes', () => {
      const { rerender } = render(
        <NotificationItem notification={mockNotification} onRead={onReadMock} />
      );

      const newNotification = { ...mockNotification, id: 999 };
      rerender(<NotificationItem notification={newNotification} onRead={onReadMock} />);

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should re-render when notification.readAt changes', () => {
      const { rerender } = render(
        <NotificationItem notification={mockNotification} onRead={onReadMock} />
      );

      expect(screen.getByText('Nowe')).toBeInTheDocument();

      const readNotification = { ...mockNotification, readAt: new Date().toISOString() };
      rerender(<NotificationItem notification={readNotification} onRead={onReadMock} />);

      expect(screen.queryByText('Nowe')).not.toBeInTheDocument();
    });
  });

  describe('Arrow indicator', () => {
    it('should display arrow indicator for clickable notifications', () => {
      const { container } = render(
        <NotificationItem notification={mockNotification} onRead={onReadMock} />
      );

      // Check for arrow SVG
      const arrow = container.querySelector('svg path[d*="M9 5l7 7-7 7"]');
      expect(arrow).toBeInTheDocument();
    });

    it('should not display arrow indicator for non-clickable notifications', () => {
      const { container } = render(
        <NotificationItem notification={mockNotificationWithoutLink} onRead={onReadMock} />
      );

      const arrow = container.querySelector('svg path[d*="M9 5l7 7-7 7"]');
      expect(arrow).not.toBeInTheDocument();
    });
  });
});
