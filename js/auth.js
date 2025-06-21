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
            // Fallback to demo mode if Clerk fails
            this.enableDemoMode();
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
        this.callbacks.onUserChange.forEach(callback => callback(user));
    }

    notifyLoadingChange(loading) {
        this.callbacks.onLoadingChange.forEach(callback => callback(loading));
    }

    // Authentication methods
    async signIn(email, password) {
        if (!this.clerk) {
            throw new Error('Clerk not initialized');
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
            throw new Error('Clerk not initialized');
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
            console.warn('Clerk not initialized, cannot sign out');
            return;
        }

        try {
            await this.clerk.signOut();
        } catch (error) {
            console.error('Sign out error:', error);
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
