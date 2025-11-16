import { Badge } from '@/components/ui/Badge';
import type { ParserStatusBadgeProps } from '@/lib/types/parserConfig';

/**
 * ParserStatusBadge - Badge pokazujący status parsera
 *
 * Wyświetla kombinację statusu aktywności i ostatniego uruchomienia:
 * - Aktywny + SUCCESS → zielony "Aktywny"
 * - Aktywny + FAILED → czerwony "Błąd parsowania"
 * - Aktywny + PARTIAL → żółty "Częściowy sukces"
 * - Nieaktywny → szary "Nieaktywny"
 * - Aktywny + null → niebieski "Nie uruchomiony"
 *
 * US-029, US-030: Zarządzanie konfiguracją parserów
 */
export function ParserStatusBadge({ active, lastRunStatus }: ParserStatusBadgeProps) {
  // Nieaktywny parser
  if (!active) {
    return (
      <Badge variant="neutral" size="small">
        Nieaktywny
      </Badge>
    );
  }

  // Aktywny parser - status zależny od ostatniego uruchomienia
  if (lastRunStatus === 'SUCCESS') {
    return (
      <Badge variant="success" size="small">
        Aktywny
      </Badge>
    );
  }

  if (lastRunStatus === 'FAILED') {
    return (
      <Badge variant="error" size="small">
        Błąd parsowania
      </Badge>
    );
  }

  if (lastRunStatus === 'PARTIAL') {
    return (
      <Badge variant="warning" size="small">
        Częściowy sukces
      </Badge>
    );
  }

  // Aktywny, ale jeszcze nie uruchomiony
  return (
    <Badge variant="info" size="small">
      Nie uruchomiony
    </Badge>
  );
}
