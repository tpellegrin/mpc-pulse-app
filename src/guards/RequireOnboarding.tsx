import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/useAuth';
import { paths } from '../globals/paths';

export default function RequireOnboarding({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, needsOnboarding } = useAuth();
  if (!isAuthenticated) return <Navigate to={paths.signIn} replace />;
  if (!needsOnboarding) return <Navigate to={paths.dashboard} replace />;
  return <>{children}</>;
}
