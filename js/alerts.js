// Alerts Management Module
// Handles alert displays, notifications, and alert-specific operations

class AlertsManager {
    constructor() {
        this.alertFilters = {
            type: 'all',
            priority: 'all'
        };
        this.notificationSettings = {
            lowStock: true,
            expiring: true,
            expired: true,
            soundEnabled: false
        };
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadNotificationSettings();
        this.loadAlerts();
    }

    setupEventListeners() {
        // Listen for section changes
        uiManager.onEvent('sectionChanged', (e) => {
            if (e.detail.section === 'alerts') {
                this.refreshAlerts();
            }
        });

        // Alert filter controls
        const typeFilter = Utils.$('#alertTypeFilter');
        const priorityFilter = Utils.$('#alertPriorityFilter');

        if (typeFilter) {
            typeFilter.addEventListener('change', (e) => {
                this.filterAlerts('type', e.target.value);
            });
        }

        if (priorityFilter) {
            priorityFilter.addEventListener('change', (e) => {
                this.filterAlerts('priority', e.target.value);
            });
        }

        // Notification settings toggles
        const notificationToggles = Utils.$$('.notification-toggle');
        notificationToggles.forEach(toggle => {
            toggle.addEventListener('change', (e) => {
                this.updateNotificationSetting(e.target.dataset.setting, e.target.checked);
            });
        });

        // Bulk action buttons
        const dismissAllBtn = Utils.$('#dismissAllAlerts');
        const markAllReadBtn = Utils.$('#markAllReadAlerts');

        if (dismissAllBtn) {
            dismissAllBtn.addEventListener('click', () => {
                this.dismissAllAlerts();
            });
        }

        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', () => {
                this.markAllAlertsRead();
            });
        }

        // Listen for inventory changes that might affect alerts
        uiManager.onEvent('inventoryUpdated', () => {
            this.refreshAlerts();
        });
    }

    // Main Alerts Loading
    async loadAlerts() {
        try {
            uiManager.showLoading('Loading alerts...');
            
            const alerts = await inventoryAPI.getAlerts();
            
            // Update alert sections
            await Promise.all([
                this.updateLowStockAlerts(alerts.lowStock || []),
                this.updateExpiryAlerts(alerts.expiring || [], alerts.expired || [])
            ]);
            
            // Update alert counts
            this.updateAlertCounts(alerts);
            
        } catch (error) {
            uiManager.showToast('Failed to load alerts', 'error');
            console.error('Error loading alerts:', error);
        } finally {
            uiManager.hideLoading();
        }
    }

    async refreshAlerts() {
        await this.loadAlerts();
    }

    // Low Stock Alerts
    async updateLowStockAlerts(lowStockItems) {
        const container = Utils.$('#lowStockAlerts');
        if (!container) return;

        if (!lowStockItems || lowStockItems.length === 0) {
            container.innerHTML = this.getNoAlertsHTML('low-stock');
            return;
        }

        // Separate out of stock and low stock
        const outOfStock = lowStockItems.filter(item => item.quantity === 0);
        const lowStock = lowStockItems.filter(item => item.quantity > 0);

        const alertsHTML = [
            ...outOfStock.map(item => this.createLowStockAlertHTML(item, 'out-of-stock')),
            ...lowStock.map(item => this.createLowStockAlertHTML(item, 'low-stock'))
        ].join('');

        container.innerHTML = alertsHTML;
        this.attachAlertEventListeners(container);
    }

    createLowStockAlertHTML(item, alertType) {
        const isOutOfStock = alertType === 'out-of-stock';
        const urgencyClass = isOutOfStock ? 'critical' : item.quantity <= Math.floor((item.lowStockThreshold || 10) / 2) ? 'critical' : 'warning';
        
        return `
            <div class="alert-card ${urgencyClass}" data-item-id="${item.id}" data-alert-type="${alertType}">
                <div class="alert-header">
                    <div class="alert-icon">
                        <i class="fas ${isOutOfStock ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
                    </div>
                    <div class="alert-info">
                        <h4>${Utils.sanitizeInput(item.name)}</h4>
                        <p class="alert-category">${Utils.sanitizeInput(item.category)}</p>
                    </div>
                    <div class="alert-status">
                        <span class="status-badge ${isOutOfStock ? 'out-of-stock' : 'low-stock'}">
                            ${isOutOfStock ? 'Out of Stock' : 'Low Stock'}
                        </span>
                    </div>
                </div>
                
                <div class="alert-body">
                    <div class="alert-details">
                        <div class="detail-item">
                            <span class="detail-label">Current Quantity:</span>
                            <span class="detail-value ${isOutOfStock ? 'text-danger' : 'text-warning'}">${item.quantity}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Threshold:</span>
                            <span class="detail-value">${item.lowStockThreshold || 10}</span>
                        </div>
                        ${item.batchNumber ? `
                            <div class="detail-item">
                                <span class="detail-label">Batch:</span>
                                <span class="detail-value">${Utils.sanitizeInput(item.batchNumber)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="alert-message">
                        <p>
                            ${isOutOfStock ? 
                                'This item is completely out of stock and needs immediate restocking.' :
                                `Only ${item.quantity} unit${item.quantity === 1 ? '' : 's'} remaining. Consider restocking soon.`
                            }
                        </p>
                    </div>
                </div>
                
                <div class="alert-actions">
                    <button class="btn btn-primary btn-sm" onclick="inventoryManager.editItem('${item.id}')">
                        <i class="fas fa-plus"></i>
                        ${isOutOfStock ? 'Restock Now' : 'Update Stock'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="alertsManager.dismissAlert('${item.id}', '${alertType}')">
                        <i class="fas fa-times"></i>
                        Dismiss
                    </button>
                </div>
            </div>
        `;
    }

    // Expiry Alerts
    async updateExpiryAlerts(expiringSoonItems, expiredItems) {
        const container = Utils.$('#expiryAlerts');
        if (!container) return;

        const allExpiryItems = [...expiredItems, ...expiringSoonItems];
        
        if (allExpiryItems.length === 0) {
            container.innerHTML = this.getNoAlertsHTML('expiry');
            return;
        }

        // Sort by urgency (expired first, then by days until expiry)
        const sortedItems = allExpiryItems.sort((a, b) => {
            const aDays = inventoryData.getDaysUntilExpiry(a.expiryDate);
            const bDays = inventoryData.getDaysUntilExpiry(b.expiryDate);
            
            // Expired items first (negative days)
            if (aDays < 0 && bDays >= 0) return -1;
            if (bDays < 0 && aDays >= 0) return 1;
            
            // Then sort by urgency
            return aDays - bDays;
        });

        const alertsHTML = sortedItems.map(item => {
            const daysUntilExpiry = inventoryData.getDaysUntilExpiry(item.expiryDate);
            const isExpired = daysUntilExpiry < 0;
            return this.createExpiryAlertHTML(item, isExpired ? 'expired' : 'expiring');
        }).join('');

        container.innerHTML = alertsHTML;
        this.attachAlertEventListeners(container);
    }

    createExpiryAlertHTML(item, alertType) {
        const isExpired = alertType === 'expired';
        const daysUntilExpiry = inventoryData.getDaysUntilExpiry(item.expiryDate);
        const urgencyClass = isExpired ? 'critical' : daysUntilExpiry <= 7 ? 'critical' : 'warning';
        
        let timeMessage;
        if (isExpired) {
            const daysExpired = Math.abs(daysUntilExpiry);
            timeMessage = `Expired ${daysExpired} day${daysExpired === 1 ? '' : 's'} ago`;
        } else {
            timeMessage = `Expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}`;
        }

        return `
            <div class="alert-card ${urgencyClass}" data-item-id="${item.id}" data-alert-type="${alertType}">
                <div class="alert-header">
                    <div class="alert-icon">
                        <i class="fas ${isExpired ? 'fa-calendar-times' : 'fa-clock'}"></i>
                    </div>
                    <div class="alert-info">
                        <h4>${Utils.sanitizeInput(item.name)}</h4>
                        <p class="alert-category">${Utils.sanitizeInput(item.category)}</p>
                    </div>
                    <div class="alert-status">
                        <span class="status-badge ${isExpired ? 'expired' : 'expiring'}">
                            ${isExpired ? 'Expired' : 'Expiring Soon'}
                        </span>
                    </div>
                </div>
                
                <div class="alert-body">
                    <div class="alert-details">
                        <div class="detail-item">
                            <span class="detail-label">Expiry Date:</span>
                            <span class="detail-value">${Utils.formatDate(item.expiryDate)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Quantity:</span>
                            <span class="detail-value">${item.quantity}</span>
                        </div>
                        ${item.batchNumber ? `
                            <div class="detail-item">
                                <span class="detail-label">Batch:</span>
                                <span class="detail-value">${Utils.sanitizeInput(item.batchNumber)}</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="alert-message">
                        <p class="${isExpired ? 'text-danger' : 'text-warning'}">
                            <strong>${timeMessage}</strong>
                        </p>
                        <p>
                            ${isExpired ? 
                                'This item has expired and should be removed from inventory immediately.' :
                                'This item is nearing expiration. Use or dispose of it soon.'
                            }
                        </p>
                    </div>
                </div>
                
                <div class="alert-actions">
                    <button class="btn ${isExpired ? 'btn-danger' : 'btn-warning'} btn-sm" onclick="inventoryManager.editItem('${item.id}')">
                        <i class="fas ${isExpired ? 'fa-trash' : 'fa-edit'}"></i>
                        ${isExpired ? 'Remove Item' : 'Update Item'}
                    </button>
                    <button class="btn btn-secondary btn-sm" onclick="alertsManager.dismissAlert('${item.id}', '${alertType}')">
                        <i class="fas fa-times"></i>
                        Dismiss
                    </button>
                </div>
            </div>
        `;
    }

    getNoAlertsHTML(type) {
        const messages = {
            'low-stock': {
                icon: 'fas fa-check-circle text-success',
                title: 'No Low Stock Alerts',
                message: 'All items have adequate stock levels.'
            },
            'expiry': {
                icon: 'fas fa-check-circle text-success',
                title: 'No Expiry Alerts',
                message: 'No items are expired or expiring soon.'
            }
        };

        const config = messages[type] || messages['low-stock'];

        return `
            <div class="no-alerts">
                <i class="${config.icon}"></i>
                <h3>${config.title}</h3>
                <p>${config.message}</p>
            </div>
        `;
    }

    // Alert Interactions
    attachAlertEventListeners(container) {
        // Add any specific event listeners for alert cards
        const alertCards = container.querySelectorAll('.alert-card');
        alertCards.forEach(card => {
            // Add click handlers, hover effects, etc.
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.alert-actions')) {
                    const itemId = card.dataset.itemId;
                    inventoryManager.editItem(itemId);
                }
            });
        });
    }

    async dismissAlert(itemId, alertType) {
        const alertCard = Utils.$(`[data-item-id="${itemId}"][data-alert-type="${alertType}"]`);
        if (alertCard) {
            // Add dismissal animation
            alertCard.style.opacity = '0.5';
            alertCard.style.pointerEvents = 'none';
            
            // Store dismissed alert (in real app, this might be sent to backend)
            this.storeDismissedAlert(itemId, alertType);
            
            // Remove after animation
            setTimeout(() => {
                alertCard.remove();
            }, 300);
            
            uiManager.showToast('Alert dismissed', 'info');
        }
    }

    storeDismissedAlert(itemId, alertType) {
        const dismissed = Utils.getStorage('dismissedAlerts', []);
        dismissed.push({
            itemId,
            alertType,
            dismissedAt: new Date().toISOString()
        });
        Utils.setStorage('dismissedAlerts', dismissed);
    }

    async dismissAllAlerts() {
        if (confirm('Are you sure you want to dismiss all alerts? This action cannot be undone.')) {
            const alertCards = Utils.$$('.alert-card');
            alertCards.forEach(card => {
                const itemId = card.dataset.itemId;
                const alertType = card.dataset.alertType;
                this.dismissAlert(itemId, alertType);
            });
            
            uiManager.showToast('All alerts dismissed', 'success');
        }
    }

    async markAllAlertsRead() {
        const alertCards = Utils.$$('.alert-card');
        alertCards.forEach(card => {
            card.classList.add('read');
        });
        
        // Store read status
        const readAlerts = alertCards.map(card => ({
            itemId: card.dataset.itemId,
            alertType: card.dataset.alertType,
            readAt: new Date().toISOString()
        }));
        
        Utils.setStorage('readAlerts', readAlerts);
        uiManager.showToast('All alerts marked as read', 'success');
    }

    // Filtering
    async filterAlerts(filterType, value) {
        this.alertFilters[filterType] = value;
        
        const alertCards = Utils.$$('.alert-card');
        alertCards.forEach(card => {
            const shouldShow = this.shouldShowAlert(card);
            card.style.display = shouldShow ? 'block' : 'none';
        });
        
        this.updateFilterCounts();
    }

    shouldShowAlert(alertCard) {
        const alertType = alertCard.dataset.alertType;
        const urgencyClass = alertCard.classList.contains('critical') ? 'high' : 'medium';
        
        // Apply type filter
        if (this.alertFilters.type !== 'all' && this.alertFilters.type !== alertType) {
            return false;
        }
        
        // Apply priority filter
        if (this.alertFilters.priority !== 'all' && this.alertFilters.priority !== urgencyClass) {
            return false;
        }
        
        return true;
    }

    updateFilterCounts() {
        const visibleAlerts = Utils.$$('.alert-card:not([style*="display: none"])');
        const countElement = Utils.$('#alertCount');
        if (countElement) {
            countElement.textContent = visibleAlerts.length;
        }
    }

    // Alert Counts
    updateAlertCounts(alerts) {
        const lowStockCount = (alerts.lowStock || []).length;
        const expiringCount = (alerts.expiring || []).length;
        const expiredCount = (alerts.expired || []).length;
        const totalCount = lowStockCount + expiringCount + expiredCount;

        // Update section headers
        const lowStockHeader = Utils.$('#lowStockAlertsHeader');
        const expiryHeader = Utils.$('#expiryAlertsHeader');

        if (lowStockHeader) {
            lowStockHeader.textContent = `Low Stock Alerts (${lowStockCount})`;
        }

        if (expiryHeader) {
            expiryHeader.textContent = `Expiry Alerts (${expiringCount + expiredCount})`;
        }

        // Update navigation badge
        uiManager.updateAlertBadge(totalCount);
    }

    // Notification Settings
    loadNotificationSettings() {
        const stored = Utils.getStorage('notificationSettings', this.notificationSettings);
        this.notificationSettings = { ...this.notificationSettings, ...stored };
        
        // Update UI toggles
        Object.keys(this.notificationSettings).forEach(setting => {
            const toggle = Utils.$(`[data-setting="${setting}"]`);
            if (toggle && toggle.type === 'checkbox') {
                toggle.checked = this.notificationSettings[setting];
            }
        });
    }

    updateNotificationSetting(setting, value) {
        this.notificationSettings[setting] = value;
        Utils.setStorage('notificationSettings', this.notificationSettings);
        
        uiManager.showToast(`${setting} notifications ${value ? 'enabled' : 'disabled'}`, 'info');
    }

    // Browser Notifications
    async requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
        }
        return Notification.permission === 'granted';
    }

    async showBrowserNotification(title, message, type = 'info') {
        if (!this.notificationSettings.browserNotifications) return;
        
        const hasPermission = await this.requestNotificationPermission();
        if (!hasPermission) return;
        
        const notification = new Notification(title, {
            body: message,
            icon: '/favicon.ico', // Update with your app icon
            tag: type,
            requireInteraction: type === 'critical'
        });
        
        // Auto-close after 5 seconds for non-critical notifications
        if (type !== 'critical') {
            setTimeout(() => notification.close(), 5000);
        }
        
        return notification;
    }

    // Sound Alerts
    playAlertSound(type = 'default') {
        if (!this.notificationSettings.soundEnabled) return;
        
        // Create audio context for alert sounds
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Generate different tones for different alert types
        const frequencies = {
            'default': 800,
            'critical': 1000,
            'warning': 600,
            'info': 400
        };
        
        const frequency = frequencies[type] || frequencies.default;
        this.generateAlertTone(audioContext, frequency);
    }

    generateAlertTone(audioContext, frequency) {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }

    // Export Alerts
    async exportAlerts() {
        try {
            const alerts = await inventoryAPI.getAlerts();
            const exportData = {
                lowStockAlerts: alerts.lowStock,
                expiryAlerts: [...(alerts.expiring || []), ...(alerts.expired || [])],
                exportDate: new Date().toISOString(),
                settings: this.notificationSettings
            };
            
            const filename = `alerts-report-${new Date().toISOString().split('T')[0]}.json`;
            this.downloadAlertsReport(exportData, filename);
            
        } catch (error) {
            uiManager.showToast('Failed to export alerts', 'error');
            console.error('Error exporting alerts:', error);
        }
    }

    downloadAlertsReport(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], {
            type: 'application/json'
        });
        
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize Alerts Manager
window.alertsManager = new AlertsManager();
