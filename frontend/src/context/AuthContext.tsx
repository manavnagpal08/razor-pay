"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signOut,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: FirebaseUser | null;
  token: string | null;
  role: "customer" | "merchant" | null;
  merchantId: string;
  cartCount: number;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, role: string, name: string) => Promise<void>;
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
  logout: async () => {},
  refreshCartCount: async () => {},
  setMerchantId: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [role, setRole] = useState<"customer" | "merchant" | null>(null);
  const [merchantId, setMerchantId] = useState<string>("demo_merchant");
  const [cartCount, setCartCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchCartCount = async (jwtToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
    const savedRole = (typeof window !== "undefined" ? localStorage.getItem("user_role") : null) as "customer" | "merchant" | null;
    if (savedRole) setRole(savedRole);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);
          if (typeof window !== "undefined") {
            localStorage.setItem("token", idToken);
          }
          
          // Auto-sync with backend
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
          const currentRole = savedRole || "customer";
          const res = await fetch(`${apiUrl}/api/auth/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              firebase_token: idToken,
              role: currentRole,
              name: currentUser.displayName || currentUser.email?.split("@")[0] || "User"
            })
          });
          if (res.ok) {
            const data = await res.json();
            if (data.role) {
              setRole(data.role);
              if (typeof window !== "undefined") {
                localStorage.setItem("user_role", data.role);
              }
            }
          }
          
          if (currentRole === "customer") {
            await fetchCartCount(idToken);
          }
        } catch (err) {
          console.error("Error setting up auth token:", err);
        }
      } else {
        setToken(null);
        setRole(null);
        setCartCount(0);
        if (typeof window !== "undefined") {
          localStorage.removeItem("token");
          localStorage.removeItem("user_role");
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, pass);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", idToken);
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/auth/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_token: idToken,
        role: "customer",
        name: cred.user.displayName || cred.user.email?.split("@")[0] || "Customer"
      })
    });
    if (res.ok) {
      const data = await res.json();
      setRole(data.role || "customer");
      if (typeof window !== "undefined") {
        localStorage.setItem("user_role", data.role || "customer");
      }
    }
  };

  const register = async (email: string, pass: string, userRole: string, name: string) => {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    const idToken = await cred.user.getIdToken();
    setToken(idToken);
    if (typeof window !== "undefined") {
      localStorage.setItem("token", idToken);
    }
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
    const res = await fetch(`${apiUrl}/api/auth/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firebase_token: idToken,
        role: userRole,
        name: name || email.split("@")[0]
      })
    });
    if (res.ok) {
      const data = await res.json();
      setRole(data.role || (userRole as "customer" | "merchant"));
      if (typeof window !== "undefined") {
        localStorage.setItem("user_role", data.role || userRole);
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setToken(null);
    setRole(null);
    setCartCount(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
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
      logout,
      refreshCartCount,
      setMerchantId,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);