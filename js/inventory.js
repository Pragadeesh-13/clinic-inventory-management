// Inventory Management Module
// Handles inventory-specific operations and UI updates

class InventoryManager {
    constructor() {
        this.currentFilters = {
            search: '',
            category: '',
            status: ''
        };
        this.sortColumn = 'name';
        this.sortDirection = 'asc';
        this.selectedItems = new Set();
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupFormValidation();
        this.loadInventory();
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = Utils.$('#searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', Utils.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }

        // Filter controls
        const categoryFilter = Utils.$('#categoryFilter');
        const statusFilter = Utils.$('#statusFilter');
        const resetFilters = Utils.$('#resetFilters');

        if (categoryFilter) {
            categoryFilter.addEventListener('change', (e) => {
                this.handleCategoryFilter(e.target.value);
            });
        }

        if (statusFilter) {
            statusFilter.addEventListener('change', (e) => {
                this.handleStatusFilter(e.target.value);
            });
        }

        if (resetFilters) {
            resetFilters.addEventListener('click', () => {
                this.resetFilters();
            });
        }

        // Form submissions
        const addItemForm = Utils.$('#addItemForm');
        const editItemForm = Utils.$('#editItemForm');

        if (addItemForm) {
            addItemForm.addEventListener('submit', (e) => {
                this.handleAddItem(e);
            });
        }

        if (editItemForm) {
            editItemForm.addEventListener('submit', (e) => {
                this.handleEditItem(e);
            });
        }

        // Modal quantity controls
        const increaseBtn = Utils.$('#increaseBtn');
        const decreaseBtn = Utils.$('#decreaseBtn');
        const deleteItemBtn = Utils.$('#deleteItemBtn');
        const cancelEditBtn = Utils.$('#cancelEditBtn');

        if (increaseBtn) {
            increaseBtn.addEventListener('click', () => {
                this.adjustQuantityInModal(1);
            });
        }

        if (decreaseBtn) {
            decreaseBtn.addEventListener('click', () => {
                this.adjustQuantityInModal(-1);
            });
        }

        if (deleteItemBtn) {
            deleteItemBtn.addEventListener('click', () => {
                this.handleDeleteItem();
            });
        }

        if (cancelEditBtn) {
            cancelEditBtn.addEventListener('click', () => {
                uiManager.hideModal();
            });
        }

        // Form cancel button
        const cancelBtn = Utils.$('#cancelBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.resetAddForm();
            });
        }

        // Listen for section changes
        uiManager.onEvent('sectionChanged', (e) => {
            if (e.detail.section === 'inventory') {
                this.refreshInventoryView();
            }
        });
    }

    setupFormValidation() {
        // Real-time validation for forms
        const forms = Utils.$$('#addItemForm, #editItemForm');
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => {
                    this.validateField(input);
                });

                input.addEventListener('input', () => {
                    uiManager.clearFieldError(input);
                });
            });
        });
    }

    // Data Loading and Refreshing
    async loadInventory() {
        try {
            uiManager.showLoading('Loading inventory...');
            const items = await inventoryAPI.getAllItems(this.currentFilters);
            this.renderInventoryTable(items);
            this.updateInventoryStats(items);
        } catch (error) {
            uiManager.showToast('Failed to load inventory', 'error');
            console.error('Error loading inventory:', error);
        } finally {
            uiManager.hideLoading();
        }
    }

    async refreshInventoryView() {
        await this.loadInventory();
    }

    // Filtering and Search
    async handleSearch(query) {
        this.currentFilters.search = query;
        await this.applyFilters();
    }

    async handleCategoryFilter(category) {
        this.currentFilters.category = category;
        await this.applyFilters();
    }

    async handleStatusFilter(status) {
        this.currentFilters.status = status;
        await this.applyFilters();
    }

    async applyFilters() {
        try {
            const items = await inventoryAPI.getAllItems(this.currentFilters);
            this.renderInventoryTable(items);
        } catch (error) {
            uiManager.showToast('Failed to apply filters', 'error');
            console.error('Error applying filters:', error);
        }
    }

    resetFilters() {
        this.currentFilters = { search: '', category: '', status: '' };
        
        const searchInput = Utils.$('#searchInput');
        const categoryFilter = Utils.$('#categoryFilter');
        const statusFilter = Utils.$('#statusFilter');

        if (searchInput) searchInput.value = '';
        if (categoryFilter) categoryFilter.value = '';
        if (statusFilter) statusFilter.value = '';

        this.applyFilters();
    }

    // Table Rendering
    renderInventoryTable(items) {
        const tbody = Utils.$('#inventoryTableBody');
        if (!tbody) return;

        if (!items || items.length === 0) {
            tbody.innerHTML = this.getEmptyStateHTML();
            return;
        }

        const sortedItems = this.sortItems(items);
        tbody.innerHTML = sortedItems.map(item => this.createTableRowHTML(item)).join('');

        // Add event listeners to action buttons
        this.attachTableEventListeners();
    }

    createTableRowHTML(item) {
        const status = inventoryData.getItemStatus(item);
        const expiryDate = Utils.formatDate(item.expiryDate);
        const daysUntilExpiry = inventoryData.getDaysUntilExpiry(item.expiryDate);

        return `
            <tr data-item-id="${item.id}">
                <td>
                    <div class="item-name">
                        <strong>${Utils.sanitizeInput(item.name)}</strong>
                        ${item.batchNumber ? `<small>Batch: ${Utils.sanitizeInput(item.batchNumber)}</small>` : ''}
                    </div>
                </td>
                <td>
                    <span class="category-badge">${Utils.sanitizeInput(item.category)}</span>
                </td>
                <td>
                    <div class="quantity-display">
                        <span class="quantity-number">${item.quantity}</span>
                        ${item.quantity <= (item.lowStockThreshold || 10) ? '<i class="fas fa-exclamation-triangle text-warning" title="Low stock"></i>' : ''}
                    </div>
                </td>
                <td>
                    <div class="expiry-info">
                        <span>${expiryDate}</span>
                        ${daysUntilExpiry <= 30 && daysUntilExpiry > 0 ? 
                            `<small class="text-warning">${daysUntilExpiry} days left</small>` : 
                            daysUntilExpiry <= 0 ? 
                                '<small class="text-danger">Expired</small>' : ''
                        }
                    </div>
                </td>
                <td>
                    <span class="status-badge ${status}">${this.getStatusLabel(status)}</span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="action-btn edit" onclick="inventoryManager.editItem('${item.id}')" title="Edit item">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn increase" onclick="inventoryManager.quickAdjustQuantity('${item.id}', 1)" title="Increase quantity">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="action-btn decrease" onclick="inventoryManager.quickAdjustQuantity('${item.id}', -1)" title="Decrease quantity">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="action-btn delete" onclick="inventoryManager.confirmDeleteItem('${item.id}')" title="Delete item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    getEmptyStateHTML() {
        return `
            <tr>
                <td colspan="6" class="empty-state">
                    <i class="fas fa-boxes"></i>
                    <h3>No items found</h3>
                    <p>No inventory items match your current filters.</p>
                    <button class="btn btn-primary" onclick="uiManager.showSection('add-item')">
                        <i class="fas fa-plus"></i>
                        Add First Item
                    </button>
                </td>
            </tr>
        `;
    }

    getStatusLabel(status) {
        const labels = {
            'in-stock': 'In Stock',
            'low-stock': 'Low Stock',
            'out-of-stock': 'Out of Stock',
            'expiring': 'Expiring Soon',
            'expired': 'Expired'
        };
        return labels[status] || 'Unknown';
    }

    attachTableEventListeners() {
        // Table sorting
        const tableHeaders = Utils.$$('#inventoryTable th[data-sort]');
        tableHeaders.forEach(header => {
            header.addEventListener('click', () => {
                const column = header.getAttribute('data-sort');
                this.sortTable(column);
            });
        });

        // Row selection (if needed for bulk operations)
        const checkboxes = Utils.$$('#inventoryTable input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const itemId = e.target.closest('tr').getAttribute('data-item-id');
                this.toggleItemSelection(itemId, e.target.checked);
            });
        });
    }

    // Sorting
    sortTable(column) {
        if (this.sortColumn === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.sortColumn = column;
            this.sortDirection = 'asc';
        }

        this.refreshInventoryView();
    }

    sortItems(items) {
        return [...items].sort((a, b) => {
            let aVal = a[this.sortColumn];
            let bVal = b[this.sortColumn];

            // Handle different data types
            if (this.sortColumn === 'expiryDate') {
                aVal = new Date(aVal);
                bVal = new Date(bVal);
            } else if (this.sortColumn === 'quantity') {
                aVal = parseInt(aVal);
                bVal = parseInt(bVal);
            } else {
                aVal = aVal?.toString().toLowerCase() || '';
                bVal = bVal?.toString().toLowerCase() || '';
            }

            if (this.sortDirection === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    }

    // Item Operations
    async handleAddItem(e) {
        e.preventDefault();
        
        if (!uiManager.validateForm('#addItemForm')) {
            return;
        }

        try {
            uiManager.showLoading('Adding item...');
            const formData = uiManager.getFormData('#addItemForm');
            
            // Validate data
            await inventoryAPI.validateItemData(formData);
            
            // Create item
            const newItem = await inventoryAPI.createItem(formData);
            
            uiManager.showToast(`${newItem.name} added successfully`, 'success');
            this.resetAddForm();
            this.refreshInventoryView();
            
            // Switch to inventory view
            uiManager.showSection('inventory');
            
        } catch (error) {
            if (error instanceof ValidationError) {
                uiManager.showToast(error.message, 'error');
            } else {
                uiManager.showToast('Failed to add item', 'error');
                console.error('Error adding item:', error);
            }
        } finally {
            uiManager.hideLoading();
        }
    }

    async handleEditItem(e) {
        e.preventDefault();
        
        if (!uiManager.validateForm('#editItemForm')) {
            return;
        }

        try {
            uiManager.showLoading('Updating item...');
            const formData = uiManager.getFormData('#editItemForm');
            const itemId = Utils.$('#editItemId').value;
            
            // Validate data
            await inventoryAPI.validateItemData(formData);
            
            // Update item
            const updatedItem = await inventoryAPI.updateItem(itemId, formData);
            
            uiManager.showToast(`${updatedItem.name} updated successfully`, 'success');
            uiManager.hideModal();
            this.refreshInventoryView();
            
        } catch (error) {
            if (error instanceof ValidationError) {
                uiManager.showToast(error.message, 'error');
            } else {
                uiManager.showToast('Failed to update item', 'error');
                console.error('Error updating item:', error);
            }
        } finally {
            uiManager.hideLoading();
        }
    }

    async handleDeleteItem() {
        const itemId = Utils.$('#editItemId').value;
        if (!itemId) return;

        try {
            uiManager.showLoading('Deleting item...');
            const item = await inventoryAPI.getItem(itemId);
            
            if (confirm(`Are you sure you want to delete "${item.name}"? This action cannot be undone.`)) {
                await inventoryAPI.deleteItem(itemId);
                uiManager.showToast(`${item.name} deleted successfully`, 'success');
                uiManager.hideModal();
                this.refreshInventoryView();
            }
        } catch (error) {
            uiManager.showToast('Failed to delete item', 'error');
            console.error('Error deleting item:', error);
        } finally {
            uiManager.hideLoading();
        }
    }

    async editItem(itemId) {
        try {
            const item = await inventoryAPI.getItem(itemId);
            if (!item) {
                uiManager.showToast('Item not found', 'error');
                return;
            }

            // Populate edit form
            uiManager.populateForm('#editItemForm', item);
            Utils.$('#editItemId').value = itemId;
            
            // Show modal
            uiManager.showModal('Edit Item');
            
        } catch (error) {
            uiManager.showToast('Failed to load item details', 'error');
            console.error('Error loading item:', error);
        }
    }

    async quickAdjustQuantity(itemId, adjustment) {
        try {
            const item = await inventoryAPI.getItem(itemId);
            if (!item) return;

            const newQuantity = Math.max(0, item.quantity + adjustment);
            await inventoryAPI.updateQuantity(itemId, newQuantity);
            
            const action = adjustment > 0 ? 'increased' : 'decreased';
            uiManager.showToast(`${item.name} quantity ${action}`, 'success');
            
            this.refreshInventoryView();
            
        } catch (error) {
            uiManager.showToast('Failed to update quantity', 'error');
            console.error('Error updating quantity:', error);
        }
    }

    confirmDeleteItem(itemId) {
        // Use the edit modal for deletion confirmation
        this.editItem(itemId);
    }

    adjustQuantityInModal(adjustment) {
        const quantityInput = Utils.$('#editItemQuantity');
        if (quantityInput) {
            const currentQuantity = parseInt(quantityInput.value) || 0;
            const newQuantity = Math.max(0, currentQuantity + adjustment);
            quantityInput.value = newQuantity;
        }
    }

    // Form Management
    resetAddForm() {
        const form = Utils.$('#addItemForm');
        if (form) {
            form.reset();
            // Clear any validation errors
            const errorElements = form.querySelectorAll('.field-error');
            errorElements.forEach(error => error.remove());
            const errorInputs = form.querySelectorAll('.error');
            errorInputs.forEach(input => input.classList.remove('error'));
        }
    }

    // Validation
    validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name || field.id;

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            uiManager.showFieldError(field, 'This field is required');
            return false;
        }

        // Specific field validations
        switch (fieldName) {
            case 'itemQuantity':
                if (value && (isNaN(value) || parseInt(value) < 0)) {
                    uiManager.showFieldError(field, 'Quantity must be a non-negative number');
                    return false;
                }
                break;
                
            case 'lowStockThreshold':
                if (value && (isNaN(value) || parseInt(value) < 0)) {
                    uiManager.showFieldError(field, 'Threshold must be a non-negative number');
                    return false;
                }
                break;
                
            case 'expiryDate':
                if (value) {
                    const date = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (date < today) {
                        uiManager.showFieldError(field, 'Expiry date should be in the future');
                        return false;
                    }
                }
                break;
                
            case 'itemName':
                if (value && value.length < 2) {
                    uiManager.showFieldError(field, 'Item name must be at least 2 characters long');
                    return false;
                }
                break;
        }

        uiManager.clearFieldError(field);
        return true;
    }

    // Statistics Update
    updateInventoryStats(items) {
        // This will be called by the dashboard manager
        // but we can also update any inventory-specific stats here
    }

    // Selection Management (for potential bulk operations)
    toggleItemSelection(itemId, selected) {
        if (selected) {
            this.selectedItems.add(itemId);
        } else {
            this.selectedItems.delete(itemId);
        }
        
        this.updateBulkActionButtons();
    }

    selectAllItems(selected) {
        const checkboxes = Utils.$$('#inventoryTable input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = selected;
            const itemId = checkbox.closest('tr').getAttribute('data-item-id');
            this.toggleItemSelection(itemId, selected);
        });
    }

    updateBulkActionButtons() {
        const selectedCount = this.selectedItems.size;
        const bulkActionBar = Utils.$('#bulkActionBar');
        
        if (bulkActionBar) {
            bulkActionBar.style.display = selectedCount > 0 ? 'flex' : 'none';
            const countElement = Utils.$('#selectedCount');
            if (countElement) {
                countElement.textContent = selectedCount;
            }
        }
    }

    // Export functionality
    async exportInventory(format = 'csv') {
        try {
            const data = await inventoryAPI.exportData(format);
            this.downloadData(data, `inventory-export-${new Date().toISOString().split('T')[0]}.${format}`);
        } catch (error) {
            uiManager.showToast('Failed to export inventory', 'error');
            console.error('Error exporting inventory:', error);
        }
    }

    downloadData(data, filename) {
        const blob = new Blob([typeof data === 'string' ? data : JSON.stringify(data, null, 2)], {
            type: filename.endsWith('.csv') ? 'text/csv' : 'application/json'
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

// Initialize Inventory Manager
window.inventoryManager = new InventoryManager();
