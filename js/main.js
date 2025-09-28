// js/main.js - Main application logic and page routing

class App {
    constructor() {
        this.currentPage = 'home';
        this.pages = ['home', 'jobs', 'dashboard', 'messages', 'profile', 'settings'];
    }

    async init() {
        // Initialize all managers
        await auth.init();
        await jobsManager.init();
        
        // Set up navigation
        this.setupNavigation();
        
        // Initialize page based on hash or default to home
        const hash = window.location.hash.slice(1);
        if (this.pages.includes(hash)) {
            this.showPage(hash);
        } else {
            this.showPage('home');
        }
        
        console.log('FlexiLance app initialized successfully!');
    }

    setupNavigation() {
        // Navigation links
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.dataset.page;
                if (page) {
                    this.showPage(page);
                }
            });
        });

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = window.location.hash.slice(1) || 'home';
            this.showPage(page, false);
        });
    }

    showPage(pageId, updateHistory = true) {
        // Check if page requires authentication
        const protectedPages = ['dashboard', 'messages', 'profile', 'settings'];
        if (protectedPages.includes(pageId) && !auth.requireAuth()) {
            return;
        }

        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.add('hidden');
        });

        // Show target page
        const targetPage = document.getElementById(`${pageId}-page`);
        if (targetPage) {
            targetPage.classList.remove('hidden');
            targetPage.classList.add('fade-in');
        }

        // Update navigation
        this.updateNavigation(pageId);

        // Update URL
        if (updateHistory) {
            window.history.pushState(null, null, `#${pageId}`);
        }

        // Load page-specific content
        this.loadPageContent(pageId);

        this.currentPage = pageId;
    }

    updateNavigation(activePageId) {
        document.querySelectorAll('.nav-link').forEach(link => {
            const page = link.dataset.page;
            if (page === activePageId) {
                link.classList.remove('text-gray-500', 'border-transparent');
                link.classList.add('text-gray-900', 'border-blue-500');
            } else {
                link.classList.remove('text-gray-900', 'border-blue-500');
                link.classList.add('text-gray-500', 'border-transparent');
            }
        });
    }

    async loadPageContent(pageId) {
        switch (pageId) {
            case 'home':
                await jobsManager.loadJobs();
                break;
            case 'jobs':
                await jobsManager.loadJobs(jobsManager.currentFilters);
                break;
            case 'dashboard':
                if (window.dashboardManager) {
                    await window.dashboardManager.loadDashboard();
                }
                break;
            case 'messages':
                if (window.messagingManager) {
                    await window.messagingManager.loadConversations();
                }
                break;
            case 'profile':
                if (window.profileManager) {
                    await window.profileManager.loadProfile();
                }
                break;
        }
    }
}

// Global functions for page navigation
function showPage(pageId) {
    if (window.app) {
        window.app.showPage(pageId);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    window.app = new App();
    await window.app.init();
});

// Utility functions
function showModal(modalId) {
    document.getElementById(modalId).classList.remove('hidden');
}

function hideModal(modalId) {
    document.getElementById(modalId).classList.add('hidden');
}

// Error handling for unhandled promises
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred', 'error');
});

// Handle network connectivity
window.addEventListener('online', () => {
    showToast('Connection restored', 'success');
});

window.addEventListener('offline', () => {
    showToast('No internet connection', 'warning');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Escape key closes modals
    if (e.key === 'Escape') {
        const modals = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
        modals.forEach(modal => modal.classList.add('hidden'));
    }
    
    // Ctrl/Cmd + K for search (when on jobs page)
    if ((e.ctrlKey || e.metaKey) && e.key === 'k' && window.app.currentPage === 'jobs') {
        e.preventDefault();
        const searchInput = document.getElementById('job-search');
        if (searchInput) {
            searchInput.focus();
        }
    }
});

// Auto-save drafts for forms (optional feature)
function setupAutoSave(formId, storageKey) {
    const form = document.getElementById(formId);
    if (!form) return;

    // Load saved data
    const savedData = localStorage.getItem(storageKey);
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            Object.keys(data).forEach(key => {
                const input = form.querySelector(`[name="${key}"], #${key}`);
                if (input) {
                    input.value = data[key];
                }
            });
        } catch (e) {
            console.warn('Failed to load saved form data:', e);
        }
    }

    // Save data on input
    form.addEventListener('input', debounce((e) => {
        const formData = new FormData(form);
        const data = {};
        
        // Get all form inputs
        form.querySelectorAll('input, textarea, select').forEach(input => {
            if (input.name || input.id) {
                const key = input.name || input.id;
                data[key] = input.value;
            }
        });
        
        localStorage.setItem(storageKey, JSON.stringify(data));
    }, 1000));

    // Clear saved data on successful submit
    form.addEventListener('submit', () => {
        localStorage.removeItem(storageKey);
    });
}

// Debounce utility
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Smooth scrolling for anchor links
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'A' && e.target.getAttribute('href')?.startsWith('#')) {
        e.preventDefault();
        const targetId = e.target.getAttribute('href').slice(1);
        const targetElement = document.getElementById(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }
});

// Form validation helpers
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    // At least 8 characters, 1 uppercase, 1 lowercase, 1 number
    const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
    return re.test(password);
}

// Loading states
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `
            <div class="text-center py-8">
                <i class="fas fa-spinner fa-spin text-2xl text-gray-400 mb-2"></i>
                <p class="text-gray-600">${message}</p>
            </div>
        `;
    }
}

function hideLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '';
    }
}

// Image upload handler
function handleImageUpload(inputElement, previewElement, maxSize = 5 * 1024 * 1024) {
    const file = inputElement.files[0];
    if (!file) return null;

    if (file.size > maxSize) {
        showToast('File size must be less than 5MB', 'error');
        inputElement.value = '';
        return null;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
        showToast('Please select a valid image file (JPEG, PNG, or GIF)', 'error');
        inputElement.value = '';
        return null;
    }

    // Show preview
    if (previewElement) {
        const reader = new FileReader();
        reader.onload = (e) => {
            previewElement.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    return file;
}

// Copy to clipboard
function copyToClipboard(text) {
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => {
            showToast('Copied to clipboard!', 'success');
        });
    } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showToast('Copied to clipboard!', 'success');
        } catch (err) {
            showToast('Failed to copy', 'error');
        }
        document.body.removeChild(textArea);
    }
}

// Share functionality
function shareJob(jobId, jobTitle) {
    if (navigator.share) {
        navigator.share({
            title: `Job: ${jobTitle}`,
            text: `Check out this job opportunity: ${jobTitle}`,
            url: `${window.location.origin}/#jobs?id=${jobId}`
        });
    } else {
        const url = `${window.location.origin}/#jobs?id=${jobId}`;
        copyToClipboard(url);
    }
}

// Search functionality with history
class SearchHistory {
    constructor(maxItems = 10) {
        this.maxItems = maxItems;
        this.storageKey = 'search_history';
    }

    add(searchTerm) {
        if (!searchTerm.trim()) return;
        
        let history = this.get();
        history = history.filter(item => item !== searchTerm);
        history.unshift(searchTerm);
        history = history.slice(0, this.maxItems);
        
        localStorage.setItem(this.storageKey, JSON.stringify(history));
    }

    get() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
        } catch {
            return [];
        }
    }

    clear() {
        localStorage.removeItem(this.storageKey);
    }
}

const searchHistory = new SearchHistory();

// Notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showToast('Notifications enabled!', 'success');
            }
        });
    }
}

// Show desktop notification
function showNotification(title, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            ...options
        });
    }
}

// Performance monitoring
function trackPageLoad() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('Page load time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            }, 0);
        });
    }
}

// Initialize performance tracking
trackPageLoad();

// Service worker registration (for offline support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

// Theme switching (optional feature)
class ThemeManager {
    constructor() {
        this.theme = localStorage.getItem('theme') || 'light';
        this.apply();
    }

    toggle() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        this.apply();
        localStorage.setItem('theme', this.theme);
    }

    apply() {
        if (this.theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }
}

// Initialize theme manager
const themeManager = new ThemeManager();

// Export for use in other modules
window.FlexiLance = {
    auth,
    jobsManager,
    showPage,
    showModal,
    hideModal,
    showToast,
    formatDate,
    formatCurrency,
    timeAgo,
    searchHistory,
    themeManager
};