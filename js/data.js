// Mock data for demonstration
// In a real application, this would be fetched from your MongoDB backend via API

class InventoryData {
    constructor() {
        this.items = this.loadFromStorage() || this.getInitialData();
        this.categories = ['Medicine', 'Consumable', 'Equipment', 'Supplement'];
        this.lowStockThreshold = 10;
        this.expiryWarningDays = 30;
    }

    getInitialData() {
        return [
            {
                id: '1',
                name: 'Paracetamol 500mg',
                category: 'Medicine',
                quantity: 150,
                lowStockThreshold: 20,
                expiryDate: '2025-12-15',
                batchNumber: 'PAR2024001',
                description: 'Pain relief and fever reducer tablets',
                dateAdded: '2024-01-15',
                lastUpdated: '2024-08-01'
            },
            {
                id: '2',
                name: 'Surgical Masks',
                category: 'Consumable',
                quantity: 8,
                lowStockThreshold: 50,
                expiryDate: '2026-06-30',
                batchNumber: 'MASK2024001',
                description: '3-ply disposable surgical masks',
                dateAdded: '2024-02-01',
                lastUpdated: '2024-07-20'
            },
            {
                id: '3',
                name: 'Digital Thermometer',
                category: 'Equipment',
                quantity: 25,
                lowStockThreshold: 5,
                expiryDate: '2027-03-20',
                batchNumber: 'THERM2024001',
                description: 'Digital infrared thermometer',
                dateAdded: '2024-01-10',
                lastUpdated: '2024-06-15'
            },
            {
                id: '4',
                name: 'Vitamin C Tablets',
                category: 'Supplement',
                quantity: 45,
                lowStockThreshold: 15,
                expiryDate: '2025-09-10',
                batchNumber: 'VIT2024001',
                description: '1000mg Vitamin C tablets',
                dateAdded: '2024-03-01',
                lastUpdated: '2024-07-30'
            },
            {
                id: '5',
                name: 'Antibiotics - Amoxicillin',
                category: 'Medicine',
                quantity: 3,
                lowStockThreshold: 10,
                expiryDate: '2025-08-25',
                batchNumber: 'AMOX2024001',
                description: '500mg Amoxicillin capsules',
                dateAdded: '2024-04-01',
                lastUpdated: '2024-08-05'
            },
            {
                id: '6',
                name: 'Disposable Gloves',
                category: 'Consumable',
                quantity: 120,
                lowStockThreshold: 25,
                expiryDate: '2026-12-31',
                batchNumber: 'GLOVE2024001',
                description: 'Nitrile disposable gloves - Size M',
                dateAdded: '2024-02-15',
                lastUpdated: '2024-07-10'
            },
            {
                id: '7',
                name: 'Blood Pressure Monitor',
                category: 'Equipment',
                quantity: 12,
                lowStockThreshold: 3,
                expiryDate: '2028-01-15',
                batchNumber: 'BP2024001',
                description: 'Digital blood pressure monitor',
                dateAdded: '2024-01-20',
                lastUpdated: '2024-06-25'
            },
            {
                id: '8',
                name: 'Cough Syrup',
                category: 'Medicine',
                quantity: 18,
                lowStockThreshold: 8,
                expiryDate: '2025-08-15',
                batchNumber: 'COUGH2024001',
                description: 'Pediatric cough syrup 100ml',
                dateAdded: '2024-03-10',
                lastUpdated: '2024-07-28'
            },
            {
                id: '9',
                name: 'Multivitamin Complex',
                category: 'Supplement',
                quantity: 6,
                lowStockThreshold: 12,
                expiryDate: '2025-11-30',
                batchNumber: 'MULTI2024001',
                description: 'Complete multivitamin and mineral complex',
                dateAdded: '2024-04-15',
                lastUpdated: '2024-08-02'
            },
            {
                id: '10',
                name: 'Insulin Pens',
                category: 'Medicine',
                quantity: 2,
                lowStockThreshold: 5,
                expiryDate: '2025-08-30',
                batchNumber: 'INS2024001',
                description: 'Disposable insulin pens',
                dateAdded: '2024-05-01',
                lastUpdated: '2024-08-06'
            }
        ];
    }

    // CRUD Operations
    getAllItems() {
        return [...this.items];
    }

    getItemById(id) {
        return this.items.find(item => item.id === id);
    }

    addItem(itemData) {
        const newItem = {
            ...itemData,
            id: this.generateId(),
            dateAdded: new Date().toISOString().split('T')[0],
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        this.items.push(newItem);
        this.saveToStorage();
        return newItem;
    }

    updateItem(id, updates) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            this.items[index] = {
                ...this.items[index],
                ...updates,
                lastUpdated: new Date().toISOString().split('T')[0]
            };
            this.saveToStorage();
            return this.items[index];
        }
        return null;
    }

    deleteItem(id) {
        const index = this.items.findIndex(item => item.id === id);
        if (index !== -1) {
            const deletedItem = this.items.splice(index, 1)[0];
            this.saveToStorage();
            return deletedItem;
        }
        return null;
    }

    updateQuantity(id, newQuantity) {
        return this.updateItem(id, { quantity: Math.max(0, newQuantity) });
    }

    increaseQuantity(id, amount = 1) {
        const item = this.getItemById(id);
        if (item) {
            return this.updateQuantity(id, item.quantity + amount);
        }
        return null;
    }

    decreaseQuantity(id, amount = 1) {
        const item = this.getItemById(id);
        if (item) {
            return this.updateQuantity(id, item.quantity - amount);
        }
        return null;
    }

    // Filtering and Search
    searchItems(query) {
        const searchTerm = query.toLowerCase();
        return this.items.filter(item => 
            item.name.toLowerCase().includes(searchTerm) ||
            item.category.toLowerCase().includes(searchTerm) ||
            item.batchNumber.toLowerCase().includes(searchTerm) ||
            (item.description && item.description.toLowerCase().includes(searchTerm))
        );
    }

    filterByCategory(category) {
        if (!category) return this.getAllItems();
        return this.items.filter(item => item.category === category);
    }

    filterByStatus(status) {
        const today = new Date();
        
        switch (status) {
            case 'in-stock':
                return this.items.filter(item => 
                    item.quantity > (item.lowStockThreshold || this.lowStockThreshold) &&
                    !this.isExpiringSoon(item.expiryDate) &&
                    !this.isExpired(item.expiryDate)
                );
            case 'low-stock':
                return this.items.filter(item => 
                    item.quantity <= (item.lowStockThreshold || this.lowStockThreshold) &&
                    item.quantity > 0
                );
            case 'out-of-stock':
                return this.items.filter(item => item.quantity === 0);
            case 'expiring':
                return this.items.filter(item => 
                    this.isExpiringSoon(item.expiryDate) && 
                    !this.isExpired(item.expiryDate)
                );
            case 'expired':
                return this.items.filter(item => this.isExpired(item.expiryDate));
            default:
                return this.getAllItems();
        }
    }

    // Analytics and Status Checks
    getStats() {
        const total = this.items.length;
        const lowStock = this.getLowStockItems().length;
        const expiring = this.getExpiringSoonItems().length;
        const expired = this.getExpiredItems().length;
        const inStock = total - lowStock - expired;

        return {
            total,
            lowStock,
            expiring,
            expired,
            inStock,
            outOfStock: this.items.filter(item => item.quantity === 0).length
        };
    }

    getLowStockItems() {
        return this.items.filter(item => 
            item.quantity <= (item.lowStockThreshold || this.lowStockThreshold) &&
            item.quantity > 0
        );
    }

    getExpiringSoonItems() {
        return this.items.filter(item => 
            this.isExpiringSoon(item.expiryDate) && 
            !this.isExpired(item.expiryDate)
        );
    }

    getExpiredItems() {
        return this.items.filter(item => this.isExpired(item.expiryDate));
    }

    getCriticalAlerts() {
        const criticalItems = [];
        
        // Out of stock items
        this.items.filter(item => item.quantity === 0).forEach(item => {
            criticalItems.push({
                type: 'out-of-stock',
                item,
                message: `${item.name} is out of stock`,
                priority: 'high',
                icon: 'fas fa-exclamation-circle'
            });
        });

        // Extremely low stock (less than half of threshold)
        this.items.filter(item => 
            item.quantity > 0 && 
            item.quantity <= Math.floor((item.lowStockThreshold || this.lowStockThreshold) / 2)
        ).forEach(item => {
            criticalItems.push({
                type: 'critical-low',
                item,
                message: `${item.name} has critically low stock (${item.quantity} remaining)`,
                priority: 'high',
                icon: 'fas fa-exclamation-triangle'
            });
        });

        // Expired items
        this.getExpiredItems().forEach(item => {
            criticalItems.push({
                type: 'expired',
                item,
                message: `${item.name} has expired on ${this.formatDate(item.expiryDate)}`,
                priority: 'high',
                icon: 'fas fa-calendar-times'
            });
        });

        // Expiring very soon (within 7 days)
        this.items.filter(item => 
            this.getDaysUntilExpiry(item.expiryDate) <= 7 && 
            this.getDaysUntilExpiry(item.expiryDate) > 0
        ).forEach(item => {
            const days = this.getDaysUntilExpiry(item.expiryDate);
            criticalItems.push({
                type: 'expiring-soon',
                item,
                message: `${item.name} expires in ${days} day${days === 1 ? '' : 's'}`,
                priority: 'medium',
                icon: 'fas fa-clock'
            });
        });

        return criticalItems.sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }

    getRecentActivity() {
        const activities = [];
        const sortedItems = [...this.items].sort((a, b) => 
            new Date(b.lastUpdated) - new Date(a.lastUpdated)
        );

        sortedItems.slice(0, 10).forEach(item => {
            activities.push({
                type: 'updated',
                item,
                message: `${item.name} was updated`,
                date: item.lastUpdated,
                icon: 'fas fa-edit'
            });
        });

        return activities;
    }

    // Utility Methods
    isExpired(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        return expiry < today;
    }

    isExpiringSoon(expiryDate, days = this.expiryWarningDays) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days && diffDays > 0;
    }

    getDaysUntilExpiry(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    getItemStatus(item) {
        if (item.quantity === 0) return 'out-of-stock';
        if (this.isExpired(item.expiryDate)) return 'expired';
        if (this.isExpiringSoon(item.expiryDate)) return 'expiring';
        if (item.quantity <= (item.lowStockThreshold || this.lowStockThreshold)) return 'low-stock';
        return 'in-stock';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    generateId() {
        return Date.now().toString() + Math.random().toString(36).substr(2, 9);
    }

    // Local Storage Methods
    saveToStorage() {
        try {
            localStorage.setItem('clinicInventory', JSON.stringify(this.items));
        } catch (error) {
            console.error('Error saving to localStorage:', error);
        }
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem('clinicInventory');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading from localStorage:', error);
            return null;
        }
    }

    clearStorage() {
        localStorage.removeItem('clinicInventory');
    }

    // Export/Import functionality
    exportData() {
        return {
            items: this.items,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
    }

    importData(data) {
        if (data && data.items && Array.isArray(data.items)) {
            this.items = data.items;
            this.saveToStorage();
            return true;
        }
        return false;
    }
}

// Create global instance
window.inventoryData = new InventoryData();
