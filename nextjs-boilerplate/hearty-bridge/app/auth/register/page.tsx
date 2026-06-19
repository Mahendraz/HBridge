import { redirect } from 'next/navigation';

// Self-registration is disabled. Accounts are managed by admins.
export default function RegisterPage() {
  redirect('/auth/login');
}
