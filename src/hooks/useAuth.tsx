
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import balanceManager from '@/utils/balance/balanceManager';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{
    error: Error | null;
    data: Session | null;
  }>;
  signUp: (email: string, password: string, metadata?: any) => Promise<{
    error: Error | null;
    data: any;
  }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up listener for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // When user signs in, sync their balance data
      if (event === 'SIGNED_IN' && newSession?.user) {
        const userId = newSession.user.id;
        
        // Try to load user balance from database after a short delay
        setTimeout(async () => {
          try {
            const { data, error } = await supabase
              .from('user_balances')
              .select('balance')
              .eq('id', userId)
              .maybeSingle();
              
            if (!error && data && typeof data.balance === 'number') {
              // Sync with balance manager to ensure we're using highest balance
              balanceManager.syncOnAuth(userId, data.balance);
              
              // Store userId in localStorage for future reference
              localStorage.setItem('userId', userId);
              
              console.log(`Auth: Synced balance data for user ${userId}: ${data.balance}`);
            } else {
              console.log(`Auth: No balance data found for user ${userId}`);
            }
          } catch (err) {
            console.error("Error loading balance on auth:", err);
          }
        }, 500);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If user is logged in, sync their balance
      if (session?.user) {
        const userId = session.user.id;
        localStorage.setItem('userId', userId);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      return { data: data.session, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });
      
      return { data, error };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  };

  const signOut = async () => {
    // Before signing out, store the current balance to ensure it's preserved
    if (user) {
      const currentBalance = balanceManager.getCurrentBalance();
      const highestBalance = balanceManager.getHighestBalance();
      const effectiveBalance = Math.max(currentBalance, highestBalance);
      
      localStorage.setItem(`lastKnownBalance_${user.id}`, effectiveBalance.toString());
      
      // Try to update the database with the latest balance before logout
      try {
        await supabase
          .from('user_balances')
          .update({ balance: effectiveBalance })
          .eq('id', user.id);
          
        console.log(`Updated database balance before logout: ${effectiveBalance}€`);
      } catch (err) {
        console.error("Error updating balance before logout:", err);
      }
    }
    
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
