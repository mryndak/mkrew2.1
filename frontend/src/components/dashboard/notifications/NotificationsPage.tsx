import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProvider } from '@/components/common/AppProvider';
import { NotificationsView } from './NotificationsView';

/**
 * NotificationsPage - Wrapper combining AuthGuard, AppProvider, and NotificationsView
 */
export function NotificationsPage() {
  return (
    <AuthGuard redirectUrl="/dashboard/notifications">
      <AppProvider>
        <NotificationsView />
      </AppProvider>
    </AuthGuard>
  );
}
