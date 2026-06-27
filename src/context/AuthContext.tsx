import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  bio?: string;
  timezone?: string;
  avatarUrl?: string | null;
  occupation?: string;
  weeklyFocusTarget?: number;
  dailyTaskTarget?: number;
  aiCoachTone?: string;
  hasGoogleCalendar?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password?: string) => Promise<User>;
  signup: (name: string, email: string, password?: string) => Promise<User>;
  loginWithGoogle: (credential: string) => Promise<User>;
  loginWithGitHub: () => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (updatedUser: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on application load
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('novalife_token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          localStorage.removeItem('novalife_token');
          setUser(null);
        }
      } catch (err) {
        console.error('Session restore failed:', err);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (email: string, password = 'dummy_password') => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed.');
    }

    localStorage.setItem('novalife_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const signup = async (name: string, email: string, password = 'dummy_password') => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed.');
    }

    localStorage.setItem('novalife_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithGoogle = async (credential: string) => {
    const response = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Google Sign-In failed.');
    }

    localStorage.setItem('novalife_token', data.token);
    setUser(data.user);
    return data.user;
  };

  const loginWithGitHub = async () => {
    // Basic mock session for GitHub login, can be integrated similarly later
    const mockUser: User = {
      uid: 'github_user',
      email: 'nidhi.git@github.com',
      displayName: 'GitHub User',
      bio: 'GitHub Developer',
      timezone: 'Asia/Kolkata (IST)'
    };
    setUser(mockUser);
    return mockUser;
  };

  const logout = async () => {
    localStorage.removeItem('novalife_token');
    setUser(null);
  };

  const updateUser = (updatedUser: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...updatedUser } : null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, loginWithGoogle, loginWithGitHub, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
