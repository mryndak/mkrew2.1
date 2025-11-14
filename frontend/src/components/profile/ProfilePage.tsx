import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ProfileView } from './ProfileView';

/**
 * ProfilePage - Wrapper combining AuthGuard, Redux Provider, and ProfileView
 */
export function ProfilePage() {
  return (
    <AuthGuard redirectUrl="/dashboard/profile">
      <Provider store={store}>
        <ProfileView />
      </Provider>
    </AuthGuard>
  );
}
