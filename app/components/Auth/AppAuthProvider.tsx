"use client";

import {
  onIdTokenChanged,
  signInWithEmailAndPassword,
  signOut,
  User,
} from "firebase/auth";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth } from "app/firebase/firebase";
import { UserProfile } from "@/lib/types";

type RegisterPayload = {
  email: string;
  password: string;
  displayName: string;
};

type AppAuthContextValue = {
  firebaseUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  error: string;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<UserProfile | null>;
  authenticatedFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
};

const AppAuthContext = createContext<AppAuthContextValue | null>(null);

const readResponseError = async (response: Response) => {
  const payload = await response.json().catch(() => null);
  return payload?.error || "Request failed.";
};

const mapFirebaseError = (error: unknown) => {
  const code = (error as { code?: string })?.code || "";

  if (code.includes("invalid-credential")) {
    return "Invalid email or password.";
  }

  if (code.includes("too-many-requests")) {
    return "Too many attempts. Try again later.";
  }

  if (code.includes("user-disabled")) {
    return "This account is disabled.";
  }

  return (error as Error)?.message || "Authentication failed.";
};

export const AppAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const authenticatedFetch = async (
    input: RequestInfo | URL,
    init?: RequestInit
  ) => {
    if (!auth) {
      throw new Error("Firebase client configuration is missing.");
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error("You need to sign in first.");
    }

    const token = await currentUser.getIdToken();
    const headers = new Headers(init?.headers || {});

    headers.set("Authorization", `Bearer ${token}`);
    if (init?.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    return fetch(input, {
      ...init,
      headers,
      cache: "no-store",
    });
  };

  const refreshProfile = async () => {
    if (!auth) {
      setProfile(null);
      return null;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
      setProfile(null);
      return null;
    }

    const response = await authenticatedFetch("/api/account");
    if (!response.ok) {
      const message = await readResponseError(response);
      await signOut(auth);
      setProfile(null);
      setError(message);
      throw new Error(message);
    }

    const payload = await response.json();
    setProfile(payload.profile);
    setError("");
    return payload.profile as UserProfile;
  };

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase client configuration is missing.");
    }

    setIsLoading(true);
    setError("");

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      await refreshProfile();
    } catch (error) {
      const message = mapFirebaseError(error);
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    if (!auth) {
      throw new Error("Firebase client configuration is missing.");
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await readResponseError(response));
      }

      await signInWithEmailAndPassword(auth, payload.email.trim(), payload.password);
      await refreshProfile();
    } catch (error) {
      const message = (error as Error)?.message || "Registration failed.";
      setError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    if (!auth) {
      return;
    }

    await signOut(auth);
    setProfile(null);
    setFirebaseUser(null);
  };

  useEffect(() => {
    if (!auth) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        await refreshProfile();
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      isLoading,
      error,
      login,
      register,
      logout,
      refreshProfile,
      authenticatedFetch,
    }),
    [firebaseUser, profile, isLoading, error]
  );

  return <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>;
};

export const useAppAuth = () => {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within AppAuthProvider.");
  }

  return context;
};
