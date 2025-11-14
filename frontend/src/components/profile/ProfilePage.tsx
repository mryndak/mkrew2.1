import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProvider } from '@/components/common/AppProvider';
import { ProfileView } from './ProfileView';

/**
 * ProfilePage - Wrapper combining AuthGuard, AppProvider, and ProfileView
 */
export function ProfilePage() {
  return (
    <AuthGuard redirectUrl="/dashboard/profile">
      <AppProvider>
        <ProfileView />
      </AppProvider>
    </AuthGuard>
  );
}
