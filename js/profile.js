
class ProfileManager {
    constructor() {
        this.skills = [];
    }

    async loadProfile() {
        if (!auth.isAuthenticated) return;

        try {
            const profile = await api.getProfile();
            this.populateProfileForm(profile);
            this.loadProfileStats();
        } catch (error) {
            console.error('Failed to load profile:', error);
            showToast('Failed to load profile', 'error');
        }
    }

    populateProfileForm(profile) {
        // Basic info
        document.getElementById('profile-name').textContent = 
            `${profile.first_name} ${profile.last_name}`;
        document.getElementById('profile-user-type').textContent = 
            profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1);
        document.getElementById('profile-location').textContent = profile.location || 'Location not set';

        // Form fields
        document.getElementById('profile-first-name').value = profile.first_name || '';
        document.getElementById('profile-last-name').value = profile.last_name || '';
        document.getElementById('profile-email').value = profile.email || '';
        document.getElementById('profile-phone').value = profile.phone || '';
        document.getElementById('profile-location-input').value = profile.location || '';
        document.getElementById('profile-website').value = profile.website || '';
        document.getElementById('profile-bio').value = profile.bio || '';
        
        if (profile.hourly_rate) {
            document.getElementById('profile-hourly-rate').value = profile.hourly_rate;
        }

        // Avatar
        if (profile.avatar) {
            document.getElementById('profile-avatar').src = profile.avatar;
        }

        // Skills
        this.skills = Array.isArray(profile.skills) ? profile.skills : [];
        this.displaySkills();
    }

    displaySkills() {
        const container = document.getElementById('skills-input');
        if (!container) return;

        container.innerHTML = this.skills.map(skill => `
            <span class="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                ${skill}
                <button type="button" onclick="profileManager.removeSkill('${skill}')" 
                        class="ml-2 text-blue-600 hover:text-blue-800">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </span>
        `).join('');
    }

    addSkill(skill) {
        skill = skill.trim();
        if (skill && !this.skills.includes(skill)) {
            this.skills.push(skill);
            this.displaySkills();
        }
    }

    removeSkill(skill) {
        this.skills = this.skills.filter(s => s !== skill);
        this.displaySkills();
    }

    async updateProfile() {
        const profileData = {
            first_name: document.getElementById('profile-first-name').value,
            last_name: document.getElementById('profile-last-name').value,
            email: document.getElementById('profile-email').value,
            phone: document.getElementById('profile-phone').value,
            location: document.getElementById('profile-location-input').value,
            website: document.getElementById('profile-website').value,
            bio: document.getElementById('profile-bio').value,
            skills: this.skills
        };

        const hourlyRate = document.getElementById('profile-hourly-rate').value;
        if (hourlyRate) {
            profileData.hourly_rate = parseFloat(hourlyRate);
        }

        try {
            const updatedProfile = await api.updateProfile(profileData);
            auth.setUser(updatedProfile);
            auth.updateUI();
            showToast('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showToast(error.message, 'error');
        }
    }

    loadProfileStats() {
        // Mock stats - replace with real data
        document.getElementById('profile-jobs-count').textContent = '12';
        document.getElementById('profile-earnings').textContent = '$4,250';
        document.getElementById('profile-rating').textContent = '4.8';
    }
}

// Global instances
window.dashboardManager = new DashboardManager();
window.messagingManager = new MessagingManager();
window.profileManager = new ProfileManager();

// Global functions
function sendMessage() {
    window.messagingManager.sendMessage();
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Profile form submission
    const profileForm = document.getElementById('profile-form');
    if (profileForm) {
        profileForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.profileManager.updateProfile();
        });
    }

    // Skills input
    const skillInput = document.getElementById('new-skill');
    if (skillInput) {
        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                window.profileManager.addSkill(e.target.value);
                e.target.value = '';
            }
        });
    }

    // Message input
    const messageInput = document.getElementById('message-input');
    if (messageInput) {
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                window.messagingManager.sendMessage();
            }
        });
    }
});

// Cleanup when leaving messages page
window.addEventListener('beforeunload', () => {
    if (window.messagingManager) {
        window.messagingManager.stopMessagePolling();
    }
});