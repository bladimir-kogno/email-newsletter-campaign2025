// UI Components Module
class ComponentRenderer {
    constructor() {
        this.currentView = 'dashboard';
        this.campaignStep = 1;
        this.newCampaign = {
            title: '',
            subject: '',
            content: '',
            selectedSubscribers: []
        };
    }

    // Authentication Components
    getLoginPage() {
        return `
            <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-4 px-4 sm:px-6 lg:px-8">
                <div class="max-w-md w-full space-y-6">
                    <div class="text-center">
                        <h2 class="text-2xl sm:text-3xl font-extrabold text-gray-900">
                            Lumail Campaign Manager
                        </h2>
                        <p class="mt-2 text-sm text-gray-600">
                            Professional email campaigns from @lumail.co.uk
                        </p>
                    </div>
                    
                    <div class="bg-white py-6 px-4 shadow-lg sm:rounded-lg sm:px-8">
                        <div id="auth-container">
                            <div class="space-y-6">
                                <div>
                                    <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <input id="email" type="email" required 
                                           class="form-input"
                                           placeholder="Enter your email">
                                </div>
                                
                                <div>
                                    <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input id="password" type="password" required 
                                           class="form-input"
                                           placeholder="Enter your password">
                                </div>
                                
                                <div id="firstName-container" class="hidden">
                                    <label for="firstName" class="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                    <input id="firstName" type="text" 
                                           class="form-input"
                                           placeholder="Your first name">
                                </div>
                                
                                <div class="space-y-4">
                                    <button id="auth-submit" 
                                            class="btn-primary w-full">
                                        Sign In
                                    </button>
                                    
                                    <div class="text-center">
                                        <button type="button" id="auth-toggle" 
                                                class="text-sm text-indigo-600 hover:text-indigo-500 underline">
                                            Don't have an account? Sign up
                                        </button>
                                    </div>
                                    
                                    <div class="text-center">
                                        <button type="button" id="demo-mode" 
                                                class="text-sm text-gray-600 hover:text-gray-500 underline">
                                            Try Demo Mode
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getLoadingPage() {
        return `
            <div class="min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="loading-spinner mx-auto mb-4"></div>
                    <p class="text-gray-600">Loading...</p>
                </div>
            </div>
        `;
    }

    // Layout Components
    getLayout(user, view, content) {
        return `
            <div class="min-h-screen bg-gray-50">
                ${this.getHeader(user, view)}
                <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
                    ${content}
                </div>
            </div>
        `;
    }

    getHeader(user, currentView) {
        return `
            <header class="bg-white shadow-sm">
                <div class="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
                    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
                        <div>
                            <h1 class="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                Lumail Campaign Manager
                            </h1>
                            <span class="text-xs sm:text-sm text-gray-500">
                                Welcome, ${user?.firstName || user?.emailAddresses?.[0]?.emailAddress || 'User'}
                                ${user?.isDemoMode ? ' (Demo Mode)' : ''}
                            </span>
                        </div>
                        
                        <div class="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                            <nav class="flex flex-wrap gap-2 sm:gap-4">
                                ${this.getNavButton('dashboard', 'Dashboard', currentView)}
                                ${this.getNavButton('subscribers', 'Subscribers', currentView)}
                                ${this.getNavButton('campaigns', 'Campaigns', currentView)}
                                ${this.getNavButton('settings', 'Settings', currentView)}
                            </nav>
                            
                            <button onclick="window.app.signOut()" 
                                    class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-all text-sm font-medium">
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </header>
        `;
    }

    getNavButton(view, label, currentView) {
        const isActive = currentView === view;
        const baseClasses = "nav-btn px-3 py-2 text-sm font-medium rounded-md transition-all";
        const activeClasses = "bg-blue-100 text-blue-700";
        const inactiveClasses = "text-gray-500 hover:text-gray-700 hover:bg-gray-100";
        
        return `
            <button onclick="window.app.showView('${view}')" 
                    class="${baseClasses} ${isActive ? activeClasses : inactiveClasses}">
                ${label}
            </button>
        `;
    }

    // Dashboard Components
    getDashboard(stats) {
        return `
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
                ${this.getStatCard('users', 'Total Subscribers', stats.subscribers.total, 'text-gray-400')}
                ${this.getStatCard('user-check', 'Active Subscribers', stats.subscribers.active, 'text-green-400')}
                ${this.getStatCard('mail', 'Total Campaigns', stats.campaigns.total, 'text-blue-400')}
                ${this.getStatCard('send', 'Sent Campaigns', stats.campaigns.sent, 'text-purple-400')}
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8">
                ${this.getQuickActionsCard()}
                ${this.getRecentCampaignsCard(stats.recentCampaigns)}
            </div>
        `;
    }

    getStatCard(icon, title, value, iconColor) {
        return `
            <div class="bg-white overflow-hidden shadow-sm rounded-lg">
                <div class="p-4 sm:p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i data-lucide="${icon}" class="h-5 w-5 sm:h-6 sm:w-6 ${iconColor}"></i>
                        </div>
                        <div class="ml-3 sm:ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-xs sm:text-sm font-medium text-gray-500 truncate">${title}</dt>
                                <dd class="text-lg sm:text-xl font-medium text-gray-900">${value}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    getQuickActionsCard() {
        return `
            <div class="bg-white shadow-sm rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Quick Actions</h3>
                    <div class="space-y-3">
                        <button onclick="window.app.showView('create-campaign')" 
                                class="w-full btn-primary">
                            Create New Campaign
                        </button>
                        <button onclick="window.app.showView('subscribers')" 
                                class="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-all font-medium">
                            Manage Subscribers
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getRecentCampaignsCard(campaigns) {
        return `
            <div class="bg-white shadow-sm rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Recent Campaigns</h3>
                    <div class="space-y-3">
                        ${campaigns.length > 0 ? campaigns.map(campaign => `
                            <div class="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                <div class="min-w-0 flex-1">
                                    <p class="font-medium text-sm truncate">${campaign.title}</p>
                                    <p class="text-xs text-gray-500">${this.getStatusBadge(campaign.status)}</p>
                                </div>
                                <span class="text-xs text-gray-400 ml-2">${new Date(campaign.dateCreated).toLocaleDateString()}</span>
                            </div>
                        `).join('') : '<p class="text-gray-500 text-sm">No campaigns yet</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Campaign Creation Components
    getCreateCampaignView(step, campaign, subscribers) {
        return `
            <div class="bg-white shadow-sm rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Create New Campaign</h2>
                    
                    ${this.getStepIndicator(step)}
                    
                    ${step === 1 ? this.getCampaignDetailsStep(campaign) : ''}
                    ${step === 2 ? this.getCampaignRecipientsStep(campaign, subscribers) : ''}
                    ${step === 3 ? this.getCampaignReviewStep(campaign, subscribers) : ''}
                </div>
            </div>
        `;
    }

    getStepIndicator(currentStep) {
        const steps = [
            { number: 1, label: 'Campaign Details' },
            { number: 2, label: 'Select Recipients' },
            { number: 3, label: 'Review & Send' }
        ];

        return `
            <div class="step-indicator">
                ${steps.map((step, index) => `
                    <div class="step ${currentStep >= step.number ? (currentStep === step.number ? 'active' : 'completed') : 'inactive'}">
                        <div class="step-number">${step.number}</div>
                        <span>${step.label}</span>
                    </div>
                    ${index < steps.length - 1 ? '<div class="step-separator"></div>' : ''}
                `).join('')}
            </div>
        `;
    }

    getCampaignDetailsStep(campaign) {
        return `
            <div class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Campaign Title</label>
                    <input type="text" id="campaignTitle" value="${campaign.title}" 
                           class="form-input"
                           placeholder="e.g., Weekly Newsletter #1">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Subject</label>
                    <input type="text" id="emailSubject" value="${campaign.subject}" 
                           class="form-input"
                           placeholder="Subject line your subscribers will see">
                </div>

                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-2">Email Content</label>
                    <textarea id="emailContent" rows="12" 
                              class="form-input"
                              placeholder="Write your email content here...">${campaign.content}</textarea>
                </div>

                <div class="alert alert-info">
                    <div class="flex">
                        <i data-lucide="info" class="h-5 w-5 text-blue-400 mr-2 flex-shrink-0"></i>
                        <div>
                            <h3 class="text-sm font-medium text-blue-800">Email Features:</h3>
                            <div class="mt-1 text-sm text-blue-700">
                                <p>• Professional HTML styling automatically applied</p>
                                <p>• Unsubscribe link automatically included</p>
                                <p>• Mobile-responsive design</p>
                                <p>• Will be sent from your configured @lumail.co.uk address</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-4">
                    <button onclick="window.app.nextCampaignStep()" 
                            class="btn-primary">
                        Next: Select Recipients
                    </button>
                    <button onclick="window.app.showView('campaigns')" 
                            class="btn-secondary">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    }

    getCampaignRecipientsStep(campaign, subscribers) {
        return `
            <div class="space-y-6">
                <div class="flex justify-between items-center">
                    <h3 class="text-lg font-medium text-gray-900">Select Recipients</h3>
                    <div class="flex space-x-2">
                        <button onclick="window.app.selectAllSubscribers()" 
                                class="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-all">
                            Select All
                        </button>
                        <button onclick="window.app.deselectAllSubscribers()" 
                                class="text-sm btn-secondary px-3 py-1 rounded">
                            Deselect All
                        </button>
                    </div>
                </div>

                ${subscribers.length === 0 ? `
                    <div class="text-center py-8">
                        <p class="text-gray-500 mb-4">No subscribers yet. Add some subscribers first.</p>
                        <button onclick="window.app.showView('subscribers')" 
                                class="btn-primary">
                            Manage Subscribers
                        </button>
                    </div>
                ` : `
                    <div class="bg-gray-50 rounded-lg p-4">
                        <p class="text-sm text-gray-600 mb-3">
                            Selected: ${campaign.selectedSubscribers.length} of ${subscribers.length} subscribers
                        </p>
                        <div class="space-y-2 max-h-64 overflow-y-auto">
                            ${subscribers.map(subscriber => `
                                <label class="flex items-center p-2 bg-white rounded border cursor-pointer hover:bg-gray-50">
                                    <input type="checkbox" 
                                           ${campaign.selectedSubscribers.includes(subscriber.id) ? 'checked' : ''}
                                           onchange="window.app.toggleSubscriber(${subscriber.id})"
                                           class="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                                    <div class="flex-1">
                                        <div class="font-medium text-sm">${subscriber.email}</div>
                                        <div class="text-xs text-gray-500">${subscriber.name || 'No name'}</div>
                                    </div>
                                    <span class="text-xs text-gray-400">${new Date(subscriber.dateAdded).toLocaleDateString()}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                `}

                <div class="flex space-x-4">
                    <button onclick="window.app.prevCampaignStep()" 
                            class="btn-secondary">
                        Previous
                    </button>
                    <button onclick="window.app.nextCampaignStep()" 
                            class="btn-primary"
                            ${campaign.selectedSubscribers.length === 0 ? 'disabled' : ''}>
                        Next: Review & Send
                    </button>
                </div>
            </div>
        `;
    }

    getCampaignReviewStep(campaign, subscribers) {
        const selectedSubs = subscribers.filter(s => 
            campaign.selectedSubscribers.includes(s.id)
        );

        return `
            <div class="space-y-6">
                <h3 class="text-lg font-medium text-gray-900">Review Your Campaign</h3>

                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-3">Campaign Details</h4>
                        <div class="space-y-2 text-sm">
                            <div><strong>Title:</strong> ${campaign.title}</div>
                            <div><strong>Subject:</strong> ${campaign.subject}</div>
                            <div><strong>Recipients:</strong> ${selectedSubs.length} subscribers</div>
                        </div>
                    </div>

                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="font-medium text-gray-900 mb-3">Selected Recipients</h4>
                        <div class="max-h-32 overflow-y-auto text-sm space-y-1">
                            ${selectedSubs.map(sub => `
                                <div class="flex justify-between">
                                    <span>${sub.email}</span>
                                    <span class="text-gray-500">${sub.name || ''}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>

                <div class="bg-gray-50 rounded-lg p-4">
                    <h4 class="font-medium text-gray-900 mb-3">Email Preview</h4>
                    <div class="bg-white border rounded p-4 max-h-48 overflow-y-auto text-sm">
                        <div class="font-bold mb-2">Subject: ${campaign.subject}</div>
                        <div class="border-t pt-2">
                            ${campaign.content.replace(/\n/g, '<br>')}
                        </div>
                    </div>
                </div>

                <div class="flex space-x-4">
                    <button onclick="window.app.prevCampaignStep()" 
                            class="btn-secondary">
                        Previous
                    </button>
                    <button onclick="window.app.sendTestEmail()" 
                            class="bg-yellow-600 text-white px-6 py-2 rounded-md hover:bg-yellow-700 transition-all font-medium">
                        Send Test Email
                    </button>
                    <button onclick="window.app.createAndSendCampaign()" 
                            class="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-all font-medium">
                        Send Campaign Now
                    </button>
                </div>

                <div class="alert alert-warning">
                    <div class="flex">
                        <i data-lucide="alert-triangle" class="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0"></i>
                        <div class="text-sm text-yellow-700">
                            <p><strong>Before sending:</strong></p>
                            <p>• Send a test email to yourself first</p>
                            <p>• Make sure your @lumail.co.uk domain is set up in Resend</p>
                            <p>• Once sent, campaigns cannot be edited or recalled</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Subscribers View
    getSubscribersView(subscribers) {
        return `
            <div class="bg-white shadow-sm rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Subscribers (${subscribers.length})</h2>
                        <button onclick="window.app.showAddSubscriberForm()" 
                                class="btn-primary">
                            Add Subscriber
                        </button>
                    </div>

                    <div id="addSubscriberForm" class="hidden mb-6 p-4 bg-gray-50 rounded-lg">
                        <h3 class="text-lg font-medium mb-3">Add New Subscriber</h3>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <input type="email" id="newEmail" placeholder="Email address" class="form-input">
                            <input type="text" id="newName" placeholder="Name (optional)" class="form-input">
                        </div>
                        <div class="mt-4 flex space-x-3">
                            <button onclick="window.app.handleAddSubscriber()" class="btn-primary">
                                Add Subscriber
                            </button>
                            <button onclick="window.app.hideAddSubscriberForm()" class="btn-secondary">
                                Cancel
                            </button>
                        </div>
                    </div>

                    <div class="space-y-4">
                        ${subscribers.map(subscriber => `
                            <div class="bg-gray-50 rounded-lg p-4">
                                <div class="flex justify-between items-start mb-2">
                                    <div class="min-w-0 flex-1">
                                        <p class="font-medium text-sm text-gray-900">${subscriber.email}</p>
                                        <p class="text-xs text-gray-500">${subscriber.name || 'No name'}</p>
                                    </div>
                                    <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        ${subscriber.status || 'Active'}
                                    </span>
                                </div>
                                <div class="flex justify-between items-center">
                                    <span class="text-xs text-gray-500">${new Date(subscriber.dateAdded).toLocaleDateString()}</span>
                                    <button onclick="window.app.removeSubscriber(${subscriber.id})" 
                                            class="text-red-600 hover:text-red-900 text-sm font-medium transition-colors">
                                        Remove
                                    </button>
                                </div>
                            </div>
                        `).join('') || '<p class="text-gray-500 text-center py-8">No subscribers yet. Add your first subscriber!</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Campaigns View
    getCampaignsView(campaigns) {
        return `
            <div class="bg-white shadow-sm rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl sm:text-2xl font-bold text-gray-900">Campaigns (${campaigns.length})</h2>
                        <button onclick="window.app.showView('create-campaign')" 
                                class="btn-primary">
                            Create Campaign
                        </button>
                    </div>

                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        ${campaigns.map(campaign => `
                            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div class="flex justify-between items-start mb-4">
                                    <h3 class="text-base font-semibold text-gray-900 pr-2">${campaign.title}</h3>
                                    ${this.getStatusBadge(campaign.status)}
                                </div>
                                
                                <p class="text-sm text-gray-600 mb-2"><strong>Subject:</strong> ${campaign.subject}</p>
                                <p class="text-sm text-gray-500 mb-4">Created: ${new Date(campaign.dateCreated).toLocaleDateString()}</p>
                                
                                ${campaign.status === 'sent' ? `
                                    <div class="text-sm text-gray-600 mb-4">
                                        <p>Sent to: ${campaign.sentCount || 0} subscribers</p>
                                        ${campaign.dateSent ? `<p>Sent on: ${new Date(campaign.dateSent).toLocaleDateString()}</p>` : ''}
                                    </div>
                                ` : ''}

                                <button onclick="window.app.deleteCampaign(${campaign.id})" 
                                        class="w-full bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700 transition-all">
                                    Delete
                                </button>
                            </div>
                        `).join('') || '<p class="text-gray-500 text-center py-8">No campaigns yet. Create your first campaign!</p>'}
                    </div>
                </div>
            </div>
        `;
    }

    // Settings View
    getSettingsView(settings, user) {
        return `
            <div class="bg-white shadow-sm rounded-lg">
                <div class="px-4 py-5 sm:p-6">
                    <h2 class="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Settings</h2>
                    
                    <div class="space-y-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">From Email Address</label>
                            <input type="email" id="fromEmail" value="${settings.fromEmail}" 
                                   class="form-input"
                                   placeholder="newsletter@lumail.co.uk">
                            <p class="mt-2 text-sm text-gray-500">
                                Must use @lumail.co.uk domain for proper delivery.
                            </p>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
                            <input type="text" id="companyName" value="${settings.companyName || ''}" 
                                   class="form-input"
                                   placeholder="Your Company Name">
                        </div>

                        <div class="alert alert-warning">
                            <div class="flex">
                                <i data-lucide="alert-triangle" class="h-5 w-5 text-yellow-400 mr-2 flex-shrink-0"></i>
                                <div>
                                    <h3 class="text-sm font-medium text-yellow-800">Setup Required:</h3>
                                    <div class="mt-1 text-sm text-yellow-700">
                                        <p>• Add Resend API key to environment variables</p>
                                        <p>• Verify @lumail.co.uk domain in Resend dashboard</p>
                                        <p>• Set up SPF and DKIM records for deliverability</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <button onclick="window.app.handleSettingsUpdate()" 
                                class="btn-primary">
                            Save Settings
                        </button>
                    </div>

                    <div class="mt-8 pt-8 border-t border-gray-200">
                        <h3 class="text-lg font-medium text-gray-900 mb-4">Account Information</h3>
                        <div class="space-y-2 text-sm text-gray-600">
                            <p><strong>Email:</strong> ${user?.emailAddresses?.[0]?.emailAddress || 'N/A'}</p>
                            <p><strong>Name:</strong> ${user?.firstName || user?.fullName || 'Not set'}</p>
                            ${user?.isDemoMode ? '<p><strong>Mode:</strong> Demo Mode</p>' : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    // Utility Methods
    getStatusBadge(status) {
        const statusConfig = {
            'draft': { color: 'bg-yellow-100 text-yellow-800', text: 'Draft' },
            'sending': { color: 'bg-blue-100 text-blue-800', text: 'Sending...' },
            'sent': { color: 'bg-green-100 text-green-800', text: 'Sent' },
            'failed': { color: 'bg-red-100 text-red-800', text: 'Failed' },
            'scheduled': { color: 'bg-purple-100 text-purple-800', text: 'Scheduled' }
        };
        
        const config = statusConfig[status] || statusConfig['draft'];
        return `<span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full ${config.color}">${config.text}</span>`;
    }

    initializeIcons() {
        setTimeout(() => {
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }, 100);
    }
}

// Create global component renderer instance
window.componentRenderer = new ComponentRenderer();
