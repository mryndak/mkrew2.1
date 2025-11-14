import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardContent } from './DashboardContent';

/**
 * DashboardPage - Wrapper combining AuthGuard, Redux Provider, and DashboardContent
 * This ensures all components share the same React tree and context
 *
 * Note: This is necessary because Astro islands with client:only create separate
 * React trees. By wrapping everything in one component, we ensure Redux context
 * is available to all child components.
 */
interface DashboardPageProps {
  redirectUrl?: string;
}

export function DashboardPage({ redirectUrl = '/dashboard' }: DashboardPageProps) {
  return (
    <AuthGuard redirectUrl={redirectUrl}>
      <Provider store={store}>
        <DashboardContent />
      </Provider>
    </AuthGuard>
  );
}
