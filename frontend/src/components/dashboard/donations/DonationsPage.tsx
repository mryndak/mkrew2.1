import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProvider } from '@/components/common/AppProvider';
import { DonationsView } from './DonationsView';

/**
 * DonationsPage - Wrapper combining AuthGuard, AppProvider, and DonationsView
 */
export function DonationsPage() {
  return (
    <AuthGuard redirectUrl="/dashboard/donations">
      <AppProvider>
        <DonationsView />
      </AppProvider>
    </AuthGuard>
  );
}
