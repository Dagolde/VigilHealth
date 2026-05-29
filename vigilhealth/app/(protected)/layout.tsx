import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { UserNav } from '@/components/layout/UserNav';

export const dynamic = 'force-dynamic';

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <UserNav />
        <div className="mx-auto max-w-7xl px-4 py-6">
          {children}
        </div>
      </div>
    </ProtectedRoute>
  );
}
