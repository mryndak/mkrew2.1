import { useState } from 'react';
import { toast } from 'react-toastify';
import { scraperApi } from '@/lib/api/endpoints/scraper';
import type { TriggerScraperRequest, ScraperRunResponse } from '@/lib/types/scraper';

/**
 * Custom hook do ręcznego uruchamiania scrapera
 *
 * Features:
 * - POST request do /admin/scraper/runs
 * - Loading state
 * - Error handling z toast notifications
 * - Success callback
 *
 * Usage:
 * ```tsx
 * const { triggerScraper, isTriggering, error } = useManualTrigger();
 *
 * const handleSubmit = async (data: TriggerScraperRequest) => {
 *   const result = await triggerScraper(data);
 *   if (result) {
 *     console.log('Scraper started:', result.scraperId);
 *   }
 * };
 * ```
 */

interface UseManualTriggerReturn {
  triggerScraper: (data: TriggerScraperRequest) => Promise<ScraperRunResponse | null>;
  isTriggering: boolean;
  error: Error | null;
}

export function useManualTrigger(): UseManualTriggerReturn {
  const [isTriggering, setIsTriggering] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const triggerScraper = async (
    data: TriggerScraperRequest
  ): Promise<ScraperRunResponse | null> => {
    setIsTriggering(true);
    setError(null);

    try {
      const response = await scraperApi.triggerScraper(data);

      // Toast sukcesu
      toast.success(
        `Scraper uruchomiony! Run ID: ${response.scraperId}`,
        {
          position: 'top-right',
          autoClose: 5000,
        }
      );

      return response;
    } catch (err: any) {
      const error = err instanceof Error ? err : new Error('Failed to trigger scraper');
      setError(error);

      // Obsługa różnych typów błędów
      if (err.response?.status === 400) {
        // Błąd walidacji
        const details = err.response?.data?.details;
        if (details && Array.isArray(details)) {
          const messages = details.map((d: any) => d.message).join(', ');
          toast.error(`Błąd walidacji: ${messages}`, {
            position: 'top-right',
            autoClose: 7000,
          });
        } else {
          toast.error('Nieprawidłowe dane formularza', {
            position: 'top-right',
            autoClose: 5000,
          });
        }
      } else if (err.response?.status === 403) {
        // Brak uprawnień
        toast.error('Brak uprawnień dostępu. Wymagana rola ADMIN.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else if (err.response?.status === 404) {
        // RCKiK nie znaleziony
        toast.error('Wybrane centrum krwi nie istnieje', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else if (err.response?.status === 503) {
        // Serwer przeciążony
        toast.error('Serwer jest obecnie przeciążony. Spróbuj ponownie za chwilę.', {
          position: 'top-right',
          autoClose: 7000,
        });
      } else if (err.code === 'ECONNABORTED') {
        // Timeout
        toast.error('Przekroczono limit czasu połączenia. Sprawdź połączenie sieciowe.', {
          position: 'top-right',
          autoClose: 5000,
        });
      } else {
        // Ogólny błąd
        toast.error('Nie udało się uruchomić scrapera. Spróbuj ponownie.', {
          position: 'top-right',
          autoClose: 5000,
        });
      }

      console.error('Error triggering scraper:', error);
      return null;
    } finally {
      setIsTriggering(false);
    }
  };

  return {
    triggerScraper,
    isTriggering,
    error,
  };
}
