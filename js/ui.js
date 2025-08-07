// UI Management and Interactions
// Handles all UI updates, animations, and user interactions

class UIManager {
    constructor() {
        console.log('UIManager: Constructor called');
        this.currentSection = 'dashboard';
        this.modal = null;
        this.toastContainer = null;
        this.loadingSpinner = null;
        this.sidebarCollapsed = false;
        this.init();
    }

    init() {
        console.log('UIManager: Initializing...');
        this.setupElements();
        this.setupEventListeners();
        this.setupResponsiveHandling();
        this.initializeTooltips();
        console.log('UIManager: Initialization complete');
    }

    setupElements() {
        console.log('UIManager: Setting up elements...');
        
        // Main UI elements
        this.modal = Utils.$('#itemModal');
        this.toastContainer = Utils.$('#toastContainer');
        this.loadingSpinner = Utils.$('#loadingSpinner');
        this.sidebar = Utils.$('#sidebar');
        this.sidebarToggle = Utils.$('#sidebarToggle');
        
        // Log what we found
        console.log('UIManager: Elements found:', {
            modal: !!this.modal,
            toastContainer: !!this.toastContainer,
            loadingSpinner: !!this.loadingSpinner,
            sidebar: !!this.sidebar,
            sidebarToggle: !!this.sidebarToggle
        });
        
        // Navigation elements
        this.navLinks = Utils.$$('.nav-link');
        this.contentSections = Utils.$$('.content-section');
        
        console.log('UIManager: Navigation elements found:', {
            navLinks: this.navLinks.length,
            contentSections: this.contentSections.length
        });
        
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
            console.log('UIManager: Adding sidebar toggle event listener');
            this.sidebarToggle.addEventListener('click', (e) => {
                console.log('UIManager: Sidebar toggle clicked');
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            });
        } else {
            console.warn('UIManager: Sidebar toggle button not found!');
        }

        // Delegate mobile nav button clicks (for dynamic elements)
        document.addEventListener('click', (e) => {
            if (e.target.closest('#mobileNavBtn, .mobile-nav-btn')) {
                e.preventDefault();
                e.stopPropagation();
                this.toggleSidebar();
            }
        });

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

        // Outside click handling for closing mobile sidebar
        document.addEventListener('click', (e) => {
            if (this.isMobileView() && this.sidebar && this.sidebar.classList.contains('active')) {
                // Check if click is outside sidebar and not on toggle button
                if (!this.sidebar.contains(e.target) && 
                    !e.target.closest('#mobileNavBtn, .mobile-nav-btn, #sidebarToggle')) {
                    this.closeMobileSidebar();
                }
            }
            this.handleOutsideClick(e);
        });
    }

    setupResponsiveHandling() {
        console.log('UIManager: Setting up responsive handling');
        
        // Check if mobile view
        this.checkMobileView();
        
        // Add mobile header if needed
        if (this.isMobileView()) {
            console.log('UIManager: Mobile view detected, adding mobile header');
            this.addMobileHeader();
        } else {
            console.log('UIManager: Desktop view detected, initializing desktop sidebar');
            
            // Ensure sidebar is visible on desktop
            if (this.sidebar) {
                this.sidebar.style.transform = 'none';
                this.sidebar.style.display = 'block';
                this.sidebar.style.visibility = 'visible';
            }
            
            // Initialize desktop sidebar state
            const savedState = Utils.getStorage('sidebarCollapsed', false);
            this.sidebarCollapsed = savedState;
            this.sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
            
            // Update body class for CSS targeting
            document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            
            console.log('UIManager: Desktop sidebar state:', this.sidebarCollapsed ? 'collapsed' : 'expanded');
            
            // Update hamburger icon to match state
            this.updateHamburgerIcon();
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
        console.log('UIManager: toggleSidebar called, isMobileView:', this.isMobileView());
        
        if (this.isMobileView()) {
            this.toggleMobileSidebar();
        } else {
            // Desktop sidebar collapse
            this.sidebarCollapsed = !this.sidebarCollapsed;
            console.log('UIManager: Desktop sidebar collapsed state:', this.sidebarCollapsed);
            
            this.sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
            
            // The CSS will handle the main content transition automatically
            // But we can also do it via JavaScript for better control
            const mainContent = Utils.$('.main-content');
            if (mainContent) {
                // Let CSS handle the transition, but we can add a class for additional styling if needed
                document.body.classList.toggle('sidebar-collapsed', this.sidebarCollapsed);
            }
            
            // Save state
            Utils.setStorage('sidebarCollapsed', this.sidebarCollapsed);
            
            // Emit event
            this.emitEvent('sidebarToggled', { collapsed: this.sidebarCollapsed });
            
            // Update hamburger icon animation
            this.updateHamburgerIcon();
        }
    }

    updateHamburgerIcon() {
        const toggleIcon = this.sidebarToggle?.querySelector('i');
        if (toggleIcon) {
            // Add a subtle animation to indicate state change
            toggleIcon.style.transform = this.sidebarCollapsed ? 'rotate(90deg)' : 'rotate(0deg)';
            toggleIcon.style.transition = 'transform var(--transition-fast)';
        }
        
        // Update navigation tooltips for collapsed state
        this.updateNavigationTooltips();
    }

    updateNavigationTooltips() {
        this.navLinks.forEach(link => {
            const span = link.querySelector('span');
            if (span && this.sidebarCollapsed) {
                // Add title attribute for tooltip when collapsed
                link.setAttribute('title', span.textContent.trim());
            } else {
                // Remove title attribute when expanded
                link.removeAttribute('title');
            }
        });
    }

    toggleMobileSidebar() {
        const isActive = this.sidebar.classList.contains('active');
        this.sidebar.classList.toggle('active', !isActive);
        
        // Toggle body scroll
        document.body.style.overflow = !isActive ? 'hidden' : '';
        
        // Toggle overlay
        let overlay = Utils.$('.sidebar-overlay');
        if (!overlay && !isActive) {
            overlay = this.createSidebarOverlay();
        }
        
        if (overlay) {
            overlay.classList.toggle('active', !isActive);
            if (isActive) {
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.remove();
                    }
                }, 300);
            }
        }
        
        // Update sidebar state
        this.sidebarCollapsed = isActive;
        
        // Emit event
        this.emitEvent('sidebarToggled', { mobile: true, active: !isActive });
    }

    closeMobileSidebar() {
        if (this.isMobileView() && this.sidebar) {
            this.sidebar.classList.remove('active');
            document.body.style.overflow = '';
            
            const overlay = Utils.$('.sidebar-overlay');
            if (overlay) {
                overlay.classList.remove('active');
                setTimeout(() => {
                    if (overlay.parentNode) {
                        overlay.remove();
                    }
                }, 300);
            }
            
            this.sidebarCollapsed = true;
            this.emitEvent('sidebarToggled', { mobile: true, active: false });
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
        // Check if mobile header already exists
        if (Utils.$('.mobile-header')) {
            return;
        }

        const header = document.createElement('div');
        header.className = 'mobile-header';
        header.innerHTML = `
            <button class="mobile-nav-btn" id="mobileNavBtn" aria-label="Toggle navigation">
                <i class="fas fa-bars"></i>
            </button>
            <div class="logo">
                <i class="fas fa-clinic-medical"></i>
                <span>ClinicInventory</span>
            </div>
            <div class="mobile-header-spacer"></div>
        `;

        const mainContent = Utils.$('.main-content');
        if (mainContent) {
            mainContent.prepend(header);
        }
    }

    removeMobileHeader() {
        const header = Utils.$('.mobile-header');
        if (header) {
            header.remove();
        }
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
        
        // Handle mobile/desktop transitions
        if (this.isMobileView()) {
            // Add mobile header if needed
            this.addMobileHeader();
            
            // Close desktop collapsed state
            this.sidebar.classList.remove('collapsed');
            
            // Reset main content margin
            const mainContent = Utils.$('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = '';
            }
        } else {
            // Remove mobile header
            this.removeMobileHeader();
            
            // Close mobile sidebar
            this.closeMobileSidebar();
            
            // Restore desktop sidebar state
            const savedState = Utils.getStorage('sidebarCollapsed', false);
            this.sidebarCollapsed = savedState;
            this.sidebar.classList.toggle('collapsed', this.sidebarCollapsed);
            
            // Update main content margin
            const mainContent = Utils.$('.main-content');
            if (mainContent) {
                mainContent.style.marginLeft = this.sidebarCollapsed ? 
                    'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)';
            }
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
