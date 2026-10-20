import React, { useEffect, useState } from 'react';
import { Navigate, useLocation, Routes, Route } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

/**
 * Base44-aware router wrapper.
 * - Uses base44 auth state to protect routes
 * - Redirects unauthenticated users to base44 login
 * - Preserves return-to URL for post-login redirect
 */
export default function Base44Router() {
  const { isLoadingAuth, isAuthenticated, authChecked, navigateToLogin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // When auth is loading, render nothing (let the AuthProvider handle loading)
  if (isLoadingAuth && !authChecked) {
    return null;
  }

  // If auth checked and not authenticated, redirect to base44 login
  if (!isAuthenticated && authChecked) {
    setTimeout(() => {
      navigateToLogin(window.location.href);
    }, 100);
    return <Navigate to="/login" replace />;
  }

  // If authenticated, render the normal routes
  return (
    <Routes>
      {/* Public pages */}
      <Route path="/" element={<></>} />
      <Route path="/discover" element={<></>} />
      <Route path="/categories" element={<></>} />
      <Route path="/search" element={<></>} />
      <Route path="/about" element={<></>} />
      <Route path="/login" element={<></>} />
      <Route path="/register" element={<></>} />
      <Route path="/cart" element={<></>} />
      <Route path="/profile" element={<></>} />
      <Route path="/wishlist" element={<></>} />
      <Route path="/checkout" element={<></>} />

      {/* Protected routes wrapped with RequireLogin */}
      <Route element={<RequireLogin />}>
        <Route path="/profile" element={<></>} />
        <Route path="/orders" element={<></>} />
        <Route path="/support" element={<></>} />
      </Route>

      {/* Admin routes */}
      <Route element={<AdminOnly />}>
        <Route path="/admin" element={<></>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<></>} />
    </Routes>
  );
}
