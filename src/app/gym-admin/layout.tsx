import type { Metadata } from 'next';
import { GymAdminLayoutClient } from './GymAdminLayoutClient';

export const metadata: Metadata = {
  title: 'Owner Dashboard',
  description: 'GYMENT — Gym Owner and Staff Operations Dashboard',
};

export default function GymAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <GymAdminLayoutClient>{children}</GymAdminLayoutClient>;
}
