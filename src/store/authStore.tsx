import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { User, onAuthStateChanged } from "firebase/auth";
import { firebaseAuth } from "../services/firebase";
import { ApiUser } from "../types";
import { getUserByFirebaseUid, getUserByPhone } from "../services/userService";

export type UserRole = "customer" | "worker";

export type AuthState = {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  hasProfile: boolean;
  role: UserRole;
  dbUserId: string | null;
  user: User | null;
  setRole: (role: UserRole) => Promise<void>;
  completeProfile: (profile: ApiUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const ROLE_KEY = "taskero_role";
const USER_ID_KEY = "taskero_db_user_id";

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setAuthLoading] = useState(true);
  const [role, setRoleState] = useState<UserRole>("customer");
  const [dbUserId, setDbUserId] = useState<string | null>(null);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    const bootstrap = async () => {
      const storedRole = await AsyncStorage.getItem(ROLE_KEY);
      if (storedRole === "customer" || storedRole === "worker") {
        setRoleState(storedRole);
      }
      const storedUserId = await AsyncStorage.getItem(USER_ID_KEY);
      if (storedUserId) {
        setDbUserId(storedUserId);
      }
    };
    bootstrap().catch(() => undefined);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (nextUser) => {
      setUser(nextUser);
      if (!nextUser) {
        setHasProfile(false);
        setDbUserId(null);
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await lookupUserProfile(nextUser);
        if (profile) {
          await applyProfile(profile);
        } else {
          setHasProfile(false);
        }
      } catch {
        setHasProfile(false);
      } finally {
        setAuthLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const applyProfile = async (profile: ApiUser) => {
    setHasProfile(true);
    if (profile.role === "customer" || profile.role === "worker") {
      setRoleState(profile.role);
      await AsyncStorage.setItem(ROLE_KEY, profile.role);
    }
    if (profile.id) {
      setDbUserId(profile.id);
      await AsyncStorage.setItem(USER_ID_KEY, profile.id);
    }
  };

  const setRole = async (nextRole: UserRole) => {
    setRoleState(nextRole);
    await AsyncStorage.setItem(ROLE_KEY, nextRole);
  };

  const completeProfile = async (profile: ApiUser) => {
    await applyProfile(profile);
  };

  const signOut = async () => {
    await firebaseAuth.signOut();
    await AsyncStorage.multiRemove([ROLE_KEY, USER_ID_KEY]);
    setHasProfile(false);
    setDbUserId(null);
  };

  const value = useMemo(
    () => ({
      isAuthenticated: !!user,
      isAuthLoading,
      hasProfile,
      role,
      dbUserId,
      user,
      setRole,
      completeProfile,
      signOut,
    }),
    [user, isAuthLoading, hasProfile, role, dbUserId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

async function lookupUserProfile(nextUser: User) {
  if (nextUser.phoneNumber) {
    try {
      return await getUserByPhone(nextUser.phoneNumber);
    } catch {
      return null;
    }
  }

  try {
    return await getUserByFirebaseUid(nextUser.uid);
  } catch {
    return null;
  }
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
