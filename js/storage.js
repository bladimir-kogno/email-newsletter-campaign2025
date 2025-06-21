// Data Storage Module
class StorageManager {
    constructor() {
        this.prefix = 'lumail_';
        this.currentUserId = null;
    }

    setCurrentUser(userId) {
        this.currentUserId = userId;
    }

    // Get storage key with user prefix
    getUserKey(key) {
        if (!this.currentUserId) {
            throw new Error('No current user set for storage operations');
        }
        return `${this.prefix}${this.currentUserId}_${key}`;
    }

    // Generic storage methods
    setItem(key, value) {
        try {
            const userKey = this.getUserKey(key);
            localStorage.setItem(userKey, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('Error saving to localStorage:', error);
            return false;
        }
    }

    getItem(key, defaultValue = null) {
        try {
            const userKey = this.getUserKey(key);
            const item = localStorage.getItem(userKey);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error('Error reading from localStorage:', error);
            return defaultValue;
        }
    }

    removeItem(key) {
        try {
            const userKey = this.getUserKey(key);
            localStorage.removeItem(userKey);
            return true;
        } catch (error) {
            console.error('Error removing from localStorage:', error);
            return false;
        }
    }

    // Specific data methods
    getSubscribers() {
        return this.getItem('subscribers', []);
    }

    setSubscribers(subscribers) {
        return this.setItem('subscribers', subscribers);
    }

    getCampaigns() {
        return this.getItem('campaigns', []);
    }

    setCampaigns(campaigns) {
        return this.setItem('campaigns', campaigns);
    }

    getSettings() {
        return this.getItem('settings', {
            fromEmail: 'newsletter@lumail.co.uk',
            companyName: 'Lumail',
            replyToEmail: '',
            trackingEnabled: true
        });
    }

    setSettings(settings) {
        return this.setItem('settings', settings);
    }

    // Subscriber management
    addSubscriber(subscriber) {
        const subscribers = this.getSubscribers();
        
        // Check for duplicate email
        if (subscribers.find(s => s.email === subscriber.email)) {
            throw new Error('Subscriber with this email already exists');
        }

        const newSubscriber = {
            id: Date.now(),
            email: subscriber.email,
            name: subscriber.name || '',
            dateAdded: new Date().toISOString(),
            status: 'active',
            tags: subscriber.tags || [],
            customFields: subscriber.customFields || {}
        };

        subscribers.push(newSubscriber);
        this.setSubscribers(subscribers);
        return newSubscriber;
    }

    updateSubscriber(id, updates) {
        const subscribers = this.getSubscribers();
        const index = subscribers.findIndex(s => s.id === id);
        
        if (index === -1) {
            throw new Error('Subscriber not found');
        }

        subscribers[index] = { ...subscribers[index], ...updates };
        this.setSubscribers(subscribers);
        return subscribers[index];
    }

    removeSubscriber(id) {
        const subscribers = this.getSubscribers();
        const filteredSubscribers = subscribers.filter(s => s.id !== id);
        
        if (filteredSubscribers.length === subscribers.length) {
            throw new Error('Subscriber not found');
        }

        this.setSubscribers(filteredSubscribers);
        return true;
    }

    // Campaign management
    addCampaign(campaign) {
        const campaigns = this.getCampaigns();
        
        const newCampaign = {
            id: Date.now(),
            title: campaign.title,
            subject: campaign.subject,
            content: campaign.content,
            htmlContent: campaign.htmlContent || '',
            dateCreated: new Date().toISOString(),
            status: 'draft',
            targetAudience: campaign.targetAudience || 'all',
            selectedSubscribers: campaign.selectedSubscribers || [],
            scheduledDate: campaign.scheduledDate || null,
            sentCount: 0,
            openCount: 0,
            clickCount: 0,
            bounceCount: 0,
            unsubscribeCount: 0,
            metadata: campaign.metadata || {}
        };

        campaigns.push(newCampaign);
        this.setCampaigns(campaigns);
        return newCampaign;
    }

    updateCampaign(id, updates) {
        const campaigns = this.getCampaigns();
        const index = campaigns.findIndex(c => c.id === id);
        
        if (index === -1) {
            throw new Error('Campaign not found');
        }

        campaigns[index] = { ...campaigns[index], ...updates };
        this.setCampaigns(campaigns);
        return campaigns[index];
    }

    removeCampaign(id) {
        const campaigns = this.getCampaigns();
        const filteredCampaigns = campaigns.filter(c => c.id !== id);
        
        if (filteredCampaigns.length === campaigns.length) {
            throw new Error('Campaign not found');
        }

        this.setCampaigns(filteredCampaigns);
        return true;
    }

    // Analytics and reporting
    getCampaignStats() {
        const campaigns = this.getCampaigns();
        
        return {
            total: campaigns.length,
            sent: campaigns.filter(c => c.status === 'sent').length,
            draft: campaigns.filter(c => c.status === 'draft').length,
            scheduled: campaigns.filter(c => c.status === 'scheduled').length,
            totalSent: campaigns.reduce((sum, c) => sum + (c.sentCount || 0), 0),
            totalOpens: campaigns.reduce((sum, c) => sum + (c.openCount || 0), 0),
            totalClicks: campaigns.reduce((sum, c) => sum + (c.clickCount || 0), 0)
        };
    }

    getSubscriberStats() {
        const subscribers = this.getSubscribers();
        
        return {
            total: subscribers.length,
            active: subscribers.filter(s => s.status === 'active').length,
            unsubscribed: subscribers.filter(s => s.status === 'unsubscribed').length,
            bounced: subscribers.filter(s => s.status === 'bounced').length
        };
    }

    // Data export/import
    exportData() {
        return {
            subscribers: this.getSubscribers(),
            campaigns: this.getCampaigns(),
            settings: this.getSettings(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(data) {
        try {
            if (data.subscribers) {
                this.setSubscribers(data.subscribers);
            }
            if (data.campaigns) {
                this.setCampaigns(data.campaigns);
            }
            if (data.settings) {
                this.setSettings(data.settings);
            }
            return { success: true };
        } catch (error) {
            console.error('Error importing data:', error);
            return { success: false, error: error.message };
        }
    }

    // Clear user data (for sign out)
    clearUserData() {
        if (!this.currentUserId) return;
        
        const keysToRemove = [
            'subscribers',
            'campaigns', 
            'settings'
        ];

        keysToRemove.forEach(key => {
            this.removeItem(key);
        });
    }

    // Migration and data integrity
    migrateData() {
        // Handle data structure changes in future versions
        const subscribers = this.getSubscribers();
        const campaigns = this.getCampaigns();
        
        // Example migration: ensure all subscribers have required fields
        const migratedSubscribers = subscribers.map(subscriber => ({
            id: subscriber.id || Date.now(),
            email: subscriber.email,
            name: subscriber.name || '',
            dateAdded: subscriber.dateAdded || new Date().toISOString(),
            status: subscriber.status || 'active',
            tags: subscriber.tags || [],
            customFields: subscriber.customFields || {}
        }));

        // Example migration: ensure all campaigns have required fields
        const migratedCampaigns = campaigns.map(campaign => ({
            id: campaign.id || Date.now(),
            title: campaign.title || 'Untitled Campaign',
            subject: campaign.subject || '',
            content: campaign.content || '',
            htmlContent: campaign.htmlContent || '',
            dateCreated: campaign.dateCreated || new Date().toISOString(),
            status: campaign.status || 'draft',
            targetAudience: campaign.targetAudience || 'all',
            selectedSubscribers: campaign.selectedSubscribers || [],
            sentCount: campaign.sentCount || 0,
            openCount: campaign.openCount || 0,
            clickCount: campaign.clickCount || 0,
            bounceCount: campaign.bounceCount || 0,
            unsubscribeCount: campaign.unsubscribeCount || 0,
            metadata: campaign.metadata || {}
        }));

        this.setSubscribers(migratedSubscribers);
        this.setCampaigns(migratedCampaigns);
    }
}

// Create global storage manager instance
window.storageManager = new StorageManager();
