import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { NotificationsView } from './NotificationsView';

/**
 * NotificationsPage - Wrapper combining AuthGuard, Redux Provider, and NotificationsView
 */
export function NotificationsPage() {
  return (
    <AuthGuard redirectUrl="/dashboard/notifications">
      <Provider store={store}>
        <NotificationsView />
      </Provider>
    </AuthGuard>
  );
}
