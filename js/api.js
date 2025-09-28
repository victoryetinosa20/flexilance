// js/api.js - API client for communicating with Django backend

class APIClient {
    constructor() {
        this.baseURL = 'http://127.0.0.1:8000/api';
        this.token = localStorage.getItem('access_token');
    }

    // Helper method to get headers
    getHeaders(includeAuth = true) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (includeAuth && this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Helper method to handle responses - FIXED VERSION
    async handleResponse(response) {
        let data;
        
        // Try to parse JSON, but handle cases where response is not JSON
        try {
            data = await response.json();
        } catch (error) {
            // If JSON parsing fails, create a generic error object
            data = { error: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        if (!response.ok) {
            // Log the full error for debugging
            console.error('API Error:', {
                status: response.status,
                statusText: response.statusText,
                data: data
            });
            
            // Extract error message from various possible fields
            const errorMessage = data.detail || 
                                data.error || 
                                data.message ||
                                (data.non_field_errors && data.non_field_errors[0]) ||
                                JSON.stringify(data) ||
                                'An error occurred';
            
            throw new Error(errorMessage);
        }
        
        return data;
    }

    // Update token
    setToken(token) {
        this.token = token;
        if (token) {
            localStorage.setItem('access_token', token);
        } else {
            localStorage.removeItem('access_token');
        }
    }

    // Authentication endpoints
    async register(userData) {
        console.log('Sending registration data:', userData); // Debug log
        
        const response = await fetch(`${this.baseURL}/auth/register/`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(userData)
        });
        
        const data = await this.handleResponse(response);
        if (data.access) {
            this.setToken(data.access);
        }
        return data;
    }

    async login(credentials) {
        const response = await fetch(`${this.baseURL}/auth/login/`, {
            method: 'POST',
            headers: this.getHeaders(false),
            body: JSON.stringify(credentials)
        });
        
        const data = await this.handleResponse(response);
        if (data.access) {
            this.setToken(data.access);
        }
        return data;
    }

    async getProfile() {
        const response = await fetch(`${this.baseURL}/auth/profile/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async updateProfile(profileData) {
        const response = await fetch(`${this.baseURL}/auth/profile/update/`, {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify(profileData)
        });
        
        return await this.handleResponse(response);
    }

    // Jobs endpoints
    async getJobs(params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const response = await fetch(`${this.baseURL}/jobs/?${queryString}`, {
            headers: this.getHeaders(false)
        });
        
        return await this.handleResponse(response);
    }

    async getJob(jobId) {
        const response = await fetch(`${this.baseURL}/jobs/${jobId}/`, {
            headers: this.getHeaders(false)
        });
        
        return await this.handleResponse(response);
    }

    async createJob(jobData) {
        const response = await fetch(`${this.baseURL}/jobs/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(jobData)
        });
        
        return await this.handleResponse(response);
    }

    async getMyJobs() {
        const response = await fetch(`${this.baseURL}/jobs/my-jobs/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async getJobCategories() {
        const response = await fetch(`${this.baseURL}/jobs/categories/`, {
            headers: this.getHeaders(false)
        });
        
        return await this.handleResponse(response);
    }

    // Proposals endpoints
    async submitProposal(jobId, proposalData) {
        const response = await fetch(`${this.baseURL}/proposals/job/${jobId}/submit/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify(proposalData)
        });
        
        return await this.handleResponse(response);
    }

    async getMyProposals() {
        const response = await fetch(`${this.baseURL}/proposals/my-proposals/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async getJobProposals(jobId) {
        const response = await fetch(`${this.baseURL}/proposals/job/${jobId}/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async acceptProposal(proposalId) {
        const response = await fetch(`${this.baseURL}/proposals/${proposalId}/accept/`, {
            method: 'POST',
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    // Contracts endpoints
    async getMyContracts() {
        const response = await fetch(`${this.baseURL}/contracts/my-contracts/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async getContract(contractId) {
        const response = await fetch(`${this.baseURL}/contracts/${contractId}/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    // Messaging endpoints
    async getConversations() {
        const response = await fetch(`${this.baseURL}/messaging/conversations/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async startConversation(recipientId) {
        const response = await fetch(`${this.baseURL}/messaging/conversations/start/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ recipient_id: recipientId })
        });
        
        return await this.handleResponse(response);
    }

    async getMessages(conversationId) {
        const response = await fetch(`${this.baseURL}/messaging/conversations/${conversationId}/messages/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async sendMessage(conversationId, content) {
        const response = await fetch(`${this.baseURL}/messaging/conversations/${conversationId}/messages/`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ content })
        });
        
        return await this.handleResponse(response);
    }

    // Payments endpoints
    async getPaymentHistory() {
        const response = await fetch(`${this.baseURL}/payments/history/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async getEarnings() {
        const response = await fetch(`${this.baseURL}/payments/earnings/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }

    async getEarningsSummary() {
        const response = await fetch(`${this.baseURL}/payments/earnings/summary/`, {
            headers: this.getHeaders()
        });
        
        return await this.handleResponse(response);
    }
}

// Create global API instance
const api = new APIClient();

// Utility functions
function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    
    const bgColor = {
        'success': 'bg-green-500',
        'error': 'bg-red-500',
        'warning': 'bg-yellow-500',
        'info': 'bg-blue-500'
    }[type] || 'bg-blue-500';
    
    toast.className = `${bgColor} text-white px-6 py-3 rounded-lg shadow-lg fade-in`;
    toast.innerHTML = `
        <div class="flex items-center justify-between">
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (toast.parentElement) {
            toast.remove();
        }
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function timeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
}