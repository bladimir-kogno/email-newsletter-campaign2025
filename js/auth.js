// Authentication Module using Clerk
class AuthManager {
    constructor() {
        this.user = null;
        this.isLoading = true;
        this.clerk = null;
        this.callbacks = {
            onUserChange: [],
            onLoadingChange: []
        };
        this.isProductionMode = window.location.hostname !== 'localhost';
        
        this.initializeClerk();
    }

    async initializeClerk() {
        try {
            // Wait for Clerk to load
            await this.waitForClerk();
            
            // Set up Clerk event listeners
            this.clerk.addListener('user', this.handleUserChange.bind(this));
            
            // Check initial authentication state
            if (this.clerk.loaded) {
                this.handleUserChange(this.clerk.user);
            }
            
            this.setLoading(false);
        } catch (error) {
            console.error('Failed to initialize Clerk:', error);
            this.setLoading(false);
            
            // Fix #7: Only fallback to demo mode in development
            if (!this.isProductionMode) {
                console.warn('Clerk failed to load - enabling demo mode for development');
                this.enableDemoMode();
            } else {
                // In production, show proper error message
                this.notifyUserChange(null);
                this.showAuthError('Authentication service unavailable. Please try again later.');
            }
        }
    }

    waitForClerk() {
        return new Promise((resolve, reject) => {
            const checkClerk = () => {
                if (window.Clerk) {
                    this.clerk = window.Clerk;
                    resolve();
                } else if (Date.now() - startTime > 10000) {
                    reject(new Error('Clerk failed to load within 10 seconds'));
                } else {
                    setTimeout(checkClerk, 100);
                }
            };
            
            const startTime = Date.now();
            checkClerk();
        });
    }

    handleUserChange(user) {
        this.user = user;
        this.notifyUserChange(user);
    }

    setLoading(loading) {
        this.isLoading = loading;
        this.notifyLoadingChange(loading);
    }

    // Event system for components to listen to auth changes
    onUserChange(callback) {
        this.callbacks.onUserChange.push(callback);
        // Call immediately with current state
        callback(this.user);
    }

    onLoadingChange(callback) {
        this.callbacks.onLoadingChange.push(callback);
        // Call immediately with current state
        callback(this.isLoading);
    }

    notifyUserChange(user) {
        this.callbacks.onUserChange.forEach(callback => {
            try {
                callback(user);
            } catch (error) {
                console.error('Error in user change callback:', error);
            }
        });
    }

    notifyLoadingChange(loading) {
        this.callbacks.onLoadingChange.forEach(callback => {
            try {
                callback(loading);
            } catch (error) {
                console.error('Error in loading change callback:', error);
            }
        });
    }

    showAuthError(message) {
        // Display error message in the UI
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50';
        errorDiv.innerHTML = `
            <strong class="font-bold">Authentication Error</strong>
            <span class="block sm:inline">${message}</span>
        `;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 10000);
    }

    // Authentication methods
    async signIn(email, password) {
        if (!this.clerk) {
            return { 
                success: false, 
                error: 'Authentication service not available' 
            };
        }

        try {
            await this.clerk.client.signIn.create({
                identifier: email,
                password: password,
            });

            await this.clerk.client.signIn.attemptFirstFactor({
                strategy: 'password',
                password: password,
            });

            await this.clerk.setActive({
                session: this.clerk.client.signIn.createdSessionId,
            });

            return { success: true };
        } catch (error) {
            console.error('Sign in error:', error);
            return { 
                success: false, 
                error: error.errors?.[0]?.message || 'Sign in failed' 
            };
        }
    }

    async signUp(email, password, firstName) {
        if (!this.clerk) {
            return { 
                success: false, 
                error: 'Authentication service not available' 
            };
        }

        try {
            await this.clerk.client.signUp.create({
                emailAddress: email,
                password: password,
                firstName: firstName,
            });

            // If email verification is required
            if (this.clerk.client.signUp.status === 'missing_requirements') {
                // Handle email verification flow here
                console.log('Email verification required');
                return { 
                    success: false, 
                    error: 'Please verify your email address' 
                };
            }

            await this.clerk.setActive({
                session: this.clerk.client.signUp.createdSessionId,
            });

            return { success: true };
        } catch (error) {
            console.error('Sign up error:', error);
            return { 
                success: false, 
                error: error.errors?.[0]?.message || 'Sign up failed' 
            };
        }
    }

    async signOut() {
        if (!this.clerk) {
            console.warn('Clerk not initialized, clearing local state');
            this.handleUserChange(null);
            return;
        }

        try {
            await this.clerk.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
            // Still clear local state even if sign out fails
            this.handleUserChange(null);
        }
    }

    // Demo mode for development/testing
    enableDemoMode() {
        console.log('Enabling demo mode');
        const demoUser = {
            id: 'demo',
            emailAddresses: [{ emailAddress: 'demo@example.com' }],
            firstName: 'Demo',
            lastName: 'User',
            fullName: 'Demo User',
            imageUrl: null,
            isDemoMode: true
        };
        
        this.handleUserChange(demoUser);
    }

    // Utility methods
    isAuthenticated() {
        return !!this.user;
    }

    getCurrentUser() {
        return this.user;
    }

    getUserEmail() {
        return this.user?.emailAddresses?.[0]?.emailAddress || null;
    }

    getUserName() {
        return this.user?.firstName || this.user?.fullName || 'User';
    }

    isDemoMode() {
        return this.user?.isDemoMode || false;
    }
}

// Create global auth manager instance
window.authManager = new AuthManager();
