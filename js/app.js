// Main Application Class
class EmailCampaignApp {
    constructor() {
        this.currentView = 'dashboard';
        this.isAuthMode = 'signin'; // 'signin' or 'signup'
        this.campaignStep = 1;
        this.newCampaign = {
            title: '',
            subject: '',
            content: '',
            selectedSubscribers: []
        };
        
        this.init();
    }

    async init() {
        try {
            console.log('App initialization started');
            
            // Set up authentication event listeners
            window.authManager.onUserChange(this.handleUserChange.bind(this));
            window.authManager.onLoadingChange(this.handleLoadingChange.bind(this));
            
            // Initial render
            this.render();
            
            console.log('App initialization complete');
        } catch (error) {
            console.error('App initialization error:', error);
            this.renderError('Failed to initialize application. Please refresh the page.');
        }
    }

    handleUserChange(user) {
        if (user) {
            // User authenticated
            window.storageManager.setCurrentUser(user.id);
            window.storageManager.migrateData(); // Ensure data integrity
        } else {
            // User signed out
            window.storageManager.clearUserData();
        }
        
        this.render();
    }

    handleLoadingChange(isLoading) {
        if (isLoading) {
            document.getElementById('app').innerHTML = window.componentRenderer.getLoadingPage();
        }
    }

    // Authentication Methods
    async handleAuth() {
        const email = document.getElementById('email')?.value.trim();
        const password = document.getElementById('password')?.value;
        const firstName = document.getElementById('firstName')?.value.trim();

        if (!email || !password) {
            this.showAlert('Please enter both email and password', 'error');
            return;
        }

        const submitButton = document.getElementById('auth-submit');
        const originalText = submitButton.textContent;
        submitButton.textContent = 'Processing...';
        submitButton.disabled = true;

        try {
            let result;
            if (this.isAuthMode === 'signin') {
                result = await window.authManager.signIn(email, password);
            } else if (this.campaignStep === 2) {
                if (this.newCampaign.selectedSubscribers.length === 0) {
                    this.showAlert('Please select at least one subscriber', 'error');
                    return;
                }
                this.campaignStep = 3;
            }
            this.render();
        } catch (error) {
            console.error('Next step error:', error);
            this.showAlert('Error proceeding to next step', 'error');
        }
    }

    prevCampaignStep() {
        if (this.campaignStep > 1) {
            this.campaignStep--;
            this.render();
        }
    }

    toggleSubscriber(subscriberId) {
        const index = this.newCampaign.selectedSubscribers.indexOf(subscriberId);
        if (index > -1) {
            this.newCampaign.selectedSubscribers.splice(index, 1);
        } else {
            this.newCampaign.selectedSubscribers.push(subscriberId);
        }
        this.render();
    }

    selectAllSubscribers() {
        const subscribers = window.storageManager.getSubscribers();
        this.newCampaign.selectedSubscribers = subscribers.map(s => s.id);
        this.render();
    }

    deselectAllSubscribers() {
        this.newCampaign.selectedSubscribers = [];
        this.render();
    }

    async sendTestEmail() {
        try {
            const testEmail = prompt('Enter your email address to receive a test:');
            if (!testEmail || !testEmail.includes('@')) {
                this.showAlert('Please enter a valid email address', 'error');
                return;
            }

            const settings = window.storageManager.getSettings();
            
            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipients: [{ email: testEmail, name: 'Test User' }],
                    subject: this.newCampaign.subject,
                    content: this.newCampaign.content,
                    fromEmail: settings.fromEmail,
                    campaignId: 'test',
                    isTest: true
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert(`Test email sent successfully to ${testEmail}!`, 'success');
            } else {
                throw new Error(result.error || 'Failed to send test email');
            }
        } catch (error) {
            console.error('Test email error:', error);
            this.showAlert(`Failed to send test email: ${error.message}`, 'error');
        }
    }

    async createAndSendCampaign() {
        try {
            const campaign = {
                title: this.newCampaign.title,
                subject: this.newCampaign.subject,
                content: this.newCampaign.content,
                selectedSubscribers: this.newCampaign.selectedSubscribers
            };
            
            // Save campaign to storage
            const savedCampaign = window.storageManager.addCampaign(campaign);
            
            // Update status to sending
            window.storageManager.updateCampaign(savedCampaign.id, {
                status: 'sending',
                targetCount: campaign.selectedSubscribers.length
            });

            const subscribers = window.storageManager.getSubscribers();
            const selectedSubs = subscribers.filter(s => 
                campaign.selectedSubscribers.includes(s.id)
            );

            const settings = window.storageManager.getSettings();

            const response = await fetch('/api/send-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    recipients: selectedSubs,
                    subject: campaign.subject,
                    content: campaign.content,
                    fromEmail: settings.fromEmail,
                    campaignId: savedCampaign.id
                })
            });

            const result = await response.json();

            if (result.success) {
                window.storageManager.updateCampaign(savedCampaign.id, {
                    status: 'sent',
                    sentCount: result.sent,
                    dateSent: new Date().toISOString(),
                    failedCount: result.failed || 0
                });
                
                this.showAlert(`Campaign sent successfully to ${result.sent} subscribers!`, 'success');
                this.showView('campaigns');
            } else {
                window.storageManager.updateCampaign(savedCampaign.id, {
                    status: 'failed',
                    errorMessage: result.error
                });
                throw new Error(result.error || 'Failed to send campaign');
            }
        } catch (error) {
            console.error('Send campaign error:', error);
            this.showAlert(`Failed to send campaign: ${error.message}`, 'error');
        }
    }

    // Subscriber Management
    showAddSubscriberForm() {
        const form = document.getElementById('addSubscriberForm');
        if (form) {
            form.classList.remove('hidden');
            document.getElementById('newEmail')?.focus();
        }
    }

    hideAddSubscriberForm() {
        const form = document.getElementById('addSubscriberForm');
        if (form) {
            form.classList.add('hidden');
            this.clearSubscriberForm();
        }
    }

    clearSubscriberForm() {
        const emailInput = document.getElementById('newEmail');
        const nameInput = document.getElementById('newName');
        if (emailInput) emailInput.value = '';
        if (nameInput) nameInput.value = '';
    }

    handleAddSubscriber() {
        try {
            const email = document.getElementById('newEmail')?.value.trim();
            const name = document.getElementById('newName')?.value.trim();
            
            if (!email) {
                this.showAlert('Please enter an email address', 'error');
                return;
            }

            if (!this.isValidEmail(email)) {
                this.showAlert('Please enter a valid email address', 'error');
                return;
            }
            
            window.storageManager.addSubscriber({ email, name });
            this.hideAddSubscriberForm();
            this.render();
            this.showAlert('Subscriber added successfully!', 'success');
        } catch (error) {
            console.error('Add subscriber error:', error);
            this.showAlert(error.message || 'Failed to add subscriber', 'error');
        }
    }

    removeSubscriber(id) {
        if (confirm('Are you sure you want to remove this subscriber?')) {
            try {
                window.storageManager.removeSubscriber(id);
                this.render();
                this.showAlert('Subscriber removed successfully', 'success');
            } catch (error) {
                console.error('Remove subscriber error:', error);
                this.showAlert('Failed to remove subscriber', 'error');
            }
        }
    }

    // Campaign Management
    deleteCampaign(id) {
        if (confirm('Are you sure you want to delete this campaign?')) {
            try {
                window.storageManager.removeCampaign(id);
                this.render();
                this.showAlert('Campaign deleted successfully', 'success');
            } catch (error) {
                console.error('Delete campaign error:', error);
                this.showAlert('Failed to delete campaign', 'error');
            }
        }
    }

    // Settings Management
    handleSettingsUpdate() {
        try {
            const fromEmail = document.getElementById('fromEmail')?.value.trim();
            const companyName = document.getElementById('companyName')?.value.trim();
            
            if (!fromEmail) {
                this.showAlert('Please enter a from email address', 'error');
                return;
            }

            if (!fromEmail.includes('@lumail.co.uk')) {
                this.showAlert('From email must use @lumail.co.uk domain', 'error');
                return;
            }
            
            const currentSettings = window.storageManager.getSettings();
            const newSettings = {
                ...currentSettings,
                fromEmail,
                companyName
            };
            
            window.storageManager.setSettings(newSettings);
            this.showAlert('Settings updated successfully!', 'success');
        } catch (error) {
            console.error('Settings update error:', error);
            this.showAlert('Failed to update settings', 'error');
        }
    }

    // Utility Methods
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showAlert(message, type = 'info') {
        // Create alert element
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} fixed top-4 right-4 z-50 max-w-sm`;
        alertDiv.innerHTML = `
            <div class="flex items-center">
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-current opacity-70 hover:opacity-100">×</button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (alertDiv.parentElement) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // Render Methods
    render() {
        try {
            const app = document.getElementById('app');
            const user = window.authManager.getCurrentUser();
            
            if (window.authManager.isLoading) {
                app.innerHTML = window.componentRenderer.getLoadingPage();
                return;
            }
            
            if (!user) {
                app.innerHTML = window.componentRenderer.getLoginPage();
                this.setupAuthEventListeners();
            } else {
                const content = this.getMainContent();
                app.innerHTML = window.componentRenderer.getLayout(user, this.currentView, content);
            }
            
            window.componentRenderer.initializeIcons();
        } catch (error) {
            console.error('Render error:', error);
            this.renderError('Error rendering application');
        }
    }

    setupAuthEventListeners() {
        setTimeout(() => {
            const submitButton = document.getElementById('auth-submit');
            const toggleButton = document.getElementById('auth-toggle');
            const demoButton = document.getElementById('demo-mode');
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');

            if (submitButton) {
                submitButton.addEventListener('click', () => this.handleAuth());
            }
            
            if (toggleButton) {
                toggleButton.addEventListener('click', () => this.toggleAuthMode());
            }
            
            if (demoButton) {
                demoButton.addEventListener('click', () => this.enableDemoMode());
            }

            // Add enter key support
            [emailInput, passwordInput].forEach(input => {
                if (input) {
                    input.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            this.handleAuth();
                        }
                    });
                }
            });

            // Update form based on current mode
            this.updateAuthForm();
        }, 100);
    }

    getMainContent() {
        const subscribers = window.storageManager.getSubscribers();
        const campaigns = window.storageManager.getCampaigns();
        const settings = window.storageManager.getSettings();
        const user = window.authManager.getCurrentUser();

        switch (this.currentView) {
            case 'dashboard':
                return this.getDashboardContent(subscribers, campaigns);
            case 'subscribers':
                return window.componentRenderer.getSubscribersView(subscribers);
            case 'campaigns':
                return window.componentRenderer.getCampaignsView(campaigns);
            case 'create-campaign':
                return window.componentRenderer.getCreateCampaignView(
                    this.campaignStep, 
                    this.newCampaign, 
                    subscribers
                );
            case 'settings':
                return window.componentRenderer.getSettingsView(settings, user);
            default:
                return this.getDashboardContent(subscribers, campaigns);
        }
    }

    getDashboardContent(subscribers, campaigns) {
        const stats = {
            subscribers: window.storageManager.getSubscriberStats(),
            campaigns: window.storageManager.getCampaignStats(),
            recentCampaigns: campaigns.slice(-3).reverse()
        };
        
        return window.componentRenderer.getDashboard(stats);
    }

    renderError(message) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="text-red-600 mb-4">
                        <i data-lucide="alert-circle" class="h-12 w-12 mx-auto"></i>
                    </div>
                    <h2 class="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
                    <p class="text-gray-600 mb-4">${message}</p>
                    <button onclick="window.location.reload()" 
                            class="btn-primary">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;
    }
}

// Make app globally available for event handlers
window.app = null; {
                if (!firstName) {
                    this.showAlert('Please enter your first name', 'error');
                    return;
                }
                result = await window.authManager.signUp(email, password, firstName);
            }

            if (result.success) {
                // Success is handled by the user change event
            } else {
                this.showAlert(result.error, 'error');
            }
        } catch (error) {
            console.error('Authentication error:', error);
            this.showAlert('Authentication failed. Please try again.', 'error');
        } finally {
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }
    }

    toggleAuthMode() {
        this.isAuthMode = this.isAuthMode === 'signin' ? 'signup' : 'signin';
        this.updateAuthForm();
    }

    updateAuthForm() {
        const firstNameContainer = document.getElementById('firstName-container');
        const submitButton = document.getElementById('auth-submit');
        const toggleButton = document.getElementById('auth-toggle');

        if (this.isAuthMode === 'signup') {
            firstNameContainer?.classList.remove('hidden');
            if (submitButton) submitButton.textContent = 'Create Account';
            if (toggleButton) toggleButton.textContent = 'Already have an account? Sign in';
        } else {
            firstNameContainer?.classList.add('hidden');
            if (submitButton) submitButton.textContent = 'Sign In';
            if (toggleButton) toggleButton.textContent = "Don't have an account? Sign up";
        }
    }

    enableDemoMode() {
        window.authManager.enableDemoMode();
    }

    async signOut() {
        await window.authManager.signOut();
    }

    // Navigation
    showView(view) {
        this.currentView = view;
        if (view === 'create-campaign') {
            this.campaignStep = 1;
            this.newCampaign = {
                title: '',
                subject: '',
                content: '',
                selectedSubscribers: []
            };
        }
        this.render();
        window.scrollTo(0, 0);
    }

    // Campaign Creation Flow
    nextCampaignStep() {
        try {
            if (this.campaignStep === 1) {
                const title = document.getElementById('campaignTitle')?.value.trim();
                const subject = document.getElementById('emailSubject')?.value.trim();
                const content = document.getElementById('emailContent')?.value.trim();
                
                if (!title || !subject || !content) {
                    this.showAlert('Please fill in all fields', 'error');
                    return;
                }
                
                this.newCampaign.title = title;
                this.newCampaign.subject = subject;
                this.newCampaign.content = content;
                this.campaignStep = 2;
            } else
