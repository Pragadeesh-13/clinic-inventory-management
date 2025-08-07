// API layer for handling backend communication
// This simulates API calls but can be easily modified to work with real endpoints

class InventoryAPI {
    constructor() {
        this.baseURL = 'http://localhost:3000/api'; // Change this to your actual backend URL
        this.endpoints = {
            items: '/inventory',
            analytics: '/analytics',
            alerts: '/alerts'
        };
        
        // Simulate network delay for realistic behavior
        this.simulateNetworkDelay = true;
        this.networkDelay = 500; // milliseconds
    }

    // Generic API request handler
    async request(method, endpoint, data = null, options = {}) {
        const config = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            config.body = JSON.stringify(data);
        }

        try {
            // Simulate network delay if enabled
            if (this.simulateNetworkDelay) {
                await this.delay(this.networkDelay);
            }

            // For demo purposes, we'll simulate responses using localStorage
            // In production, replace with actual fetch calls
            return this.simulateAPICall(method, endpoint, data);
            
            // Uncomment below for real API calls:
            // const response = await fetch(this.baseURL + endpoint, config);
            // if (!response.ok) {
            //     throw new Error(`HTTP error! status: ${response.status}`);
            // }
            // return await response.json();
            
        } catch (error) {
            console.error('API request failed:', error);
            throw new APIError(error.message, error.status);
        }
    }

    // Simulate API responses using mock data
    async simulateAPICall(method, endpoint, data) {
        const response = { success: true, data: null, message: '' };

        switch (endpoint) {
            case this.endpoints.items:
                response.data = this.handleInventoryRequest(method, data);
                break;
            case this.endpoints.analytics:
                response.data = this.handleAnalyticsRequest();
                break;
            case this.endpoints.alerts:
                response.data = this.handleAlertsRequest();
                break;
            default:
                if (endpoint.startsWith(this.endpoints.items + '/')) {
                    const id = endpoint.split('/').pop();
                    response.data = this.handleSingleItemRequest(method, id, data);
                } else {
                    throw new Error('Endpoint not found');
                }
        }

        return response;
    }

    // Handle inventory-related requests
    handleInventoryRequest(method, data) {
        switch (method) {
            case 'GET':
                return window.inventoryData.getAllItems();
            case 'POST':
                return window.inventoryData.addItem(data);
            default:
                throw new Error('Method not supported for inventory collection');
        }
    }

    // Handle single item requests
    handleSingleItemRequest(method, id, data) {
        switch (method) {
            case 'GET':
                return window.inventoryData.getItemById(id);
            case 'PUT':
                return window.inventoryData.updateItem(id, data);
            case 'DELETE':
                return window.inventoryData.deleteItem(id);
            case 'PATCH':
                return window.inventoryData.updateItem(id, data);
            default:
                throw new Error('Method not supported for single item');
        }
    }

    // Handle analytics requests
    handleAnalyticsRequest() {
        return {
            stats: window.inventoryData.getStats(),
            recentActivity: window.inventoryData.getRecentActivity(),
            lowStockItems: window.inventoryData.getLowStockItems(),
            expiringSoonItems: window.inventoryData.getExpiringSoonItems(),
            expiredItems: window.inventoryData.getExpiredItems()
        };
    }

    // Handle alerts requests
    handleAlertsRequest() {
        return {
            critical: window.inventoryData.getCriticalAlerts(),
            lowStock: window.inventoryData.getLowStockItems(),
            expiring: window.inventoryData.getExpiringSoonItems(),
            expired: window.inventoryData.getExpiredItems()
        };
    }

    // Utility method for delays
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // CRUD Operations for Inventory Items

    // Get all items
    async getAllItems(filters = {}) {
        let endpoint = this.endpoints.items;
        
        // Add query parameters for filtering
        const params = new URLSearchParams();
        if (filters.category) params.append('category', filters.category);
        if (filters.status) params.append('status', filters.status);
        if (filters.search) params.append('search', filters.search);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }

        const response = await this.request('GET', endpoint);
        return this.applyFilters(response.data, filters);
    }

    // Get item by ID
    async getItem(id) {
        const response = await this.request('GET', `${this.endpoints.items}/${id}`);
        return response.data;
    }

    // Create new item
    async createItem(itemData) {
        const response = await this.request('POST', this.endpoints.items, itemData);
        return response.data;
    }

    // Update existing item
    async updateItem(id, itemData) {
        const response = await this.request('PUT', `${this.endpoints.items}/${id}`, itemData);
        return response.data;
    }

    // Partially update item
    async patchItem(id, updates) {
        const response = await this.request('PATCH', `${this.endpoints.items}/${id}`, updates);
        return response.data;
    }

    // Delete item
    async deleteItem(id) {
        const response = await this.request('DELETE', `${this.endpoints.items}/${id}`);
        return response.data;
    }

    // Update item quantity
    async updateQuantity(id, quantity) {
        return this.patchItem(id, { quantity });
    }

    // Increase item quantity
    async increaseQuantity(id, amount = 1) {
        const item = await this.getItem(id);
        if (item) {
            return this.updateQuantity(id, item.quantity + amount);
        }
        throw new Error('Item not found');
    }

    // Decrease item quantity
    async decreaseQuantity(id, amount = 1) {
        const item = await this.getItem(id);
        if (item) {
            const newQuantity = Math.max(0, item.quantity - amount);
            return this.updateQuantity(id, newQuantity);
        }
        throw new Error('Item not found');
    }

    // Search items
    async searchItems(query) {
        const response = await this.request('GET', `${this.endpoints.items}?search=${encodeURIComponent(query)}`);
        return window.inventoryData.searchItems(query);
    }

    // Analytics Operations

    // Get dashboard statistics
    async getAnalytics() {
        const response = await this.request('GET', this.endpoints.analytics);
        return response.data;
    }

    // Get low stock items
    async getLowStockItems() {
        const analytics = await this.getAnalytics();
        return analytics.lowStockItems;
    }

    // Get expiring items
    async getExpiringItems() {
        const analytics = await this.getAnalytics();
        return analytics.expiringSoonItems;
    }

    // Get expired items
    async getExpiredItems() {
        const analytics = await this.getAnalytics();
        return analytics.expiredItems;
    }

    // Alert Operations

    // Get all alerts
    async getAlerts() {
        const response = await this.request('GET', this.endpoints.alerts);
        return response.data;
    }

    // Get critical alerts
    async getCriticalAlerts() {
        const alerts = await this.getAlerts();
        return alerts.critical;
    }

    // Bulk Operations

    // Bulk update items
    async bulkUpdateItems(updates) {
        // In a real API, this would be a single request
        const results = [];
        for (const update of updates) {
            try {
                const result = await this.updateItem(update.id, update.data);
                results.push({ success: true, id: update.id, data: result });
            } catch (error) {
                results.push({ success: false, id: update.id, error: error.message });
            }
        }
        return results;
    }

    // Bulk delete items
    async bulkDeleteItems(ids) {
        const results = [];
        for (const id of ids) {
            try {
                await this.deleteItem(id);
                results.push({ success: true, id });
            } catch (error) {
                results.push({ success: false, id, error: error.message });
            }
        }
        return results;
    }

    // Import/Export Operations

    // Export inventory data
    async exportData(format = 'json') {
        const items = await this.getAllItems();
        const data = window.inventoryData.exportData();
        
        if (format === 'csv') {
            return this.convertToCSV(items);
        }
        
        return data;
    }

    // Import inventory data
    async importData(data, merge = false) {
        if (!merge) {
            // Clear existing data if not merging
            const currentItems = await this.getAllItems();
            await this.bulkDeleteItems(currentItems.map(item => item.id));
        }
        
        const results = [];
        for (const item of data.items || []) {
            try {
                const result = await this.createItem(item);
                results.push({ success: true, item: result });
            } catch (error) {
                results.push({ success: false, item, error: error.message });
            }
        }
        
        return results;
    }

    // Utility Methods

    // Apply client-side filters (for demo purposes)
    applyFilters(items, filters) {
        let filteredItems = [...items];

        if (filters.search) {
            filteredItems = window.inventoryData.searchItems(filters.search);
        }

        if (filters.category) {
            filteredItems = filteredItems.filter(item => item.category === filters.category);
        }

        if (filters.status) {
            filteredItems = window.inventoryData.filterByStatus(filters.status);
        }

        return filteredItems;
    }

    // Convert data to CSV format
    convertToCSV(data) {
        if (!data.length) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(item => 
                headers.map(header => {
                    const value = item[header];
                    // Escape commas and quotes
                    return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                        ? `"${value.replace(/"/g, '""')}"`
                        : value;
                }).join(',')
            )
        ].join('\n');
        
        return csvContent;
    }

    // Validate item data
    validateItemData(itemData) {
        const required = ['name', 'category', 'quantity', 'expiryDate'];
        const errors = [];

        for (const field of required) {
            if (!itemData[field]) {
                errors.push(`${field} is required`);
            }
        }

        if (itemData.quantity && itemData.quantity < 0) {
            errors.push('Quantity must be non-negative');
        }

        if (itemData.expiryDate && !Utils.isValidDate(itemData.expiryDate)) {
            errors.push('Invalid expiry date');
        }

        if (errors.length > 0) {
            throw new ValidationError(errors);
        }

        return true;
    }

    // Connection test
    async testConnection() {
        try {
            await this.request('GET', '/health');
            return { success: true, message: 'Connection successful' };
        } catch (error) {
            return { success: false, message: 'Connection failed', error: error.message };
        }
    }
}

// Custom Error Classes
class APIError extends Error {
    constructor(message, status = 500) {
        super(message);
        this.name = 'APIError';
        this.status = status;
    }
}

class ValidationError extends Error {
    constructor(errors) {
        super(Array.isArray(errors) ? errors.join(', ') : errors);
        this.name = 'ValidationError';
        this.errors = Array.isArray(errors) ? errors : [errors];
    }
}

class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = 'NetworkError';
    }
}

// Create global API instance
window.inventoryAPI = new InventoryAPI();

// Export error classes
window.APIError = APIError;
window.ValidationError = ValidationError;
window.NetworkError = NetworkError;
