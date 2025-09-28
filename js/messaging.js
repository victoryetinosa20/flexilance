class MessagingManager {
    constructor() {
        this.conversations = [];
        this.currentConversation = null;
        this.messages = [];
        this.messagePolling = null;
    }

    async loadConversations() {
        if (!auth.isAuthenticated) return;

        try {
            this.conversations = await api.getConversations();
            this.displayConversations();
        } catch (error) {
            console.error('Failed to load conversations:', error);
            showToast('Failed to load conversations', 'error');
        }
    }

    displayConversations() {
        const container = document.getElementById('conversations-list');
        if (!container) return;

        if (this.conversations.length === 0) {
            container.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fas fa-comments text-2xl mb-2"></i>
                    <p>No conversations yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.conversations.map(conversation => {
            const otherParticipant = conversation.participants.find(p => p.id !== auth.currentUser.id);
            const lastMessage = conversation.last_message;
            
            return `
                <div class="conversation-item p-4 border-b hover:bg-gray-50 cursor-pointer ${
                    this.currentConversation?.id === conversation.id ? 'bg-blue-50' : ''
                }" onclick="messagingManager.selectConversation(${conversation.id})">
                    <div class="flex items-center space-x-3">
                        <img class="h-10 w-10 rounded-full" 
                             src="${otherParticipant?.avatar || 'https://via.placeholder.com/40'}" 
                             alt="${otherParticipant?.username}">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-center">
                                <p class="text-sm font-medium text-gray-900 truncate">
                                    ${otherParticipant?.first_name || otherParticipant?.username}
                                </p>
                                <p class="text-xs text-gray-500">
                                    ${lastMessage ? timeAgo(lastMessage.created_at) : ''}
                                </p>
                            </div>
                            <p class="text-sm text-gray-500 truncate">
                                ${lastMessage ? lastMessage.content : 'No messages yet'}
                            </p>
                            ${conversation.unread_count > 0 ? `
                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    ${conversation.unread_count} new
                                </span>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    async selectConversation(conversationId) {
        this.currentConversation = this.conversations.find(c => c.id === conversationId);
        if (!this.currentConversation) return;

        // Update UI
        this.displayConversations(); // Refresh to show selection
        document.getElementById('chat-header').classList.remove('hidden');
        document.getElementById('chat-input-area').classList.remove('hidden');
        
        const otherParticipant = this.currentConversation.participants.find(p => p.id !== auth.currentUser.id);
        document.getElementById('chat-partner-name').textContent = 
            otherParticipant?.first_name || otherParticipant?.username;

        // Load messages
        await this.loadMessages(conversationId);
        
        // Start polling for new messages
        this.startMessagePolling();
    }

    async loadMessages(conversationId) {
        try {
            this.messages = await api.getMessages(conversationId);
            this.displayMessages();
        } catch (error) {
            console.error('Failed to load messages:', error);
            showToast('Failed to load messages', 'error');
        }
    }

    displayMessages() {
        const container = document.getElementById('chat-messages');
        if (!container) return;

        if (this.messages.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <i class="fas fa-comment-alt text-2xl mb-2"></i>
                    <p>No messages in this conversation yet</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.messages.map(message => `
            <div class="message ${message.sender.id === auth.currentUser.id ? 'sent' : 'received'}">
                <div class="flex ${message.sender.id === auth.currentUser.id ? 'justify-end' : 'justify-start'}">
                    <div class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        message.sender.id === auth.currentUser.id 
                            ? 'bg-blue-600 text-white' 
                            : 'bg-gray-200 text-gray-900'
                    }">
                        <p class="text-sm">${message.content}</p>
                        <p class="text-xs ${
                            message.sender.id === auth.currentUser.id ? 'text-blue-200' : 'text-gray-500'
                        } mt-1">
                            ${formatDate(message.created_at)}
                        </p>
                    </div>
                </div>
            </div>
        `).join('');

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;
    }

    async sendMessage() {
        if (!this.currentConversation) return;

        const input = document.getElementById('message-input');
        const content = input.value.trim();
        
        if (!content) return;

        try {
            const message = await api.sendMessage(this.currentConversation.id, content);
            this.messages.push(message);
            this.displayMessages();
            input.value = '';
            input.focus();
        } catch (error) {
            console.error('Failed to send message:', error);
            showToast('Failed to send message', 'error');
        }
    }

    startMessagePolling() {
        if (this.messagePolling) {
            clearInterval(this.messagePolling);
        }

        this.messagePolling = setInterval(() => {
            if (this.currentConversation) {
                this.loadMessages(this.currentConversation.id);
            }
        }, 5000);
    }

    stopMessagePolling() {
        if (this.messagePolling) {
            clearInterval(this.messagePolling);
            this.messagePolling = null;
        }
    }
}