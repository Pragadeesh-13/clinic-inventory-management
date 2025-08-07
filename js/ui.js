// UI Management and Interactions
// Handles all UI updates, animations, and user interactions

class UIManager {
    constructor() {
        this.currentSection = 'dashboard';
        this.modal = null;
        this.toastContainer = null;
        this.loadingSpinner = null;
        this.sidebarCollapsed = false;
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupResponsiveHandling();
        this.initializeTooltips();
    }

    setupElements() {
        // Main UI elements
        this.modal = Utils.$('#itemModal');
        this.toastContainer = Utils.$('#toastContainer');
        this.loadingSpinner = Utils.$('#loadingSpinner');
        this.sidebar = Utils.$('#sidebar');
        this.sidebarToggle = Utils.$('#sidebarToggle');
        
        // Navigation elements
        this.navLinks = Utils.$$('.nav-link');
        this.contentSections = Utils.$$('.content-section');
        
        // Form elements
        this.addItemForm = Utils.$('#addItemForm');
        this.editItemForm = Utils.$('#editItemForm');
        
        // Button elements
        this.addItemBtn = Utils.$('#addItemBtn');
        this.closeModalBtn = Utils.$('#closeModal');
    }

    setupEventListeners() {
        // Navigation
        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('data-section');
                this.showSection(section);
            });
        });

        // Sidebar toggle
        if (this.sidebarToggle) {
            this.sidebarToggle.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Modal controls
        if (this.closeModalBtn) {
            this.closeModalBtn.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Close modal on overlay click
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.hideModal();
                }
            });
        }

        // Add item button
        if (this.addItemBtn) {
            this.addItemBtn.addEventListener('click', () => {
                this.showSection('add-item');
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window resize handling
        window.addEventListener('resize', Utils.debounce(() => {
            this.handleResize();
        }, 250));

        // Outside click handling
        document.addEventListener('click', (e) => {
            this.handleOutsideClick(e);
        });
    }

    setupResponsiveHandling() {
        // Check if mobile view
        this.checkMobileView();
        
        // Add mobile header if needed
        if (this.isMobileView()) {
            this.addMobileHeader();
        }
    }

    initializeTooltips() {
        // Initialize tooltips for buttons and icons
        const tooltipElements = Utils.$$('[data-tooltip]');
        tooltipElements.forEach(element => {
            this.addTooltip(element);
        });
    }

    // Section Management
    showSection(sectionId) {
        if (this.currentSection === sectionId) return;

        // Hide current section
        const currentSectionEl = Utils.$(`#${this.currentSection}`);
        if (currentSectionEl) {
            currentSectionEl.classList.remove('active');
        }

        // Show new section
        const newSectionEl = Utils.$(`#${sectionId}`);
        if (newSectionEl) {
            newSectionEl.classList.add('active');
        }

        // Update navigation
        this.updateActiveNavigation(sectionId);
        
        // Update current section
        this.currentSection = sectionId;

        // Close mobile sidebar if open
        if (this.isMobileView()) {
            this.closeMobileSidebar();
        }

        // Emit section change event
        this.emitEvent('sectionChanged', { section: sectionId });
    }

    updateActiveNavigation(sectionId) {
        // Remove active class from all nav items
        Utils.$$('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Add active class to current nav item
        const activeLink = Utils.$(`[data-section="${sectionId}"]`);
        if (activeLink) {
            const navItem = activeLink.closest('.nav-item');
            if (navItem) {
                navItem.classList.add('active');
            }
        }
    }

    // Sidebar Management
    toggleSidebar() {
        this.sidebarCollapsed = !this.sidebarCollapsed;
        
        if (this.isMobileView()) {
            this.toggleMobileSidebar();
        } else {
            this.sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
        }

        // Save state
        Utils.setStorage('sidebarCollapsed', this.sidebarCollapsed);
    }

    toggleMobileSidebar() {
        const isActive = this.sidebar.classList.contains('active');
        this.sidebar.classList.toggle('active', !isActive);
        
        // Toggle overlay
        let overlay = Utils.$('.sidebar-overlay');
        if (!overlay && !isActive) {
            overlay = this.createSidebarOverlay();
        }
        
        if (overlay) {
            overlay.classList.toggle('active', !isActive);
            if (isActive) {
                setTimeout(() => overlay.remove(), 300);
            }
        }
    }

    closeMobileSidebar() {
        if (this.isMobileView()) {
            this.sidebar.classList.remove('active');
            const overlay = Utils.$('.sidebar-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => overlay.remove(), 300);
            }
        }
    }

    createSidebarOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        overlay.addEventListener('click', () => {
            this.closeMobileSidebar();
        });
        document.body.appendChild(overlay);
        return overlay;
    }

    addMobileHeader() {
        if (Utils.$('.mobile-header')) return;

        const header = document.createElement('div');
        header.className = 'mobile-header';
        header.innerHTML = `
            <button class="mobile-nav-btn" id="mobileNavBtn">
                <i class="fas fa-bars"></i>
            </button>
            <div class="logo">
                <i class="fas fa-clinic-medical"></i>
                <span>ClinicInventory</span>
            </div>
        `;

        const mainContent = Utils.$('.main-content');
        mainContent.prepend(header);

        // Add event listener for mobile nav button
        Utils.$('#mobileNavBtn').addEventListener('click', () => {
            this.toggleSidebar();
        });
    }

    // Modal Management
    showModal(title = 'Modal', content = '') {
        if (!this.modal) return;

        const modalTitle = Utils.$('#modalTitle');
        if (modalTitle) {
            modalTitle.textContent = title;
        }

        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus management
        const focusableElement = this.modal.querySelector('input, textarea, select, button');
        if (focusableElement) {
            setTimeout(() => focusableElement.focus(), 100);
        }
    }

    hideModal() {
        if (!this.modal) return;

        this.modal.classList.remove('active');
        document.body.style.overflow = '';
        
        // Reset forms
        const forms = this.modal.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }

    // Loading Management
    showLoading(message = 'Loading...') {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.add('active');
        }
        
        // Show loading message if container exists
        const messageElement = Utils.$('#loadingMessage');
        if (messageElement) {
            messageElement.textContent = message;
        }
    }

    hideLoading() {
        if (this.loadingSpinner) {
            this.loadingSpinner.classList.remove('active');
        }
    }

    // Toast Notifications
    showToast(message, type = 'info', duration = 5000) {
        if (!this.toastContainer) return;

        const toast = this.createToast(message, type, duration);
        this.toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);

        // Auto remove
        if (duration > 0) {
            setTimeout(() => this.removeToast(toast), duration);
        }

        return toast;
    }

    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const iconMap = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };

        toast.innerHTML = `
            <div class="toast-icon">
                <i class="${iconMap[type] || iconMap.info}"></i>
            </div>
            <div class="toast-content">
                <div class="toast-message">${message}</div>
            </div>
            <button class="toast-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add close functionality
        const closeBtn = toast.querySelector('.toast-close');
        closeBtn.addEventListener('click', () => {
            this.removeToast(toast);
        });

        return toast;
    }

    removeToast(toast) {
        toast.classList.remove('show');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }

    // Alert Badge Management
    updateAlertBadge(count) {
        const badge = Utils.$('#alertBadge');
        if (badge) {
            badge.textContent = count;
            badge.style.display = count > 0 ? 'inline' : 'none';
        }
    }

    // Form Utilities
    populateForm(formId, data) {
        const form = Utils.$(formId);
        if (!form) return;

        Object.keys(data).forEach(key => {
            const input = form.querySelector(`[name="${key}"], #${key}`);
            if (input) {
                if (input.type === 'checkbox') {
                    input.checked = !!data[key];
                } else if (input.type === 'radio') {
                    const radio = form.querySelector(`[name="${key}"][value="${data[key]}"]`);
                    if (radio) radio.checked = true;
                } else {
                    input.value = data[key] || '';
                }
            }
        });
    }

    getFormData(formId) {
        const form = Utils.$(formId);
        if (!form) return null;

        const formData = new FormData(form);
        const data = {};

        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }

        return data;
    }

    validateForm(formId) {
        const form = Utils.$(formId);
        if (!form) return false;

        const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'This field is required');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        input.classList.add('error');
        const errorElement = document.createElement('div');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        
        input.parentNode.appendChild(errorElement);
    }

    clearFieldError(input) {
        input.classList.remove('error');
        const errorElement = input.parentNode.querySelector('.field-error');
        if (errorElement) {
            errorElement.remove();
        }
    }

    // Responsive Utilities
    isMobileView() {
        return window.innerWidth <= 768;
    }

    isTabletView() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }

    isDesktopView() {
        return window.innerWidth > 1024;
    }

    checkMobileView() {
        document.body.classList.toggle('mobile-view', this.isMobileView());
        document.body.classList.toggle('tablet-view', this.isTabletView());
        document.body.classList.toggle('desktop-view', this.isDesktopView());
    }

    handleResize() {
        this.checkMobileView();
        
        // Close mobile sidebar on desktop
        if (this.isDesktopView()) {
            this.closeMobileSidebar();
        }
    }

    // Keyboard Shortcuts
    handleKeyboardShortcuts(e) {
        // Escape key to close modal
        if (e.key === 'Escape') {
            if (this.modal && this.modal.classList.contains('active')) {
                this.hideModal();
            }
        }

        // Ctrl/Cmd + K for search
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = Utils.$('#searchInput');
            if (searchInput) {
                searchInput.focus();
            }
        }

        // Alt + N for new item
        if (e.altKey && e.key === 'n') {
            e.preventDefault();
            this.showSection('add-item');
        }
    }

    handleOutsideClick(e) {
        // Close dropdowns, modals, etc. when clicking outside
        // Implementation depends on specific components
    }

    // Tooltip Management
    addTooltip(element) {
        const text = element.getAttribute('data-tooltip');
        if (!text) return;

        element.addEventListener('mouseenter', (e) => {
            this.showTooltip(e.target, text);
        });

        element.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    showTooltip(element, text) {
        this.hideTooltip();

        const tooltip = document.createElement('div');
        tooltip.className = 'tooltip';
        tooltip.textContent = text;
        document.body.appendChild(tooltip);

        const rect = element.getBoundingClientRect();
        tooltip.style.left = rect.left + (rect.width / 2) - (tooltip.offsetWidth / 2) + 'px';
        tooltip.style.top = rect.top - tooltip.offsetHeight - 10 + 'px';

        this.currentTooltip = tooltip;
    }

    hideTooltip() {
        if (this.currentTooltip) {
            this.currentTooltip.remove();
            this.currentTooltip = null;
        }
    }

    // Event System
    emitEvent(eventName, data = {}) {
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    onEvent(eventName, callback) {
        document.addEventListener(eventName, callback);
    }

    offEvent(eventName, callback) {
        document.removeEventListener(eventName, callback);
    }

    // Animation Utilities
    animateValue(element, start, end, duration = 1000) {
        const startTime = performance.now();
        
        const updateValue = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = Math.floor(start + (end - start) * progress);
            element.textContent = current;
            
            if (progress < 1) {
                requestAnimationFrame(updateValue);
            }
        };
        
        requestAnimationFrame(updateValue);
    }

    // Utility Methods
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatNumber(number) {
        return new Intl.NumberFormat('en-US').format(number);
    }

    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(new Date(date));
    }
}

// Initialize UI Manager
window.uiManager = new UIManager();
