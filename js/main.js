// Main Application Initialization
// Coordinates all modules and handles global app lifecycle

class ClinicInventoryApp {
    constructor() {
        this.initialized = false;
        this.version = '1.0.0';
        this.appName = 'Clinic Inventory Management System';
        this.lastActivity = Date.now();
        this.activityTimeout = 30 * 60 * 1000; // 30 minutes
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showInitialLoader();
            
            // Initialize core systems
            await this.initializeCore();
            
            // Load user preferences
            this.loadUserPreferences();
            
            // Setup global event listeners
            this.setupGlobalEventListeners();
            
            // Initialize modules in order
            await this.initializeModules();
            
            // Setup periodic tasks
            this.setupPeriodicTasks();
            
            // Hide loading screen and show app
            this.hideInitialLoader();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log(`${this.appName} v${this.version} initialized successfully`);
            this.logAppStats();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showInitializationError(error);
        }
    }

    showInitialLoader() {
        const loader = document.createElement('div');
        loader.id = 'appLoader';
        loader.innerHTML = `
            <div class="app-loader">
                <div class="loader-content">
                    <div class="logo-large">
                        <i class="fas fa-clinic-medical"></i>
                        <h1>ClinicInventory</h1>
                    </div>
                    <div class="loading-spinner">
                        <div class="spinner"></div>
                    </div>
                    <p class="loading-text">Initializing application...</p>
                </div>
            </div>
        `;
        
        loader.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
            color: white;
            font-family: 'Inter', sans-serif;
        `;
        
        document.body.appendChild(loader);
    }

    hideInitialLoader() {
        const loader = document.getElementById('appLoader');
        if (loader) {
            loader.style.opacity = '0';
            loader.style.transition = 'opacity 0.5s ease';
            setTimeout(() => loader.remove(), 500);
        }
    }

    showInitializationError(error) {
        const errorDiv = document.createElement('div');
        errorDiv.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 2rem;
                border-radius: 8px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                text-align: center;
                z-index: 10001;
            ">
                <i class="fas fa-exclamation-triangle" style="font-size: 2rem; color: #ef4444; margin-bottom: 1rem;"></i>
                <h3>Failed to Initialize Application</h3>
                <p style="color: #666; margin: 1rem 0;">${error.message}</p>
                <button onclick="location.reload()" style="
                    background: #2563eb;
                    color: white;
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 4px;
                    cursor: pointer;
                ">Reload Application</button>
            </div>
        `;
        document.body.appendChild(errorDiv);
    }

    async initializeCore() {
        // Verify required APIs are available
        this.checkBrowserCompatibility();
        
        // Initialize storage
        this.initializeStorage();
        
        // Setup error handling
        this.setupErrorHandling();
        
        // Initialize analytics if enabled
        this.initializeAnalytics();
    }

    checkBrowserCompatibility() {
        const requiredFeatures = [
            'localStorage',
            'fetch',
            'Promise',
            'addEventListener'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            switch (feature) {
                case 'localStorage':
                    return !window.localStorage;
                case 'fetch':
                    return !window.fetch;
                case 'Promise':
                    return !window.Promise;
                case 'addEventListener':
                    return !window.addEventListener;
                default:
                    return false;
            }
        });
        
        if (missingFeatures.length > 0) {
            throw new Error(`Browser missing required features: ${missingFeatures.join(', ')}`);
        }
    }

    initializeStorage() {
        try {
            // Test localStorage
            localStorage.setItem('test', 'test');
            localStorage.removeItem('test');
            
            // Initialize app storage structure
            if (!localStorage.getItem('clinicInventoryApp')) {
                localStorage.setItem('clinicInventoryApp', JSON.stringify({
                    version: this.version,
                    installedDate: new Date().toISOString(),
                    userPreferences: {}
                }));
            }
        } catch (error) {
            console.warn('LocalStorage not available, using in-memory storage');
            this.useInMemoryStorage = true;
        }
    }

    setupErrorHandling() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.handleGlobalError(event.error, 'JavaScript Error');
        });
        
        // Unhandled promise rejection handler
        window.addEventListener('unhandledrejection', (event) => {
            this.handleGlobalError(event.reason, 'Unhandled Promise Rejection');
        });
    }

    handleGlobalError(error, type) {
        console.error(`${type}:`, error);
        
        // Don't show UI errors during initialization
        if (this.initialized && uiManager) {
            uiManager.showToast(`An error occurred: ${error.message}`, 'error');
        }
        
        // Log error (in production, send to error tracking service)
        this.logError(error, type);
    }

    logError(error, type) {
        const errorLog = {
            type,
            message: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        // Store error log locally
        const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        errorLogs.push(errorLog);
        
        // Keep only last 50 errors
        if (errorLogs.length > 50) {
            errorLogs.splice(0, errorLogs.length - 50);
        }
        
        localStorage.setItem('errorLogs', JSON.stringify(errorLogs));
    }

    initializeAnalytics() {
        // Basic usage analytics (privacy-friendly)
        this.analytics = {
            sessionStart: Date.now(),
            pageViews: {},
            actions: {},
            errors: 0
        };
        
        // Track page views
        this.trackPageView('dashboard');
    }

    async initializeModules() {
        const modules = [
            { name: 'UI Manager', instance: window.uiManager },
            { name: 'Inventory Data', instance: window.inventoryData },
            { name: 'API Manager', instance: window.inventoryAPI },
            { name: 'Inventory Manager', instance: window.inventoryManager },
            { name: 'Dashboard Manager', instance: window.dashboardManager },
            { name: 'Alerts Manager', instance: window.alertsManager }
        ];
        
        for (const module of modules) {
            if (!module.instance) {
                throw new Error(`${module.name} failed to initialize`);
            }
            console.log(`✓ ${module.name} initialized`);
        }
        
        // Perform initial data load
        await this.performInitialLoad();
    }

    async performInitialLoad() {
        try {
            // Load dashboard data first (it's the default view)
            await dashboardManager.loadDashboard();
            
            // Preload critical alerts
            await alertsManager.loadAlerts();
            
        } catch (error) {
            console.warn('Some data failed to load during initialization:', error);
            // Don't fail initialization completely for data loading issues
        }
    }

    loadUserPreferences() {
        const stored = Utils.getStorage('userPreferences', {});
        this.userPreferences = {
            theme: 'light',
            autoRefresh: true,
            refreshRate: 30000,
            notifications: true,
            sidebarCollapsed: false,
            language: 'en',
            ...stored
        };
        
        // Apply theme
        this.applyTheme(this.userPreferences.theme);
        
        // Apply other preferences
        if (this.userPreferences.sidebarCollapsed && uiManager) {
            uiManager.sidebar?.classList.add('collapsed');
        }
    }

    saveUserPreferences() {
        Utils.setStorage('userPreferences', this.userPreferences);
    }

    updateUserPreference(key, value) {
        this.userPreferences[key] = value;
        this.saveUserPreferences();
        
        // Apply preference immediately if needed
        switch (key) {
            case 'theme':
                this.applyTheme(value);
                break;
            case 'autoRefresh':
                if (dashboardManager) {
                    dashboardManager.toggleAutoRefresh(value);
                }
                break;
            case 'refreshRate':
                if (dashboardManager) {
                    dashboardManager.setRefreshRate(value);
                }
                break;
        }
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        
        // Update theme toggle if it exists
        const themeToggle = Utils.$('#themeToggle');
        if (themeToggle) {
            themeToggle.checked = theme === 'dark';
        }
    }

    setupGlobalEventListeners() {
        // Track user activity
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, () => {
                this.updateLastActivity();
            }, { passive: true });
        });
        
        // Handle visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handleAppVisible();
            } else {
                this.handleAppHidden();
            }
        });
        
        // Handle online/offline status
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            this.handleBeforeUnload(e);
        });
        
        // Handle keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleGlobalKeyboard(e);
        });
    }

    updateLastActivity() {
        this.lastActivity = Date.now();
    }

    handleAppVisible() {
        console.log('App became visible');
        
        // Refresh data if app has been hidden for more than 5 minutes
        if (Date.now() - this.lastActivity > 5 * 60 * 1000) {
            if (uiManager.currentSection === 'dashboard') {
                dashboardManager.refreshDashboard();
            }
        }
        
        this.updateLastActivity();
    }

    handleAppHidden() {
        console.log('App became hidden');
        
        // Save any pending changes
        this.saveAppState();
    }

    handleOnline() {
        console.log('App came online');
        uiManager.showToast('Connection restored', 'success');
        
        // Refresh data when connection is restored
        this.refreshAfterReconnect();
    }

    handleOffline() {
        console.log('App went offline');
        uiManager.showToast('No internet connection', 'warning');
    }

    async refreshAfterReconnect() {
        try {
            if (uiManager.currentSection === 'dashboard') {
                await dashboardManager.refreshDashboard();
            } else if (uiManager.currentSection === 'inventory') {
                await inventoryManager.refreshInventoryView();
            } else if (uiManager.currentSection === 'alerts') {
                await alertsManager.refreshAlerts();
            }
        } catch (error) {
            console.error('Error refreshing after reconnect:', error);
        }
    }

    handleBeforeUnload(e) {
        // Save app state before closing
        this.saveAppState();
        
        // Check for unsaved changes
        const hasUnsavedChanges = this.checkForUnsavedChanges();
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            return e.returnValue;
        }
    }

    checkForUnsavedChanges() {
        // Check if any forms have unsaved data
        const forms = document.querySelectorAll('form');
        for (const form of forms) {
            const formData = new FormData(form);
            for (const [key, value] of formData.entries()) {
                if (value.trim()) {
                    return true;
                }
            }
        }
        return false;
    }

    handleGlobalKeyboard(e) {
        // Global keyboard shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key) {
                case '/':
                    e.preventDefault();
                    this.showKeyboardShortcuts();
                    break;
                case 'k':
                    e.preventDefault();
                    const searchInput = Utils.$('#searchInput');
                    if (searchInput) {
                        uiManager.showSection('inventory');
                        setTimeout(() => searchInput.focus(), 100);
                    }
                    break;
            }
        }
        
        // Alt key shortcuts
        if (e.altKey) {
            switch (e.key) {
                case '1':
                    e.preventDefault();
                    uiManager.showSection('dashboard');
                    break;
                case '2':
                    e.preventDefault();
                    uiManager.showSection('inventory');
                    break;
                case '3':
                    e.preventDefault();
                    uiManager.showSection('add-item');
                    break;
                case '4':
                    e.preventDefault();
                    uiManager.showSection('alerts');
                    break;
            }
        }
    }

    showKeyboardShortcuts() {
        const shortcuts = `
            <h3>Keyboard Shortcuts</h3>
            <ul style="text-align: left; margin: 1rem 0;">
                <li><kbd>Ctrl/Cmd + K</kbd> - Search inventory</li>
                <li><kbd>Alt + 1</kbd> - Dashboard</li>
                <li><kbd>Alt + 2</kbd> - Inventory</li>
                <li><kbd>Alt + 3</kbd> - Add Item</li>
                <li><kbd>Alt + 4</kbd> - Alerts</li>
                <li><kbd>Escape</kbd> - Close modal</li>
                <li><kbd>Ctrl/Cmd + /</kbd> - Show this help</li>
            </ul>
        `;
        
        uiManager.showModal('Keyboard Shortcuts');
        const modalBody = Utils.$('.modal-body');
        if (modalBody) {
            modalBody.innerHTML = shortcuts;
        }
    }

    setupPeriodicTasks() {
        // Check for inactive sessions
        setInterval(() => {
            this.checkInactivity();
        }, 60000); // Check every minute
        
        // Cleanup old data
        setInterval(() => {
            this.cleanupOldData();
        }, 60 * 60 * 1000); // Clean up every hour
        
        // Save analytics
        setInterval(() => {
            this.saveAnalytics();
        }, 5 * 60 * 1000); // Save every 5 minutes
    }

    checkInactivity() {
        if (Date.now() - this.lastActivity > this.activityTimeout) {
            this.handleInactiveSession();
        }
    }

    handleInactiveSession() {
        console.log('Session inactive, saving state');
        this.saveAppState();
        
        // Could show a session timeout warning here
    }

    cleanupOldData() {
        // Clean up old error logs
        const errorLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
        const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        const recentErrors = errorLogs.filter(log => 
            new Date(log.timestamp).getTime() > oneWeekAgo
        );
        localStorage.setItem('errorLogs', JSON.stringify(recentErrors));
        
        // Clean up other old data as needed
    }

    saveAppState() {
        const appState = {
            currentSection: uiManager?.currentSection,
            lastActivity: this.lastActivity,
            userPreferences: this.userPreferences,
            version: this.version,
            timestamp: Date.now()
        };
        
        Utils.setStorage('appState', appState);
    }

    restoreAppState() {
        const appState = Utils.getStorage('appState');
        if (appState && appState.version === this.version) {
            // Restore section if it was recently active
            if (Date.now() - appState.timestamp < 60000) { // 1 minute
                uiManager.showSection(appState.currentSection || 'dashboard');
            }
        }
    }

    // Analytics methods
    trackPageView(section) {
        this.analytics.pageViews[section] = (this.analytics.pageViews[section] || 0) + 1;
    }

    trackAction(action) {
        this.analytics.actions[action] = (this.analytics.actions[action] || 0) + 1;
    }

    saveAnalytics() {
        const analyticsData = {
            ...this.analytics,
            sessionDuration: Date.now() - this.analytics.sessionStart
        };
        
        Utils.setStorage('analytics', analyticsData);
    }

    // App information methods
    getAppInfo() {
        return {
            name: this.appName,
            version: this.version,
            initialized: this.initialized,
            uptime: Date.now() - this.analytics.sessionStart,
            lastActivity: this.lastActivity
        };
    }

    logAppStats() {
        const stats = {
            'App Name': this.appName,
            'Version': this.version,
            'Browser': navigator.userAgent.split(' ').slice(-1)[0],
            'Screen Resolution': `${screen.width}x${screen.height}`,
            'Viewport': `${window.innerWidth}x${window.innerHeight}`,
            'Storage Available': !this.useInMemoryStorage,
            'Online': navigator.onLine
        };
        
        console.table(stats);
    }

    // Public API for other modules
    isOnline() {
        return navigator.onLine;
    }

    getVersion() {
        return this.version;
    }

    getUserPreference(key) {
        return this.userPreferences[key];
    }

    // Cleanup method
    destroy() {
        // Stop periodic tasks
        clearInterval(this.inactivityCheck);
        clearInterval(this.cleanupInterval);
        clearInterval(this.analyticsInterval);
        
        // Save final state
        this.saveAppState();
        this.saveAnalytics();
        
        console.log('Application cleanup completed');
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.clinicInventoryApp = new ClinicInventoryApp();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.clinicInventoryApp) {
        window.clinicInventoryApp.destroy();
    }
});
