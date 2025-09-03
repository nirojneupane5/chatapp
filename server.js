const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// In-memory storage (temporary)
let chatData = {
  messages: [],
  activeUsers: new Set(),
  userHeartbeats: {}
};

// Cleanup inactive users every 5 seconds
setInterval(() => {
  const now = Date.now();
  const activeUsers = new Set();
  
  Object.entries(chatData.userHeartbeats).forEach(([sessionId, data]) => {
    if (now - data.timestamp < 10000) { // 10 second timeout
      activeUsers.add(data.username);
    } else {
      delete chatData.userHeartbeats[sessionId];
    }
  });
  
  chatData.activeUsers = activeUsers;
}, 5000);

// Get chat data
app.get('/api/chat', (req, res) => {
  res.json({
    messages: chatData.messages,
    activeUsers: Array.from(chatData.activeUsers)
  });
});

// Send a message
app.post('/api/message', (req, res) => {
  const { text, sender, sessionId } = req.body;
  
  if (!text || !sender || !sessionId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const message = {
    id: Date.now() + Math.random(),
    text: text.trim(),
    sender: sender.trim(),
    timestamp: new Date().toISOString()
  };

  chatData.messages.push(message);
  
  // Keep only last 1000 messages
  if (chatData.messages.length > 1000) {
    chatData.messages = chatData.messages.slice(-1000);
  }

  res.json({ success: true, message });
});

// Send heartbeat
app.post('/api/heartbeat', (req, res) => {
  const { username, sessionId } = req.body;
  
  if (!username || !sessionId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  chatData.userHeartbeats[sessionId] = {
    username: username.trim(),
    timestamp: Date.now()
  };

  // Update active users
  const activeUsers = new Set();
  Object.values(chatData.userHeartbeats).forEach(data => {
    activeUsers.add(data.username);
  });
  chatData.activeUsers = activeUsers;

  res.json({ 
    success: true, 
    activeUsers: Array.from(chatData.activeUsers) 
  });
});

// Clear chat
app.post('/api/clear', (req, res) => {
  chatData.messages = [];
  res.json({ success: true });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Chat server running on http://localhost:${PORT}`);
  console.log(`🌐 Network access: http://192.168.1.69:${PORT}`);
  console.log('📱 Share this with others for cross-device chat!');
}); 