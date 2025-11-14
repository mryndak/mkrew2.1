import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProvider } from '@/components/common/AppProvider';
import { DashboardContent } from './DashboardContent';

/**
 * DashboardPage - Wrapper combining AuthGuard, AppProvider, and DashboardContent
 * This ensures all components share the same React tree and context
 *
 * Note: This is necessary because Astro islands with client:only create separate
 * React trees. By wrapping everything in one component, we ensure Redux context,
 * Toast notifications, and API error handling are available to all child components.
 */
interface DashboardPageProps {
  redirectUrl?: string;
}

export function DashboardPage({ redirectUrl = '/dashboard' }: DashboardPageProps) {
  return (
    <AuthGuard redirectUrl={redirectUrl}>
      <AppProvider>
        <DashboardContent />
      </AppProvider>
    </AuthGuard>
  );
}
