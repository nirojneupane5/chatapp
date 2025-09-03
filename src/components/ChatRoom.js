import React, { useState, useEffect, useRef } from 'react';
import chatService from '../utils/chatService';

const ChatRoom = ({ currentUser, onLeave }) => {
  const [messages, setMessages] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Set up listeners
    const unsubscribeMessages = chatService.onMessage(setMessages);
    const unsubscribeUsers = chatService.onUsersChange(setActiveUsers);

    // Get initial data
    setMessages(chatService.getMessages());
    setActiveUsers(chatService.getActiveUsers());

    // Cleanup
    return () => {
      unsubscribeMessages();
      unsubscribeUsers();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      chatService.sendMessage(newMessage);
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.timestamp);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);
  const otherUsers = activeUsers.filter(user => user !== currentUser);

  return (
    <div className="chat-room">
      <div className="chat-header">
        <div className="chat-info">
          <h3>🌍 Global Chat Room</h3>
          <div className="active-users">
            <span className="user-count">{activeUsers.length} people online:</span>
            <div className="user-list">
              {activeUsers.map(user => (
                <span 
                  key={user} 
                  className={`user-tag ${user === currentUser ? 'current-user' : ''}`}
                >
                  {user === currentUser ? `${user} (You)` : user}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="clear-button"
            onClick={() => chatService.clearChat()}
            title="Clear all messages"
          >
            🗑️
          </button>
          <button 
            className="leave-button"
            onClick={onLeave}
          >
            Change Name
          </button>
        </div>
      </div>

      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-state">
            <h3>🎉 Welcome to the Global Chat!</h3>
            <p>
              {otherUsers.length === 0 
                ? "You're the first one here. Others will join automatically when they open the app!"
                : `Chat with ${otherUsers.join(', ')} and anyone else who joins!`
              }
            </p>
          </div>
        ) : (
          Object.entries(messageGroups).map(([date, dayMessages]) => (
            <div key={date} className="message-date-group">
              <div className="date-separator">
                <span>{date}</span>
              </div>
              {dayMessages.map(message => (
                <div 
                  key={message.id} 
                  className={`message ${message.sender === currentUser ? 'sent' : 'received'}`}
                >
                  {message.sender !== currentUser && (
                    <div className="message-sender">{message.sender}</div>
                  )}
                  <div className="message-content">
                    <p>{message.text}</p>
                    <span className="message-time">{formatTime(message.timestamp)}</span>
                  </div>
                </div>
              ))}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="message-input">
        <form onSubmit={handleSendMessage} className="message-form">
          <div className="input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Message everyone in the global chat..."
              rows="1"
              className="message-textarea"
              maxLength={1000}
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim()}
              className="send-button"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path 
                  d="M2 21L23 12L2 3V10L17 12L2 14V21Z" 
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatRoom; 