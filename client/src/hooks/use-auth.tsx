import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define the user type based on the schema
interface User {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: "admin" | "assessor" | "student";
  assessorId?: number;
  studentId?: number;
  schoolIds?: number[];
  classId?: number;
  school?: {
    id: number;
    name: string;
  };
  class?: {
    id: number;
    name: string;
  };
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/status', {
          credentials: 'include'
        });
        const data = await res.json();
        
        if (data.authenticated && data.user) {
          setUser(data.user);
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await res.json();
      
      // Get extended user info with role-specific data
      const userRes = await fetch('/api/user', {
        credentials: 'include'
      });
      
      if (!userRes.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userRes.json();
      
      setUser(userData);
      setIsAuthenticated(true);
      setLoading(false);
      
      // Show success toast
      toast({
        title: "Login successful",
        description: `Welcome back, ${userData.fullName}`,
      });
      
      return true;
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'Login failed. Please check your credentials.');
      setUser(null);
      setIsAuthenticated(false);
      setLoading(false);
      
      // Show error toast
      toast({
        title: "Login failed",
        description: err instanceof Error ? err.message : 'Please check your credentials',
        variant: "destructive",
      });
      
      return false;
    }
  };

  // Logout function
  const logout = async (): Promise<void> => {
    try {
      await apiRequest('POST', '/api/auth/logout', {});
      setUser(null);
      setIsAuthenticated(false);
      
      // Show success toast
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
    } catch (err) {
      console.error('Logout error:', err);
      
      // Show error toast
      toast({
        title: "Logout error",
        description: "There was a problem logging out",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, error, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
