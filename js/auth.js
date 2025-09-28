// js/auth.js - Authentication management
document.addEventListener('DOMContentLoaded', () => {
    class AuthManager {
        constructor() {
            this.currentUser = null;
            this.isAuthenticated = false;
        }

        async init() {
            const token = localStorage.getItem('access_token');
            if (token) {
                try {
                    // Assuming api.setToken exists to set the token for API calls
                    if (typeof api !== 'undefined' && api.setToken) {
                        api.setToken(token);
                    }
                    
                    const user = await api.getProfile();
                    this.setUser(user);
                } catch (error) {
                    console.error('Failed to get user profile:', error);
                    this.logout();
                }
            }
            this.updateUI();
        }

        setUser(user) {
            this.currentUser = user;
            this.isAuthenticated = true;
            localStorage.setItem('user', JSON.stringify(user));
        }

        async login(username, password) {
            try {
                const response = await api.login({ username, password });
                
                // Store the token if provided
                if (response.access_token) {
                    localStorage.setItem('access_token', response.access_token);
                    if (typeof api !== 'undefined' && api.setToken) {
                        api.setToken(response.access_token);
                    }
                }
                
                this.setUser(response.user);
                this.updateUI();
                showToast('Login successful!', 'success');
                hideModal('login-modal');
                
                // Navigate to dashboard if function exists
                if (typeof showPage === 'function') {
                    showPage('dashboard');
                }
                
                return true;
            } catch (error) {
                console.error('Login error:', error);
                showToast(error.message || 'Login failed', 'error');
                return false;
            }
        }

        async register(userData) {
            try {
                const response = await api.register(userData);
                
                // Store the token if provided
                if (response.access_token) {
                    localStorage.setItem('access_token', response.access_token);
                    if (typeof api !== 'undefined' && api.setToken) {
                        api.setToken(response.access_token);
                    }
                }
                
                this.setUser(response.user);
                this.updateUI();
                showToast('Registration successful!', 'success');
                hideModal('register-modal');
                
                // Navigate to dashboard if function exists
                if (typeof showPage === 'function') {
                    showPage('dashboard');
                }
                
                return true;
            } catch (error) {
                console.error('Registration error:', error);
                showToast(error.message || 'Registration failed', 'error');
                return false;
            }
        }

        logout() {
            this.currentUser = null;
            this.isAuthenticated = false;
            localStorage.removeItem('access_token');
            localStorage.removeItem('user');
            
            if (typeof api !== 'undefined' && api.setToken) {
                api.setToken(null);
            }
            
            this.updateUI();
            
            if (typeof showPage === 'function') {
                showPage('home');
            }
            
            showToast('Logged out successfully', 'info');
        }

        updateUI() {
            const guestMenu = document.getElementById('guest-menu');
            const userMenu = document.getElementById('user-menu');
            const userName = document.getElementById('user-name');
            const userAvatar = document.getElementById('user-avatar');

            if (this.isAuthenticated && this.currentUser) {
                if (guestMenu) guestMenu.classList.add('hidden');
                if (userMenu) userMenu.classList.remove('hidden');
                
                if (userName) {
                    userName.textContent = this.currentUser.first_name || this.currentUser.username;
                }
                
                if (userAvatar && this.currentUser.avatar) {
                    userAvatar.src = this.currentUser.avatar;
                    userAvatar.alt = `${this.currentUser.username}'s avatar`;
                }

                // Show/hide user type specific elements
                this.updateUserTypeElements();
            } else {
                if (guestMenu) guestMenu.classList.remove('hidden');
                if (userMenu) userMenu.classList.add('hidden');
            }
        }

        updateUserTypeElements() {
            if (!this.currentUser) return;

            const freelancerElements = document.querySelectorAll('.user-type-freelancer');
            const clientElements = document.querySelectorAll('.user-type-client');

            freelancerElements.forEach(el => {
                el.style.display = this.currentUser.user_type === 'freelancer' ? '' : 'none';
            });

            clientElements.forEach(el => {
                el.style.display = this.currentUser.user_type === 'client' ? '' : 'none';
            });
        }

        requireAuth() {
            if (!this.isAuthenticated) {
                showToast('Please log in to access this feature', 'warning');
                showLogin();
                return false;
            }
            return true;
        }
    }

    // Global auth manager
    window.auth = new AuthManager();

    // Initialize auth manager
    auth.init();

    // Form handlers
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('login-username')?.value;
            const password = document.getElementById('login-password')?.value;
            
            if (!username || !password) {
                showToast('Please fill in all fields', 'error');
                return;
            }
            
            // Disable submit button during login
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
            }
            
            try {
                await auth.login(username, password);
            } finally {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const userData = {
                username: document.getElementById('register-username')?.value,
                email: document.getElementById('register-email')?.value,
                first_name: document.getElementById('register-first-name')?.value,
                last_name: document.getElementById('register-last-name')?.value,
                user_type: document.getElementById('register-user-type')?.value,
                password: document.getElementById('register-password')?.value,
                password_confirm: document.getElementById('register-password-confirm')?.value
            };

            // Validate required fields
            if (!userData.username || !userData.email || !userData.password || !userData.user_type) {
                showToast('Please fill in all required fields', 'error');
                return;
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                showToast('Please enter a valid email address', 'error');
                return;
            }

            // Validate passwords match
            if (userData.password !== userData.password_confirm) {
                showToast('Passwords do not match', 'error');
                return;
            }

            // Validate password strength (optional)
            if (userData.password.length < 8) {
                showToast('Password must be at least 8 characters long', 'error');
                return;
            }

            // ✅ KEEP password_confirm - Django backend needs it for validation!
            // Don't delete userData.password_confirm here
            
            // Disable submit button during registration
            const submitBtn = registerForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Creating Account...';
            }
            
            try {
                await auth.register(userData);
            } finally {
                // Re-enable submit button
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Account';
                }
            }
        });
    }

    // Modal functions
    window.showLogin = function() {
        const loginModal = document.getElementById('login-modal');
        if (loginModal) {
            loginModal.classList.remove('hidden');
            
            // Focus on username field
            const usernameField = document.getElementById('login-username');
            if (usernameField) {
                setTimeout(() => usernameField.focus(), 100);
            }
        }
    };

    window.showRegister = function() {
        const registerModal = document.getElementById('register-modal');
        if (registerModal) {
            registerModal.classList.remove('hidden');
            
            // Focus on first name field
            const firstNameField = document.getElementById('register-first-name');
            if (firstNameField) {
                setTimeout(() => firstNameField.focus(), 100);
            }
        }
    };

    window.hideModal = function(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            
            // Clear form data when hiding modals
            const forms = modal.querySelectorAll('form');
            forms.forEach(form => {
                if (form) form.reset();
            });
        }
    };

    window.toggleUserDropdown = function() {
        const dropdown = document.getElementById('user-dropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    };

    window.logout = function() {
        auth.logout();
    };

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        const dropdown = document.getElementById('user-dropdown');
        if (!dropdown) return;
        
        const button = dropdown.previousElementSibling;
        
        if (!dropdown.contains(e.target) && !button?.contains(e.target)) {
            dropdown.classList.add('hidden');
        }
    });

    // Close modals when clicking outside or pressing Escape
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-backdrop') || 
            e.target.classList.contains('bg-gray-600')) {
            const modals = document.querySelectorAll('[id$="-modal"]');
            modals.forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    hideModal(modal.id);
                }
            });
        }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const modals = document.querySelectorAll('[id$="-modal"]');
            modals.forEach(modal => {
                if (!modal.classList.contains('hidden')) {
                    hideModal(modal.id);
                }
            });
        }
    });

    // Switch between login and register modals
    window.switchToRegister = function() {
        hideModal('login-modal');
        showRegister();
    };

    window.switchToLogin = function() {
        hideModal('register-modal');
        showLogin();
    };
});