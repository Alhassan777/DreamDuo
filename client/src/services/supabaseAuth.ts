import { supabase, isSupabaseConfigured } from '../config/supabase';
import api from './api';
import { Provider } from '@supabase/supabase-js';

export interface OAuthProvider {
  name: string;
  displayName: string;
  icon: string;
  provider: Provider;
}

// Available OAuth providers
export const oauthProviders: OAuthProvider[] = [
  {
    name: 'google',
    displayName: 'Google',
    icon: '🌐',
    provider: 'google' as Provider
  },
  {
    name: 'github',
    displayName: 'GitHub',
    icon: '🐙',
    provider: 'github' as Provider
  },
  {
    name: 'facebook',
    displayName: 'Facebook',
    icon: '📘',
    provider: 'facebook' as Provider
  }
];

class SupabaseAuthService {
  /**
   * Sign in with OAuth provider
   */
  async signInWithOAuth(provider: Provider) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.');
    }

    try {
      // Build redirect URL - use current origin (works for both dev and production)
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      // Debug logging
      console.log('🔐 OAuth Configuration:', {
        provider,
        redirectUrl,
        currentOrigin: window.location.origin,
        currentPath: window.location.pathname,
        supabaseUrl: import.meta.env.VITE_SUPABASE_URL
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('OAuth error from Supabase:', error);
        throw error;
      }
      
      console.log('OAuth redirect initiated:', data.url);
      return data;
    } catch (error) {
      console.error(`OAuth sign in with ${provider} failed:`, error);
      throw error;
    }
  }

  /**
   * Handle OAuth callback and sync with backend
   */
  async handleOAuthCallback() {
    if (!isSupabaseConfigured()) {
      return { error: 'Supabase is not configured' };
    }

    try {
      // Wait a moment for Supabase to process the URL hash
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get session from Supabase (automatically handles URL hash for PKCE flow)
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Supabase session error:', error);
        throw new Error(error.message || 'Failed to get session from Supabase');
      }
      
      if (!session || !session.user) {
        console.error('No session found after OAuth callback');
        return { error: 'No session found. The OAuth authentication may have failed at the provider level.' };
      }
      
      console.log('Session obtained successfully:', session.user.email);

      // Get provider from user metadata
      const provider = session.user.app_metadata?.provider || 
                      session.user.user_metadata?.provider || 
                      'unknown';

      // Send user data to our backend to sync/create user
      const response = await api.post('/auth/oauth/callback', {
        user: {
          id: session.user.id,
          email: session.user.email,
          user_metadata: session.user.user_metadata,
          app_metadata: session.user.app_metadata
        },
        provider: provider,
        access_token: session.access_token
      });

      return { data: response.data, error: null };
    } catch (error: any) {
      console.error('OAuth callback handling failed:', error);
      return { error: error.message || 'OAuth callback failed' };
    }
  }

  /**
   * Sign out from Supabase
   */
  async signOut() {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
  }

  /**
   * Get current Supabase session
   */
  async getSession() {
    if (!isSupabaseConfigured()) {
      return null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    return session;
  }
}

export const supabaseAuth = new SupabaseAuthService();

