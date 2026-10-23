import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Gym Staff Login',
  description: 'Sign in to GYMENT Gym Management & Staff Portal',
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
