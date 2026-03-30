"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { UserType } from '@/types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
  requiredPermissions?: string[];
}

export function ProtectedRoute({ 
  children, 
  allowedRoles, 
  requiredPermissions 
}: ProtectedRouteProps) {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, hasRole, hasPermission } = useAuthStore();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }
    
    if (!isLoading && isAuthenticated && user) {
      // Check role-based access
      if (allowedRoles && !hasRole(allowedRoles)) {
        router.push('/unauthorized');
        return;
      }
      
      // Check permission-based access
      if (requiredPermissions) {
        const hasAllPermissions = requiredPermissions.every(permission => 
          hasPermission(permission)
        );
        
        if (!hasAllPermissions) {
          router.push('/unauthorized');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, requiredPermissions, router, hasRole, hasPermission]);
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated || !user) {
    return null;
  }
  
  return <>{children}</>;
}