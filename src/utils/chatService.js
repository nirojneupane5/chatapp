// Chat service using HTTP requests for true cross-browser/device communication
// Works across different browsers and devices with minimal server

class ChatService {
  constructor() {
    this.messages = [];
    this.currentUser = null;
    this.messageListeners = [];
    this.userListeners = [];
    this.activeUsers = new Set();
    this.pollInterval = null;
    this.sessionId = Date.now() + Math.random().toString(36);
    this.serverUrl = 'http://localhost:3001/api';
    
    // Start polling for updates
    this.startPolling();
    
    // Load initial data
    this.loadInitialData();
    
    // Cleanup when page unloads
    window.addEventListener('beforeunload', () => {
      this.cleanup();
    });
  }

  // Start polling for changes
  startPolling() {
    this.pollInterval = setInterval(() => {
      this.fetchUpdates();
      if (this.currentUser) {
        this.sendHeartbeat();
      }
    }, 1000); // Poll every second
  }

  // Load initial data from server
  async loadInitialData() {
    try {
      const response = await fetch(`${this.serverUrl}/chat`);
      if (response.ok) {
        const data = await response.json();
        this.messages = data.messages || [];
        this.activeUsers = new Set(data.activeUsers || []);
        this.notifyMessageListeners();
        this.notifyUserListeners();
      }
    } catch (error) {
      console.log('Server not available yet, using local mode');
      // Fallback to localStorage for development
      this.loadFromLocalStorage();
    }
  }

  // Fallback to localStorage
  loadFromLocalStorage() {
    try {
      const messages = localStorage.getItem('fallback_messages');
      if (messages) {
        this.messages = JSON.parse(messages);
        this.notifyMessageListeners();
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  // Fetch updates from server
  async fetchUpdates() {
    try {
      const response = await fetch(`${this.serverUrl}/chat`);
      if (response.ok) {
        const data = await response.json();
        
        // Update messages if changed
        if (JSON.stringify(data.messages) !== JSON.stringify(this.messages)) {
          this.messages = data.messages || [];
          this.notifyMessageListeners();
        }
        
        // Update active users if changed
        const newActiveUsers = new Set(data.activeUsers || []);
        if (newActiveUsers.size !== this.activeUsers.size || 
            !Array.from(newActiveUsers).every(user => this.activeUsers.has(user))) {
          this.activeUsers = newActiveUsers;
          this.notifyUserListeners();
        }
      }
    } catch (error) {
      // Server not available, use localStorage fallback
      this.syncWithLocalStorage();
    }
  }

  // Sync with localStorage as fallback
  syncWithLocalStorage() {
    try {
      // Check for localStorage changes (for same-browser communication)
      const messages = localStorage.getItem('fallback_messages');
      if (messages) {
        const parsedMessages = JSON.parse(messages);
        if (JSON.stringify(parsedMessages) !== JSON.stringify(this.messages)) {
          this.messages = parsedMessages;
          this.notifyMessageListeners();
        }
      }
    } catch (error) {
      console.error('Error syncing with localStorage:', error);
    }
  }

  // Send heartbeat to server
  async sendHeartbeat() {
    if (!this.currentUser) return;

    try {
      const response = await fetch(`${this.serverUrl}/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.currentUser,
          sessionId: this.sessionId
        })
      });

      if (response.ok) {
        const data = await response.json();
        const newActiveUsers = new Set(data.activeUsers || []);
        if (newActiveUsers.size !== this.activeUsers.size || 
            !Array.from(newActiveUsers).every(user => this.activeUsers.has(user))) {
          this.activeUsers = newActiveUsers;
          this.notifyUserListeners();
        }
      }
    } catch (error) {
      // Server not available, continue with current state
    }
  }

  // Set current user
  setCurrentUser(username) {
    this.currentUser = username;
    if (username) {
      this.sendHeartbeat();
    }
  }

  // Send a message
  async sendMessage(text) {
    if (!this.currentUser || !text.trim()) return;

    const message = {
      id: Date.now() + Math.random(),
      text: text.trim(),
      sender: this.currentUser,
      timestamp: new Date().toISOString()
    };

    try {
      // Try to send to server first
      const response = await fetch(`${this.serverUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message.text,
          sender: message.sender,
          sessionId: this.sessionId
        })
      });

      if (response.ok) {
        // Server handled it, fetch latest data
        this.fetchUpdates();
      } else {
        throw new Error('Server request failed');
      }
    } catch (error) {
      // Fallback to localStorage
      this.messages.push(message);
      localStorage.setItem('fallback_messages', JSON.stringify(this.messages));
      this.notifyMessageListeners();
    }
  }

  // Get all messages
  getMessages() {
    return [...this.messages];
  }

  // Get active users
  getActiveUsers() {
    return Array.from(this.activeUsers);
  }

  // Clear all messages
  async clearChat() {
    try {
      const response = await fetch(`${this.serverUrl}/clear`, {
        method: 'POST',
      });

      if (response.ok) {
        this.messages = [];
        this.notifyMessageListeners();
      }
    } catch (error) {
      // Fallback to localStorage
      this.messages = [];
      localStorage.setItem('fallback_messages', JSON.stringify(this.messages));
      this.notifyMessageListeners();
    }
  }

  // Add message listener
  onMessage(callback) {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(cb => cb !== callback);
    };
  }

  // Add user listener
  onUsersChange(callback) {
    this.userListeners.push(callback);
    return () => {
      this.userListeners = this.userListeners.filter(cb => cb !== callback);
    };
  }

  // Notify message listeners
  notifyMessageListeners() {
    this.messageListeners.forEach(callback => {
      try {
        callback([...this.messages]);
      } catch (error) {
        console.error('Message listener error:', error);
      }
    });
  }

  // Notify user listeners
  notifyUserListeners() {
    this.userListeners.forEach(callback => {
      try {
        callback(Array.from(this.activeUsers));
      } catch (error) {
        console.error('User listener error:', error);
      }
    });
  }

  // Cleanup when leaving
  cleanup() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }
}

// Create singleton instance
const chatService = new ChatService();

export default chatService; 