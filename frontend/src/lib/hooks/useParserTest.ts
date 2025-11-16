import { useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { adminParsersApi } from '@/lib/api/endpoints/adminParsers';
import type {
  ParserTestRequest,
  ParserTestResponse,
} from '@/lib/types/parserConfig';

/**
 * Stan zarządzany przez hook
 */
interface ParserTestState {
  testResult: ParserTestResponse | null;
  isLoading: boolean;
  error: string | null;
  hasRun: boolean; // czy test był już uruchomiony
}

/**
 * Akcje dostępne w hooku
 */
interface ParserTestActions {
  runTest: (configId: number, testUrl?: string) => Promise<void>;
  saveResults: (configId: number, testUrl?: string) => Promise<void>;
  reset: () => void;
}

/**
 * Wartość zwracana przez hook
 */
interface UseParserTestReturn {
  state: ParserTestState;
  actions: ParserTestActions;
}

/**
 * Custom hook dla testowania konfiguracji parserów
 * Enkapsuluje logikę dry-run testowania oraz zapisywania wyników
 *
 * US-029, US-030: Testowanie parserów przed aktywacją
 */
export function useParserTest(): UseParserTestReturn {
  const [testResult, setTestResult] = useState<ParserTestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasRun, setHasRun] = useState(false);

  /**
   * Uruchamia test parsera w trybie dry-run (bez zapisu)
   */
  const runTest = useCallback(async (configId: number, testUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ParserTestRequest = testUrl ? { testUrl } : {};

      const result = await adminParsersApi.testParser(configId, request, false);

      setTestResult(result);
      setHasRun(true);

      // Toast w zależności od statusu
      if (result.status === 'SUCCESS') {
        toast.success(
          `Test zakończony sukcesem! Znaleziono ${result.summary.totalGroupsFound}/${result.summary.totalGroupsExpected} grup krwi`
        );
      } else if (result.status === 'PARTIAL') {
        toast.warning(
          `Test częściowo udany. Znaleziono ${result.summary.totalGroupsFound}/${result.summary.totalGroupsExpected} grup krwi. Sprawdź ostrzeżenia.`
        );
      } else {
        toast.error('Test parsera zakończony niepowodzeniem. Sprawdź błędy.');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Błąd podczas testowania parsera';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Uruchamia test parsera z zapisem wyników do bazy
   */
  const saveResults = useCallback(async (configId: number, testUrl?: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ParserTestRequest = testUrl ? { testUrl } : {};

      const result = await adminParsersApi.testParser(configId, request, true);

      setTestResult(result);
      setHasRun(true);

      if (result.summary.saved) {
        toast.success(
          `Wyniki zostały zapisane do bazy! Zapisano ${result.summary.successfulParses} snapshotów.`
        );
      } else {
        toast.error('Nie udało się zapisać wyników do bazy.');
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Błąd podczas zapisywania wyników testu';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Resetuje stan testu
   */
  const reset = useCallback(() => {
    setTestResult(null);
    setError(null);
    setHasRun(false);
  }, []);

  return {
    state: {
      testResult,
      isLoading,
      error,
      hasRun,
    },
    actions: {
      runTest,
      saveResults,
      reset,
    },
  };
}
