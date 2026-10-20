import React from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { useAuth } from "@/lib/AuthContext";
import { useNavigate } from "react-router-dom";
import RequireLogin from "@/components/RequireLogin";
import AdminOnly from "@/components/AdminOnly";

export default function Base44Router() {
  const { isLoadingAuth, isAuthenticated, authChecked } = useAuth();
  const navigate = useNavigate();

  if (isLoadingAuth && !authChecked) {
    return null;
  }

  if (!isAuthenticated && authChecked) {
    setTimeout(() => {
      const base44 = window.base44;
      if (base44?.auth?.redirectToLogin) {
        base44.auth.redirectToLogin(window.location.href);
      } else {
        navigate("/login");
      }
    }, 100);
    return <Navigate to="/login" replace />;
  }

  return (
    <Routes>
      <Route path="/" />
      <Route path="discover" />
      <Route path="categories" />
      <Route path="search" />
      <Route path="about" />
      <Route path="login" />
      <Route path="register" />
      <Route path="cart" />
      <Route path="profile" />
      <Route path="wishlist" />
      <Route path="checkout" />
      <Route element={<RequireLogin />}>
        <Route path="orders" />
        <Route path="support" />
      </Route>
      <Route element={<AdminOnly />}>
        <Route path="admin" />
      </Route>
      <Route path="*" />
    </Routes>
  );
}