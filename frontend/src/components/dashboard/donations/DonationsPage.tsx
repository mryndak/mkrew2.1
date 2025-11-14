import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DonationsView } from './DonationsView';

/**
 * DonationsPage - Wrapper combining AuthGuard, Redux Provider, and DonationsView
 */
export function DonationsPage() {
  return (
    <AuthGuard redirectUrl="/dashboard/donations">
      <Provider store={store}>
        <DonationsView />
      </Provider>
    </AuthGuard>
  );
}
