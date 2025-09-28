// js/jobs.js - Jobs management

class JobsManager {
    constructor() {
        this.currentJobs = [];
        this.categories = [];
        this.currentFilters = {};
    }

    async init() {
        await this.loadCategories();
        await this.loadJobs();
        this.setupEventListeners();
    }

    async loadCategories() {
        try {
            this.categories = await api.getJobCategories();
            this.populateCategorySelects();
        } catch (error) {
            console.error('Failed to load categories:', error);
        }
    }

    populateCategorySelects() {
        const selects = document.querySelectorAll('#category-filter, #job-category');
        selects.forEach(select => {
            // Clear existing options (except first)
            while (select.children.length > 1) {
                select.removeChild(select.lastChild);
            }
            
            this.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                select.appendChild(option);
            });
        });
    }

    async loadJobs(filters = {}) {
        const jobsList = document.getElementById('jobs-list');
        const jobsLoading = document.getElementById('jobs-loading');
        
        jobsLoading.classList.remove('hidden');
        
        try {
            const response = await api.getJobs(filters);
            this.currentJobs = response.results || response;
            this.displayJobs();
            this.displayRecentJobs(); // Update home page
        } catch (error) {
            console.error('Failed to load jobs:', error);
            showToast('Failed to load jobs', 'error');
        } finally {
            jobsLoading.classList.add('hidden');
        }
    }

    displayJobs() {
        const jobsList = document.getElementById('jobs-list');
        
        if (this.currentJobs.length === 0) {
            jobsList.innerHTML = `
                <div class="text-center py-8">
                    <i class="fas fa-briefcase text-4xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600">No jobs found matching your criteria.</p>
                </div>
            `;
            return;
        }

        jobsList.innerHTML = this.currentJobs.map(job => this.createJobCard(job)).join('');
    }

    displayRecentJobs() {
        const recentJobsContainer = document.getElementById('recent-jobs');
        if (!recentJobsContainer) return;

        const recentJobs = this.currentJobs.slice(0, 5);
        
        if (recentJobs.length === 0) {
            recentJobsContainer.innerHTML = '<p class="text-gray-600">No recent jobs available.</p>';
            return;
        }

        recentJobsContainer.innerHTML = recentJobs.map(job => `
            <div class="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <div class="flex justify-between items-start mb-2">
                    <h3 class="font-semibold text-lg">${job.title}</h3>
                    <span class="text-blue-600 font-medium">${formatCurrency(job.budget_min)}</span>
                </div>
                <p class="text-gray-600 text-sm mb-2">${job.description.substring(0, 100)}...</p>
                <div class="flex justify-between items-center text-sm text-gray-500">
                    <span><i class="fas fa-user mr-1"></i>${job.client.username}</span>
                    <span><i class="fas fa-clock mr-1"></i>${timeAgo(job.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    createJobCard(job) {
        const skills = Array.isArray(job.skills_required) ? job.skills_required : [];
        
        return `
            <div class="bg-white rounded-lg shadow-md p-6 card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-xl font-semibold mb-2">${job.title}</h3>
                        <p class="text-gray-600 mb-3">${job.description.length > 200 ? job.description.substring(0, 200) + '...' : job.description}</p>
                    </div>
                    <div class="text-right ml-4">
                        <div class="text-2xl font-bold text-blue-600 mb-1">
                            ${formatCurrency(job.budget_min)}${job.budget_max ? ' - ' + formatCurrency(job.budget_max) : ''}
                        </div>
                        <div class="text-sm text-gray-500">${job.budget_type === 'fixed' ? 'Fixed Price' : 'Hourly'}</div>
                    </div>
                </div>
                
                <div class="flex flex-wrap gap-2 mb-4">
                    ${skills.map(skill => `<span class="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">${skill}</span>`).join('')}
                </div>
                
                <div class="flex justify-between items-center text-sm text-gray-500 mb-4">
                    <div class="flex space-x-4">
                        <span><i class="fas fa-user mr-1"></i>${job.client.username}</span>
                        <span><i class="fas fa-tag mr-1"></i>${job.category_name || 'Uncategorized'}</span>
                        <span><i class="fas fa-level-up-alt mr-1"></i>${this.formatExperienceLevel(job.experience_level)}</span>
                        ${job.duration ? `<span><i class="fas fa-clock mr-1"></i>${job.duration}</span>` : ''}
                    </div>
                    <span>${timeAgo(job.created_at)}</span>
                </div>
                
                <div class="flex justify-between items-center">
                    <div class="text-sm text-gray-500">
                        <span><i class="fas fa-paper-plane mr-1"></i>${job.proposals_count} proposals</span>
                    </div>
                    
                    <div class="flex space-x-2">
                        ${auth.isAuthenticated && auth.currentUser.user_type === 'freelancer' ? 
                            `<button onclick="showProposalModal(${job.id})" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors">
                                Submit Proposal
                            </button>` : 
                            `<button onclick="showJobDetails(${job.id})" class="bg-gray-100 text-gray-700 px-4 py-2 rounded hover:bg-gray-200 transition-colors">
                                View Details
                            </button>`
                        }
                        ${auth.isAuthenticated ? 
                            `<button onclick="startConversationWithClient(${job.client.id})" class="bg-green-100 text-green-700 px-4 py-2 rounded hover:bg-green-200 transition-colors">
                                <i class="fas fa-message"></i>
                            </button>` : ''
                        }
                    </div>
                </div>
            </div>
        `;
    }

    formatExperienceLevel(level) {
        const levels = {
            'entry': 'Entry Level',
            'intermediate': 'Intermediate',
            'expert': 'Expert'
        };
        return levels[level] || level;
    }

    setupEventListeners() {
        // Search input
        const searchInput = document.getElementById('job-search');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.currentFilters.search = e.target.value;
                    this.loadJobs(this.currentFilters);
                }, 500);
            });
        }

        // Post job form
        const postJobForm = document.getElementById('post-job-form');
        if (postJobForm) {
            postJobForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePostJob();
            });
        }
    }

    async handlePostJob() {
        if (!auth.requireAuth()) return;
        
        if (auth.currentUser.user_type !== 'client') {
            showToast('Only clients can post jobs', 'error');
            return;
        }

        const jobData = {
            title: document.getElementById('job-title').value,
            description: document.getElementById('job-description').value,
            category: document.getElementById('job-category').value,
            budget_type: document.getElementById('job-budget-type').value,
            budget_min: parseFloat(document.getElementById('job-budget-min').value),
            budget_max: document.getElementById('job-budget-max').value ? 
                parseFloat(document.getElementById('job-budget-max').value) : null,
            experience_level: document.getElementById('job-experience').value,
            duration: document.getElementById('job-duration').value,
            skills_required: document.getElementById('job-skills').value
                .split(',').map(s => s.trim()).filter(s => s)
        };

        try {
            await api.createJob(jobData);
            showToast('Job posted successfully!', 'success');
            hideModal('post-job-modal');
            document.getElementById('post-job-form').reset();
            await this.loadJobs();
            
            // Refresh dashboard if on dashboard page
            if (window.dashboardManager) {
                window.dashboardManager.loadDashboard();
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    }
}

// Global jobs manager
const jobsManager = new JobsManager();

// Global functions
function applyFilters() {
    const filters = {
        search: document.getElementById('job-search').value,
        category: document.getElementById('category-filter').value,
        budget_type: document.getElementById('budget-filter').value,
        experience: document.getElementById('experience-filter').value
    };
    
    // Remove empty filters
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    jobsManager.currentFilters = filters;
    jobsManager.loadJobs(filters);
}

function showPostJob() {
    if (!auth.requireAuth()) return;
    
    if (auth.currentUser.user_type !== 'client') {
        showToast('Only clients can post jobs', 'error');
        return;
    }
    
    document.getElementById('post-job-modal').classList.remove('hidden');
    document.getElementById('job-title').focus();
}

function toggleBudgetFields() {
    const budgetType = document.getElementById('job-budget-type').value;
    const maxBudgetField = document.getElementById('max-budget-field');
    const maxBudgetInput = document.getElementById('job-budget-max');
    
    if (budgetType === 'hourly') {
        maxBudgetField.style.display = 'none';
        maxBudgetInput.required = false;
    } else {
        maxBudgetField.style.display = '';
        maxBudgetInput.required = false; // Optional for fixed price too
    }
}

function showJobDetails(jobId) {
    // Implementation for job details modal/page
    console.log('Show job details for:', jobId);
    // This could open a modal or navigate to a details page
}

function showProposalModal(jobId) {
    if (!auth.requireAuth()) return;
    
    if (auth.currentUser.user_type !== 'freelancer') {
        showToast('Only freelancers can submit proposals', 'error');
        return;
    }
    
    // Create and show proposal modal
    const modalHTML = `
        <div id="proposal-modal" class="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div class="flex justify-between items-center mb-4">
                    <h3 class="text-lg font-semibold">Submit Proposal</h3>
                    <button onclick="hideModal('proposal-modal')" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="proposal-form" class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Cover Letter</label>
                        <textarea id="proposal-cover-letter" rows="6" required 
                            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Explain why you're the best fit for this job..."></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Bid Amount ($)</label>
                            <input type="number" id="proposal-bid-amount" required min="0" step="0.01"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">Delivery Time (days)</label>
                            <input type="number" id="proposal-delivery-time" required min="1"
                                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors">
                        Submit Proposal
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Handle form submission
    document.getElementById('proposal-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const proposalData = {
            cover_letter: document.getElementById('proposal-cover-letter').value,
            bid_amount: parseFloat(document.getElementById('proposal-bid-amount').value),
            delivery_time: parseInt(document.getElementById('proposal-delivery-time').value)
        };
        
        try {
            await api.submitProposal(jobId, proposalData);
            showToast('Proposal submitted successfully!', 'success');
            document.getElementById('proposal-modal').remove();
            // Refresh jobs to update proposal count
            jobsManager.loadJobs(jobsManager.currentFilters);
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
}

async function startConversationWithClient(clientId) {
    if (!auth.requireAuth()) return;
    
    try {
        await api.startConversation(clientId);
        showToast('Conversation started! Check your messages.', 'success');
        // Could redirect to messages page
        showPage('messages');
    } catch (error) {
        showToast(error.message, 'error');
    }
}