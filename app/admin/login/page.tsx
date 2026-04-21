import AdminLoginForm from '@/components/AdminLoginForm';
import { hasAdminPasswordConfigured } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export default function AdminLoginPage() {
  return <AdminLoginForm passwordConfigured={hasAdminPasswordConfigured()} />;
}
