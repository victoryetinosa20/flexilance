// js/dashboard.js - Dashboard management
class DashboardManager {
    constructor() {
        this.stats = {};
    }

    async loadDashboard() {
        if (!auth.isAuthenticated) return;
        
        showLoading('dashboard-stats', 'Loading dashboard...');
        
        try {
            await Promise.all([
                this.loadStats(),
                this.loadRecentActivity()
            ]);
        } catch (error) {
            console.error('Dashboard load error:', error);
            showToast('Failed to load dashboard', 'error');
        }
    }

    async loadStats() {
        try {
            const statsContainer = document.getElementById('dashboard-stats');
            
            if (auth.currentUser.user_type === 'freelancer') {
                const [proposals, contracts, earnings] = await Promise.all([
                    api.getMyProposals(),
                    api.getMyContracts(),
                    api.getEarningsSummary()
                ]);

                statsContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <i class="fas fa-paper-plane text-blue-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Proposals</p>
                                <p class="text-2xl font-semibold text-gray-900">${proposals.length}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <i class="fas fa-handshake text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Active Contracts</p>
                                <p class="text-2xl font-semibold text-gray-900">${contracts.length}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <i class="fas fa-wallet text-yellow-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Earnings</p>
                                <p class="text-2xl font-semibold text-gray-900">${formatCurrency(earnings.total_earned)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <i class="fas fa-star text-purple-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Success Rate</p>
                                <p class="text-2xl font-semibold text-gray-900">95%</p>
                            </div>
                        </div>
                    </div>
                `;

                // Load recent proposals
                this.loadRecentProposals(proposals.slice(0, 5));
                this.loadActiveContracts(contracts.slice(0, 5));
                
            } else if (auth.currentUser.user_type === 'client') {
                const [jobs, payments] = await Promise.all([
                    api.getMyJobs(),
                    api.getPaymentHistory()
                ]);

                const activeJobs = jobs.filter(job => job.status === 'open').length;
                const completedJobs = jobs.filter(job => job.status === 'completed').length;
                const totalSpent = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

                statsContainer.innerHTML = `
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-blue-100 rounded-lg">
                                <i class="fas fa-briefcase text-blue-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Active Jobs</p>
                                <p class="text-2xl font-semibold text-gray-900">${activeJobs}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-green-100 rounded-lg">
                                <i class="fas fa-check-circle text-green-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Completed Jobs</p>
                                <p class="text-2xl font-semibold text-gray-900">${completedJobs}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-yellow-100 rounded-lg">
                                <i class="fas fa-dollar-sign text-yellow-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Total Spent</p>
                                <p class="text-2xl font-semibold text-gray-900">${formatCurrency(totalSpent)}</p>
                            </div>
                        </div>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <div class="flex items-center">
                            <div class="p-2 bg-purple-100 rounded-lg">
                                <i class="fas fa-users text-purple-600"></i>
                            </div>
                            <div class="ml-4">
                                <p class="text-sm font-medium text-gray-600">Hired Freelancers</p>
                                <p class="text-2xl font-semibold text-gray-900">${completedJobs}</p>
                            </div>
                        </div>
                    </div>
                `;

                // Load client specific content
                this.loadMyJobs(jobs.slice(0, 5));
                this.loadReceivedProposals();
            }
        } catch (error) {
            console.error('Stats load error:', error);
        }
    }

    async loadRecentActivity() {
        // Implementation for loading recent activity feed
    }

    loadRecentProposals(proposals) {
        const container = document.getElementById('recent-proposals');
        if (!container) return;

        if (proposals.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No proposals yet.</p>';
            return;
        }

        container.innerHTML = proposals.map(proposal => `
            <div class="border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-sm">${proposal.job.title}</h4>
                        <p class="text-xs text-gray-500 mt-1">${formatCurrency(proposal.bid_amount)} • ${proposal.delivery_time} days</p>
                    </div>
                    <span class="text-xs px-2 py-1 rounded-full ${
                        proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'declined' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                    }">${proposal.status}</span>
                </div>
                <p class="text-xs text-gray-400 mt-1">${timeAgo(proposal.created_at)}</p>
            </div>
        `).join('');
    }

    loadActiveContracts(contracts) {
        const container = document.getElementById('active-contracts');
        if (!container) return;

        if (contracts.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No active contracts.</p>';
            return;
        }

        container.innerHTML = contracts.map(contract => `
            <div class="border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-sm">${contract.job.title}</h4>
                        <p class="text-xs text-gray-500 mt-1">with ${contract.client.username}</p>
                    </div>
                    <span class="text-xs font-medium text-green-600">${formatCurrency(contract.amount)}</span>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xs px-2 py-1 rounded-full ${
                        contract.status === 'active' ? 'bg-blue-100 text-blue-800' :
                        contract.status === 'completed' ? 'bg-green-100 text-green-800' :
                        'bg-gray-100 text-gray-800'
                    }">${contract.status}</span>
                    <span class="text-xs text-gray-400">${timeAgo(contract.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    loadMyJobs(jobs) {
        const container = document.getElementById('my-jobs');
        if (!container) return;

        if (jobs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">No jobs posted yet.</p>';
            return;
        }

        container.innerHTML = jobs.map(job => `
            <div class="border-b border-gray-200 pb-3 mb-3 last:border-b-0">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <h4 class="font-medium text-sm">${job.title}</h4>
                        <p class="text-xs text-gray-500 mt-1">${job.proposals_count} proposals</p>
                    </div>
                    <span class="text-xs font-medium text-blue-600">${formatCurrency(job.budget_min)}</span>
                </div>
                <div class="flex justify-between items-center mt-2">
                    <span class="text-xs px-2 py-1 rounded-full ${
                        job.status === 'open' ? 'bg-green-100 text-green-800' :
                        job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        job.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                    }">${job.status.replace('_', ' ')}</span>
                    <span class="text-xs text-gray-400">${timeAgo(job.created_at)}</span>
                </div>
            </div>
        `).join('');
    }

    async loadReceivedProposals() {
        // Implementation for loading proposals received by client
        const container = document.getElementById('received-proposals');
        if (!container) return;
        
        container.innerHTML = '<p class="text-gray-500 text-sm">Loading proposals...</p>';
    }
}
