// Dashboard Management Module
// Handles dashboard statistics, charts, and overview displays

class DashboardManager {
    constructor() {
        this.refreshInterval = null;
        this.autoRefreshEnabled = true;
        this.refreshRate = 30000; // 30 seconds
        this.animationDuration = 1000;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadDashboard();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Listen for section changes
        uiManager.onEvent('sectionChanged', (e) => {
            if (e.detail.section === 'dashboard') {
                this.refreshDashboard();
            }
        });

        // Listen for data changes
        uiManager.onEvent('inventoryUpdated', () => {
            if (uiManager.currentSection === 'dashboard') {
                this.refreshDashboard();
            }
        });

        // Refresh button if it exists
        const refreshBtn = Utils.$('#refreshDashboard');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                this.refreshDashboard();
            });
        }

        // Auto-refresh toggle if it exists
        const autoRefreshToggle = Utils.$('#autoRefreshToggle');
        if (autoRefreshToggle) {
            autoRefreshToggle.addEventListener('change', (e) => {
                this.toggleAutoRefresh(e.target.checked);
            });
        }
    }

    // Main Dashboard Loading
    async loadDashboard() {
        try {
            uiManager.showLoading('Loading dashboard...');
            
            // Load analytics data
            const analytics = await inventoryAPI.getAnalytics();
            
            // Update all dashboard components
            await Promise.all([
                this.updateStatistics(analytics.stats),
                this.updateRecentActivity(analytics.recentActivity),
                this.updateCriticalAlerts(analytics.lowStockItems, analytics.expiringSoonItems, analytics.expiredItems),
                this.updateAlertBadge(analytics.lowStockItems, analytics.expiringSoonItems, analytics.expiredItems)
            ]);
            
        } catch (error) {
            uiManager.showToast('Failed to load dashboard data', 'error');
            console.error('Error loading dashboard:', error);
        } finally {
            uiManager.hideLoading();
        }
    }

    async refreshDashboard() {
        await this.loadDashboard();
    }

    // Statistics Display
    async updateStatistics(stats) {
        const statElements = {
            totalItems: Utils.$('#totalItems'),
            lowStockItems: Utils.$('#lowStockItems'),
            expiringItems: Utils.$('#expiringItems'),
            inStockItems: Utils.$('#inStockItems')
        };

        // Animate stat changes
        Object.keys(statElements).forEach(key => {
            const element = statElements[key];
            if (element) {
                const currentValue = parseInt(element.textContent) || 0;
                const newValue = stats[this.mapStatKey(key)] || 0;
                
                if (currentValue !== newValue) {
                    this.animateStatValue(element, currentValue, newValue);
                }
            }
        });

        // Update stat card colors based on thresholds
        this.updateStatCardColors(stats);
    }

    mapStatKey(elementKey) {
        const mapping = {
            totalItems: 'total',
            lowStockItems: 'lowStock',
            expiringItems: 'expiring',
            inStockItems: 'inStock'
        };
        return mapping[elementKey] || elementKey;
    }

    animateStatValue(element, startValue, endValue) {
        const duration = this.animationDuration;
        const startTime = performance.now();
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for smooth animation
            const easedProgress = this.easeOutCubic(progress);
            const currentValue = Math.round(startValue + (endValue - startValue) * easedProgress);
            
            element.textContent = currentValue;
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    updateStatCardColors(stats) {
        // Update stat cards based on alert levels
        const lowStockCard = Utils.$('#lowStockItems').closest('.stat-card');
        const expiringCard = Utils.$('#expiringItems').closest('.stat-card');

        if (lowStockCard) {
            lowStockCard.classList.toggle('alert', stats.lowStock > 0);
        }

        if (expiringCard) {
            expiringCard.classList.toggle('warning', stats.expiring > 0);
        }
    }

    // Recent Activity Display
    async updateRecentActivity(activities) {
        const activityContainer = Utils.$('#recentActivity');
        if (!activityContainer) return;

        if (!activities || activities.length === 0) {
            activityContainer.innerHTML = this.getEmptyActivityHTML();
            return;
        }

        // Take only the most recent 10 activities
        const recentActivities = activities.slice(0, 10);
        
        activityContainer.innerHTML = recentActivities.map(activity => 
            this.createActivityItemHTML(activity)
        ).join('');
    }

    createActivityItemHTML(activity) {
        const timeAgo = this.getTimeAgo(activity.date || activity.item.lastUpdated);
        const iconClass = this.getActivityIcon(activity.type);
        
        return `
            <div class="activity-item">
                <div class="activity-icon">
                    <i class="${iconClass}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-title">${Utils.sanitizeInput(activity.message)}</div>
                    <div class="activity-time">${timeAgo}</div>
                </div>
            </div>
        `;
    }

    getActivityIcon(type) {
        const icons = {
            'updated': 'fas fa-edit',
            'created': 'fas fa-plus-circle',
            'deleted': 'fas fa-trash',
            'quantity-changed': 'fas fa-sort-numeric-up',
            'low-stock': 'fas fa-exclamation-triangle',
            'expired': 'fas fa-calendar-times'
        };
        return icons[type] || 'fas fa-info-circle';
    }

    getTimeAgo(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 1) return 'Just now';
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
        
        return Utils.formatDate(dateString);
    }

    getEmptyActivityHTML() {
        return `
            <div class="empty-activity">
                <i class="fas fa-history"></i>
                <p>No recent activity</p>
            </div>
        `;
    }

    // Critical Alerts Display
    async updateCriticalAlerts(lowStockItems, expiringSoonItems, expiredItems) {
        const alertsContainer = Utils.$('#criticalAlerts');
        if (!alertsContainer) return;

        const criticalAlerts = this.prepareCriticalAlerts(lowStockItems, expiringSoonItems, expiredItems);

        if (criticalAlerts.length === 0) {
            alertsContainer.innerHTML = this.getNoAlertsHTML();
            return;
        }

        // Show only the most critical alerts (limit to 5)
        const topAlerts = criticalAlerts.slice(0, 5);
        
        alertsContainer.innerHTML = topAlerts.map(alert => 
            this.createAlertItemHTML(alert)
        ).join('');
    }

    prepareCriticalAlerts(lowStockItems, expiringSoonItems, expiredItems) {
        const alerts = [];

        // Expired items (highest priority)
        expiredItems.forEach(item => {
            alerts.push({
                type: 'expired',
                priority: 'high',
                item,
                message: `${item.name} has expired`,
                icon: 'fas fa-calendar-times',
                actionText: 'Remove from stock'
            });
        });

        // Out of stock items
        lowStockItems.filter(item => item.quantity === 0).forEach(item => {
            alerts.push({
                type: 'out-of-stock',
                priority: 'high',
                item,
                message: `${item.name} is out of stock`,
                icon: 'fas fa-exclamation-circle',
                actionText: 'Restock now'
            });
        });

        // Critical low stock (less than half of threshold)
        lowStockItems.filter(item => 
            item.quantity > 0 && 
            item.quantity <= Math.floor((item.lowStockThreshold || 10) / 2)
        ).forEach(item => {
            alerts.push({
                type: 'critical-low',
                priority: 'high',
                item,
                message: `${item.name} critically low (${item.quantity} left)`,
                icon: 'fas fa-exclamation-triangle',
                actionText: 'Order immediately'
            });
        });

        // Items expiring very soon (within 7 days)
        expiringSoonItems.filter(item => {
            const days = inventoryData.getDaysUntilExpiry(item.expiryDate);
            return days <= 7 && days > 0;
        }).forEach(item => {
            const days = inventoryData.getDaysUntilExpiry(item.expiryDate);
            alerts.push({
                type: 'expiring-soon',
                priority: 'medium',
                item,
                message: `${item.name} expires in ${days} day${days === 1 ? '' : 's'}`,
                icon: 'fas fa-clock',
                actionText: 'Use soon'
            });
        });

        // Sort by priority (high first)
        return alerts.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    createAlertItemHTML(alert) {
        return `
            <div class="alert-item ${alert.type}" data-item-id="${alert.item.id}">
                <div class="alert-icon ${alert.priority}">
                    <i class="${alert.icon}"></i>
                </div>
                <div class="alert-content">
                    <div class="alert-title">${Utils.sanitizeInput(alert.message)}</div>
                    <div class="alert-actions">
                        <button class="btn-link" onclick="inventoryManager.editItem('${alert.item.id}')">
                            ${alert.actionText}
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getNoAlertsHTML() {
        return `
            <div class="no-alerts">
                <i class="fas fa-check-circle text-success"></i>
                <p>All items are in good condition</p>
            </div>
        `;
    }

    // Alert Badge Management
    async updateAlertBadge(lowStockItems, expiringSoonItems, expiredItems) {
        const criticalAlerts = this.prepareCriticalAlerts(lowStockItems, expiringSoonItems, expiredItems);
        const alertCount = criticalAlerts.filter(alert => alert.priority === 'high').length;
        
        uiManager.updateAlertBadge(alertCount);
    }

    // Auto Refresh Management
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        if (this.autoRefreshEnabled) {
            this.refreshInterval = setInterval(() => {
                if (uiManager.currentSection === 'dashboard') {
                    this.refreshDashboard();
                }
            }, this.refreshRate);
        }
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    toggleAutoRefresh(enabled) {
        this.autoRefreshEnabled = enabled;
        
        if (enabled) {
            this.startAutoRefresh();
        } else {
            this.stopAutoRefresh();
        }

        // Save preference
        Utils.setStorage('autoRefreshEnabled', enabled);
    }

    setRefreshRate(rate) {
        this.refreshRate = rate;
        
        if (this.autoRefreshEnabled) {
            this.startAutoRefresh();
        }

        // Save preference
        Utils.setStorage('refreshRate', rate);
    }

    // Dashboard Customization
    addCustomWidget(widgetConfig) {
        // Future implementation for custom dashboard widgets
        console.log('Custom widget feature not yet implemented:', widgetConfig);
    }

    removeCustomWidget(widgetId) {
        // Future implementation for removing custom widgets
        console.log('Remove custom widget feature not yet implemented:', widgetId);
    }

    // Quick Actions from Dashboard
    async quickAddItem() {
        uiManager.showSection('add-item');
    }

    async viewAllAlerts() {
        uiManager.showSection('alerts');
    }

    async viewInventory() {
        uiManager.showSection('inventory');
    }

    // Data Export from Dashboard
    async exportDashboardData() {
        try {
            const analytics = await inventoryAPI.getAnalytics();
            const dashboardData = {
                stats: analytics.stats,
                recentActivity: analytics.recentActivity,
                criticalAlerts: this.prepareCriticalAlerts(
                    analytics.lowStockItems, 
                    analytics.expiringSoonItems, 
                    analytics.expiredItems
                ),
                exportDate: new Date().toISOString(),
                refreshRate: this.refreshRate,
                autoRefreshEnabled: this.autoRefreshEnabled
            };

            const filename = `dashboard-report-${new Date().toISOString().split('T')[0]}.json`;
            this.downloadDashboardReport(dashboardData, filename);
            
        } catch (error) {
            uiManager.showToast('Failed to export dashboard data', 'error');
            console.error('Error exporting dashboard data:', error);
        }
    }

    downloadDashboardReport(data, filename) {
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

    // Performance Monitoring
    measureDashboardPerformance() {
        const startTime = performance.now();
        
        return {
            end: () => {
                const endTime = performance.now();
                const duration = endTime - startTime;
                console.log(`Dashboard refresh took ${duration.toFixed(2)}ms`);
                return duration;
            }
        };
    }

    // Cleanup
    destroy() {
        this.stopAutoRefresh();
        
        // Remove event listeners if needed
        uiManager.offEvent('sectionChanged', this.handleSectionChange);
        uiManager.offEvent('inventoryUpdated', this.handleInventoryUpdate);
    }
}

// Initialize Dashboard Manager
window.dashboardManager = new DashboardManager();
