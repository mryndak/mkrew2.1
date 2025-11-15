import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { reportsApi } from '@/lib/api/endpoints/reports';
import { ReportStatusBadge } from './ReportStatusBadge';
import { Button } from '@/components/ui/Button';
import type { ReportDetailsModalProps, UserReportDto, ReportStatus } from '@/lib/types/reports';

/**
 * ReportDetailsModal - Modal ze szczegółami raportu użytkownika
 *
 * Features:
 * - Pełne informacje o raporcie (user, RCKiK, snapshot, description)
 * - Screenshot viewer z możliwością powiększenia
 * - Edycja admin notes (textarea z licznikiem znaków)
 * - Zmiana statusu raportu (select)
 * - Quick actions: Rozwiąż, Odrzuć
 * - React Hook Form + Zod validation
 * - Focus trap i keyboard navigation (ESC)
 * - API calls: fetch details, update report
 */

/**
 * Validation Schema
 */
const updateReportSchema = z.object({
  status: z.enum(['NEW', 'IN_REVIEW', 'RESOLVED', 'REJECTED']),
  adminNotes: z.string().max(2000, 'Notatki nie mogą przekraczać 2000 znaków').optional(),
});

type UpdateReportFormData = z.infer<typeof updateReportSchema>;

export function ReportDetailsModal({
  reportId,
  isOpen,
  onClose,
  onUpdate,
}: ReportDetailsModalProps) {
  const [report, setReport] = useState<UserReportDto | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotZoomed, setScreenshotZoomed] = useState(false);

  // React Hook Form
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue,
  } = useForm<UpdateReportFormData>({
    resolver: zodResolver(updateReportSchema),
  });

  const adminNotes = watch('adminNotes') || '';
  const charsRemaining = 2000 - adminNotes.length;

  /**
   * Fetch report details
   */
  const fetchReportDetails = async (id: number) => {
    setLoading(true);
    setError(null);

    try {
      const data = await reportsApi.getReportDetails(id);
      setReport(data);

      // Set form default values
      reset({
        status: data.status as ReportStatus,
        adminNotes: data.adminNotes || '',
      });
    } catch (err) {
      console.error('Failed to fetch report details:', err);
      setError('Nie udało się załadować szczegółów raportu');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Submit handler - Update report
   */
  const onSubmit = async (data: UpdateReportFormData) => {
    if (!reportId) return;

    setSaving(true);

    try {
      await reportsApi.updateReport(reportId, data);
      toast.success('Raport zaktualizowany pomyślnie', {
        position: 'top-right',
        autoClose: 3000,
      });
      onUpdate(); // Odśwież listę
      onClose(); // Zamknij modal
    } catch (err) {
      console.error('Failed to update report:', err);
      toast.error('Nie udało się zaktualizować raportu', {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * Quick action: Resolve
   */
  const handleResolve = () => {
    setValue('status', 'RESOLVED', { shouldDirty: true });
    // Auto submit
    handleSubmit(onSubmit)();
  };

  /**
   * Quick action: Reject
   */
  const handleReject = () => {
    setValue('status', 'REJECTED', { shouldDirty: true });
    // Auto submit
    handleSubmit(onSubmit)();
  };

  /**
   * Effect: Fetch details when modal opens
   */
  useEffect(() => {
    if (isOpen && reportId) {
      fetchReportDetails(reportId);
      setScreenshotZoomed(false);
    }
  }, [isOpen, reportId]);

  /**
   * Effect: Close on ESC
   */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !screenshotZoomed) {
        onClose();
      } else if (e.key === 'Escape' && screenshotZoomed) {
        setScreenshotZoomed(false);
      }
    };

    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose, screenshotZoomed]);

  /**
   * Effect: Prevent body scroll when modal open
   */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Format date to DD.MM.YYYY HH:mm
   */
  const formatDate = (isoString: string): string => {
    try {
      const date = new Date(isoString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${day}.${month}.${year} ${hours}:${minutes}`;
    } catch {
      return isoString;
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      aria-labelledby="modal-title"
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all w-full max-w-4xl max-h-[90vh] flex flex-col" data-test-id="admin-reports-details-modal">
          {/* Header */}
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold text-gray-900" id="modal-title" data-test-id="admin-reports-modal-title">
                  Raport #{reportId}
                </h2>
                {report && <ReportStatusBadge status={report.status} size="medium" />}
              </div>
              <button
                data-test-id="admin-reports-modal-close-button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Zamknij modal"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Body - Scrollable */}
          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Loading State */}
            {loading && (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
                <button
                  onClick={() => reportId && fetchReportDetails(reportId)}
                  className="mt-3 text-sm font-medium text-red-600 hover:text-red-800"
                >
                  Spróbuj ponownie
                </button>
              </div>
            )}

            {/* Content */}
            {report && !loading && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* User Info Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Informacje o użytkowniku
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Imię i nazwisko</dt>
                      <dd className="mt-1 text-gray-900">
                        {report.user.firstName} {report.user.lastName}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Email</dt>
                      <dd className="mt-1 text-gray-900">{report.user.email}</dd>
                    </div>
                  </dl>
                </div>

                {/* RCKiK Info Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Informacje o centrum RCKiK
                  </h3>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Nazwa centrum</dt>
                      <dd className="mt-1 text-gray-900">{report.rckikName}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">ID centrum</dt>
                      <dd className="mt-1 text-gray-900">{report.rckikId}</dd>
                    </div>
                  </dl>
                </div>

                {/* Snapshot Info (if exists) */}
                {report.bloodSnapshotId && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Snapshot danych
                    </h3>
                    <p className="text-sm text-blue-800">
                      Raport dotyczy snapshota ID: <strong>{report.bloodSnapshotId}</strong>
                    </p>
                  </div>
                )}

                {/* Description */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Opis zgłoszenia
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-900 whitespace-pre-wrap">
                    {report.description}
                  </div>
                </div>

                {/* Screenshot Viewer */}
                {report.screenshotUrl && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Screenshot</h3>
                    <div className="relative">
                      <img
                        src={report.screenshotUrl}
                        alt="Screenshot zgłoszenia"
                        className="w-full rounded-lg cursor-zoom-in"
                        onClick={() => setScreenshotZoomed(true)}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>';
                          (e.target as HTMLImageElement).className =
                            'w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center';
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setScreenshotZoomed(true)}
                        className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-lg p-2 hover:bg-opacity-100 transition-opacity"
                        aria-label="Powiększ screenshot"
                      >
                        <svg
                          className="w-5 h-5 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Admin Notes Section */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <label htmlFor="adminNotes" className="block text-sm font-semibold text-gray-900 mb-3">
                    Notatki administratora
                  </label>
                  <textarea
                    id="adminNotes"
                    data-test-id="admin-reports-admin-notes-textarea"
                    {...register('adminNotes')}
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                    placeholder="Dodaj notatki dotyczące weryfikacji tego raportu..."
                  />
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span
                      className={`${
                        charsRemaining < 0 ? 'text-red-600 font-medium' : 'text-gray-500'
                      }`}
                    >
                      Pozostało: {charsRemaining} znaków
                    </span>
                    {errors.adminNotes && (
                      <span className="text-red-600">{errors.adminNotes.message}</span>
                    )}
                  </div>
                </div>

                {/* Status Select */}
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <label htmlFor="status" className="block text-sm font-semibold text-gray-900 mb-3">
                    Status raportu
                  </label>
                  <select
                    id="status"
                    data-test-id="admin-reports-status-select"
                    {...register('status')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="NEW">Nowy</option>
                    <option value="IN_REVIEW">W weryfikacji</option>
                    <option value="RESOLVED">Rozwiązany</option>
                    <option value="REJECTED">Odrzucony</option>
                  </select>
                </div>

                {/* Resolution Info (if resolved) */}
                {report.resolvedBy && report.resolvedAt && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-green-900 mb-2">
                      Informacje o rozwiązaniu
                    </h3>
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div>
                        <dt className="font-medium text-green-700">Rozwiązano przez</dt>
                        <dd className="mt-1 text-green-900">
                          {report.resolvedBy.firstName} {report.resolvedBy.lastName}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-green-700">Data rozwiązania</dt>
                        <dd className="mt-1 text-green-900">{formatDate(report.resolvedAt)}</dd>
                      </div>
                    </dl>
                  </div>
                )}

                {/* Metadata */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="font-medium text-gray-500">Data utworzenia</dt>
                      <dd className="mt-1 text-gray-900">{formatDate(report.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="font-medium text-gray-500">Ostatnia aktualizacja</dt>
                      <dd className="mt-1 text-gray-900">{formatDate(report.updatedAt)}</dd>
                    </div>
                  </dl>
                </div>
              </form>
            )}
          </div>

          {/* Footer - Actions */}
          {report && !loading && (
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Quick Actions */}
                <div className="flex items-center gap-2">
                  {report.status !== 'RESOLVED' && (
                    <Button
                      type="button"
                      variant="primary"
                      size="small"
                      onClick={handleResolve}
                      loading={saving}
                      disabled={saving}
                      data-test-id="admin-reports-resolve-button"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Rozwiąż
                    </Button>
                  )}
                  {report.status !== 'REJECTED' && (
                    <Button
                      type="button"
                      variant="outline"
                      size="small"
                      onClick={handleReject}
                      loading={saving}
                      disabled={saving}
                      data-test-id="admin-reports-reject-button"
                    >
                      <svg
                        className="w-4 h-4 mr-1.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Odrzuć
                    </Button>
                  )}
                </div>

                {/* Main Actions */}
                <div className="flex items-center gap-2">
                  <Button type="button" variant="ghost" size="medium" onClick={onClose} data-test-id="admin-reports-cancel-button">
                    Anuluj
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="medium"
                    onClick={handleSubmit(onSubmit)}
                    loading={saving}
                    disabled={!isDirty || saving || charsRemaining < 0}
                    data-test-id="admin-reports-save-button"
                  >
                    Zapisz zmiany
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Screenshot Zoom Modal */}
      {screenshotZoomed && report?.screenshotUrl && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setScreenshotZoomed(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={report.screenshotUrl}
              alt="Screenshot zgłoszenia (powiększony)"
              className="max-w-full max-h-[90vh] object-contain"
            />
            <button
              onClick={() => setScreenshotZoomed(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100 transition-opacity"
              aria-label="Zamknij powiększenie"
            >
              <svg
                className="w-6 h-6 text-gray-900"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
