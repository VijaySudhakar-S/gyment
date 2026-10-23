import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Super Admin Login',
  description: 'Sign in to GYMENT Super Admin Console',
};

export default function SuperAdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
