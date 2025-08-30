import { writable } from 'svelte/store';

// Accounts store structure
const createAccountsStore = () => {
  const { subscribe, set, update } = writable({
    accounts: {
      spotify: {
        access_token: null,
        refresh_token: null,
        expires_at: null,
        user: null,
        is_authenticated: false
      }
      // Future OAuth providers can be added here:
      // github: { ... },
      // google: { ... },
      // etc.
    }
  });

  // Helper functions for account management
  const accounts = {
    // Check if an account type is authenticated
    isAuthenticated(provider) {
      let currentState;
      subscribe(state => currentState = state)();
      return currentState.accounts[provider]?.is_authenticated || false;
    },

    // Check if an account has a valid token
    hasValidToken(provider) {
      let currentState;
      subscribe(state => currentState = state)();
      const account = currentState.accounts[provider];
      
      if (!account?.access_token) return false;
      
      // Check if token is expired
      if (account.expires_at && Date.now() >= account.expires_at) {
        // Token expired, mark as not authenticated
        this.updateAccount(provider, { is_authenticated: false });
        return false;
      }
      
      return true;
    },

    // Get account data for a provider
    getAccount(provider) {
      let currentState;
      subscribe(state => currentState = state)();
      return currentState.accounts[provider] || null;
    },

    // Get access token for a provider
    getAccessToken(provider) {
      let currentState;
      subscribe(state => currentState = state)();
      const account = currentState.accounts[provider];
      
      if (!account?.access_token) return null;
      
      // Check if token is expired
      if (account.expires_at && Date.now() >= account.expires_at) {
        // Token expired, mark as not authenticated
        this.updateAccount(provider, { is_authenticated: false });
        return null;
      }
      
      return account.access_token;
    },

    // Update account data for a provider
    updateAccount(provider, updates) {
      update(state => {
        if (!state.accounts[provider]) {
          state.accounts[provider] = {};
        }
        
        state.accounts[provider] = {
          ...state.accounts[provider],
          ...updates
        };
        
        return state;
      });
    },

    // Set authentication data for a provider
    setAuth(provider, authData) {
      const updates = {
        access_token: authData.access_token,
        expires_at: authData.expires_at || (Date.now() + (authData.expires_in || 3600) * 1000),
        is_authenticated: true
      };
      
      if (authData.refresh_token) {
        updates.refresh_token = authData.refresh_token;
      }
      
      this.updateAccount(provider, updates);
    },

    // Set user data for a provider
    setUser(provider, userData) {
      this.updateAccount(provider, {
        user: userData
      });
    },

    // Logout from a provider
    logout(provider) {
      this.updateAccount(provider, {
        access_token: null,
        refresh_token: null,
        expires_at: null,
        user: null,
        is_authenticated: false
      });
    },

    // Logout from all providers
    logoutAll() {
      set({
        accounts: {
          spotify: {
            access_token: null,
            refresh_token: null,
            expires_at: null,
            user: null,
            is_authenticated: false
          }
        }
      });
    },

    // Check if any account is authenticated
    hasAnyAuthenticated() {
      let currentState;
      subscribe(state => currentState = state)();
      
      return Object.values(currentState.accounts).some(
        account => account.is_authenticated
      );
    },

    // Get all authenticated providers
    getAuthenticatedProviders() {
      let currentState;
      subscribe(state => currentState = state)();
      
      return Object.entries(currentState.accounts)
        .filter(([_, account]) => account.is_authenticated)
        .map(([provider, _]) => provider);
    },

    // Initialize accounts from localStorage
    initFromStorage() {
      if (typeof window === 'undefined') return;
      
      try {
        // Load Spotify account data
        const spotifyToken = localStorage.getItem('spotify_access_token');
        const spotifyExpires = localStorage.getItem('spotify_expires_at');
        const spotifyRefresh = localStorage.getItem('spotify_refresh_token');
        const spotifyUser = localStorage.getItem('spotify_user');
        
        if (spotifyToken && spotifyExpires) {
          const expiresAt = parseInt(spotifyExpires);
          
          // Check if token is still valid
          if (Date.now() < expiresAt) {
            this.updateAccount('spotify', {
              access_token: spotifyToken,
              expires_at: expiresAt,
              refresh_token: spotifyRefresh,
              user: spotifyUser ? JSON.parse(spotifyUser) : null,
              is_authenticated: true
            });
          } else {
            // Token expired, clean up localStorage
            this.cleanupStorage('spotify');
          }
        }
      } catch (error) {
        console.error('Error initializing accounts from storage:', error);
        this.cleanupStorage('spotify');
      }
    },

    // Save account data to localStorage
    saveToStorage(provider) {
      if (typeof window === 'undefined') return;
      
      try {
        const account = this.getAccount(provider);
        
        if (account?.access_token) {
          localStorage.setItem(`${provider}_access_token`, account.access_token);
          localStorage.setItem(`${provider}_expires_at`, account.expires_at?.toString() || '');
          
          if (account.refresh_token) {
            localStorage.setItem(`${provider}_refresh_token`, account.refresh_token);
          }
          
          if (account.user) {
            localStorage.setItem(`${provider}_user`, JSON.stringify(account.user));
          }
        }
      } catch (error) {
        console.error(`Error saving ${provider} account to storage:`, error);
      }
    },

    // Clean up localStorage for a provider
    cleanupStorage(provider) {
      if (typeof window === 'undefined') return;
      
      try {
        localStorage.removeItem(`${provider}_access_token`);
        localStorage.removeItem(`${provider}_expires_at`);
        localStorage.removeItem(`${provider}_refresh_token`);
        localStorage.removeItem(`${provider}_user`);
      } catch (error) {
        console.error(`Error cleaning up ${provider} storage:`, error);
      }
    },

    // Refresh token for a provider (if supported)
    async refreshToken(provider) {
      const account = this.getAccount(provider);
      
      if (!account?.refresh_token) {
        throw new Error(`No refresh token available for ${provider}`);
      }
      
      // This would be implemented per provider
      // For now, just return false
      return false;
    }
  };

  return {
    subscribe,
    ...accounts
  };
};

// Create and export the accounts store
export const accountsStore = createAccountsStore();

// Initialize from localStorage on store creation
if (typeof window !== 'undefined') {
  accountsStore.initFromStorage();
}
