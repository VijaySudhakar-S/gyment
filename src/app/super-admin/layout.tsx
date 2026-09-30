'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/super-admin/sidebar/Sidebar';
import { MobileBottomNav } from '@/components/super-admin/shared/MobileBottomNav';

import { tokenStorage } from '@/lib/auth/tokenStorage';
import { getSuperAdminProfile } from '@/lib/api/superadmin/auth.api';
import { SuperAdminSkeleton } from '@/components/super-admin/shared/SuperAdminSkeleton';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      const token = tokenStorage.getToken();

      if (!token) {
        if (isMounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          router.replace('/login');
        }
        return;
      }

      try {
        // Validate token against backend /api/v1/superadmin/auth/user-details
        const profile = await getSuperAdminProfile();
        if (isMounted) {
          tokenStorage.setUser(profile);
          setIsAuthenticated(true);
          setIsLoading(false);
        }
      } catch (err) {
        // Invalid or expired token
        if (isMounted) {
          tokenStorage.clearSession();
          setIsAuthenticated(false);
          setIsLoading(false);
          router.replace('/login');
        }
      }
    };

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [router]);

  if (isLoading) {
    return <SuperAdminSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-gyment-bg text-gyment-text">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {children}

        <MobileBottomNav />
      </div>


    </div>
  );
}
