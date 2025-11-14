import { Provider } from 'react-redux';
import { store } from '@/lib/store';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { FavoritesView } from './FavoritesView';

/**
 * FavoritesPage - Wrapper combining AuthGuard, Redux Provider, and FavoritesView
 */
export function FavoritesPage() {
  return (
    <AuthGuard redirectUrl="/dashboard/favorites">
      <Provider store={store}>
        <FavoritesView />
      </Provider>
    </AuthGuard>
  );
}
