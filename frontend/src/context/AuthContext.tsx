"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface UserProfile {
  uid?: string;
  id?: string;
  email: string;
  displayName: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  role: "customer" | "merchant" | null;
  merchantId: string;
  cartCount: number;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, role: string, name: string) => Promise<void>;
  loginWithGoogle: (role?: "customer" | "merchant") => Promise<void>;
  loginWithGoogleEmail: (email: string, name?: string, userRole?: "customer" | "merchant") => Promise<void>;
  logout: () => Promise<void>;
  refreshCartCount: () => Promise<void>;
  setMerchantId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  role: null,
  merchantId: "demo_merchant",
  cartCount: 0,
  loading: true,
  login: async () => {},
  register: async () => {},
  loginWithGoogle: async () => {},
  loginWithGoogleEmail: async () => {},
  logout: async () => {},
  refreshCartCount: async () => {},
  setMerchantId: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<"customer" | "merchant" | null>(null);
  const [merchantId, setMerchantId] = useState<string>("demo_merchant");
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const getApiUrl = () => {
    return (process.env.NEXT_PUBLIC_API_URL || "https://razorpay-commerce-backend.onrender.com").replace(/\/$/, "");
  };

  const fetchCartCount = async (jwtToken: string) => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cart/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${jwtToken}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const cart = await res.json();
        const count = cart.items ? cart.items.reduce((acc: number, item: any) => acc + item.quantity, 0) : 0;
        setCartCount(count);
      }
    } catch (e) {
      console.warn("Failed to fetch cart count", e);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedToken = localStorage.getItem("token");
      const savedEmail = localStorage.getItem("user_email");
      const savedName = localStorage.getItem("user_name");
      const savedRole = localStorage.getItem("user_role") as "customer" | "merchant" | null;

      if (savedToken && savedEmail) {
        const savedUserId = localStorage.getItem("user_id") || savedEmail;
        setToken(savedToken);
        setRole(savedRole || "merchant");
        setUser({ 
          uid: savedUserId,
          email: savedEmail, 
          displayName: savedName || savedEmail.split("@")[0] 
        });
        fetchCartCount(savedToken);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const apiUrl = getApiUrl();
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass })
      });
    } catch (netErr: any) {
      throw new Error("Server is waking up from sleep mode. Please wait 15 seconds and try again.");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Invalid email or password");
    }

    const jwtToken = data.access_token;
    const userRole = data.role as "customer" | "merchant";
    const userName = data.name || email.split("@")[0];
    const userId = data.user_id || data.merchant_id || email;

    setToken(jwtToken);
    setRole(userRole);
    setUser({ uid: userId, email, displayName: userName });

    if (typeof window !== "undefined") {
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user_id", userId);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", userName);
      localStorage.setItem("user_role", userRole);
    }

    await fetchCartCount(jwtToken);
  };

  const register = async (email: string, pass: string, userRole: string, name: string) => {
    const apiUrl = getApiUrl();
    let res: Response;
    try {
      res = await fetch(`${apiUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password: pass,
          role: userRole,
          name: name || email.split("@")[0]
        })
      });
    } catch (netErr: any) {
      throw new Error("Server is waking up from sleep mode. Please wait 15 seconds and try again.");
    }

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || "Registration failed. Email may already be registered.");
    }

    const jwtToken = data.access_token;
    const assignedRole = data.role || (userRole as "customer" | "merchant");
    const assignedName = data.name || name || email.split("@")[0];
    const userId = data.user_id || data.merchant_id || email;

    setToken(jwtToken);
    setRole(assignedRole);
    setUser({ uid: userId, email, displayName: assignedName });

    if (typeof window !== "undefined") {
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user_id", userId);
      localStorage.setItem("user_email", email);
      localStorage.setItem("user_name", assignedName);
      localStorage.setItem("user_role", assignedRole);
    }

    await fetchCartCount(jwtToken);
  };

  const loginWithGoogle = async (userRole: "customer" | "merchant" = "merchant") => {
    try {
      const { signInWithPopup } = await import("firebase/auth");
      const { auth, googleProvider } = await import("@/lib/firebase");
      
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;
      if (!googleUser || !googleUser.email) {
        throw new Error("No Google email received from Firebase authentication.");
      }

      const googleEmail = googleUser.email;
      const googleName = googleUser.displayName || googleEmail.split("@")[0];

      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail,
          name: googleName,
          role: userRole
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || "Failed to authenticate with Google");
      }

      const data = await res.json();
      const jwtToken = data.access_token;
      const assignedRole = (data.role as "customer" | "merchant") || userRole;
      const assignedName = data.name || googleName;
      const userId = data.user_id || data.merchant_id || googleEmail;

      setToken(jwtToken);
      setRole(assignedRole);
      setUser({ uid: userId, email: googleEmail, displayName: assignedName });

      if (typeof window !== "undefined") {
        localStorage.setItem("token", jwtToken);
        localStorage.setItem("user_id", userId);
        localStorage.setItem("user_email", googleEmail);
        localStorage.setItem("user_name", assignedName);
        localStorage.setItem("user_role", assignedRole);
      }

      await fetchCartCount(jwtToken);
    } catch (err: any) {
      if (err.code === "auth/operation-not-allowed") {
        throw new Error("Google Sign-In is not toggled ON in your Firebase Console yet. Please sign in with your merchant email/password or toggle Google Provider ON in Firebase Console > Authentication > Sign-in method.");
      }
      throw err;
    }
  };

  const loginWithGoogleEmail = async (
    email: string,
    name: string = "Google User",
    userRole: "customer" | "merchant" = "customer"
  ) => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes("@")) {
      throw new Error("Please provide a valid Google email address.");
    }

    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        name: name.trim() || cleanEmail.split("@")[0],
        role: userRole
      })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.detail || "Failed to authenticate with Google.");
    }

    const data = await res.json();
    const jwtToken = data.access_token;
    const assignedRole = (data.role as "customer" | "merchant") || userRole;
    const assignedName = data.name || cleanEmail.split("@")[0];

    setToken(jwtToken);
    setRole(assignedRole);
    setUser({ uid: jwtToken, email: cleanEmail, displayName: assignedName });

    if (typeof window !== "undefined") {
      localStorage.setItem("token", jwtToken);
      localStorage.setItem("user_email", cleanEmail);
      localStorage.setItem("user_name", assignedName);
      localStorage.setItem("user_role", assignedRole);
    }

    await fetchCartCount(jwtToken);
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    setRole(null);
    setCartCount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user_email");
      localStorage.removeItem("user_name");
      localStorage.removeItem("user_role");
    }
  };

  const refreshCartCount = async () => {
    if (token) {
      await fetchCartCount(token);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      token,
      role,
      merchantId,
      cartCount,
      loading,
      login,
      register,
      loginWithGoogle,
      loginWithGoogleEmail,
      logout,
      refreshCartCount,
      setMerchantId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);