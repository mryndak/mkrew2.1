import { AuthGuard } from '@/components/auth/AuthGuard';
import { AppProvider } from '@/components/common/AppProvider';
import { FavoritesView } from './FavoritesView';

/**
 * FavoritesPage - Wrapper combining AuthGuard, AppProvider, and FavoritesView
 */
export function FavoritesPage() {
  return (
    <AuthGuard redirectUrl="/dashboard/favorites">
      <AppProvider>
        <FavoritesView />
      </AppProvider>
    </AuthGuard>
  );
}
