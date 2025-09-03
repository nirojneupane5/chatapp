import React, { useState } from 'react';

const UsernameInput = ({ onUsernameSet }) => {
  const [username, setUsername] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmedUsername = username.trim();
    
    if (trimmedUsername && !isSubmitting) {
      setIsSubmitting(true);
      onUsernameSet(trimmedUsername);
    }
  };

  return (
    <div className="username-input-container">
      <div className="username-card">
        <div className="welcome-header">
          <h2>💬 Global Chat Room</h2>
          <p>Enter your name to join the chat with everyone</p>
        </div>
        
        <form onSubmit={handleSubmit} className="username-form">
          <div className="input-group">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your name..."
              className="username-input"
              autoFocus
              disabled={isSubmitting}
              maxLength={50}
            />
            <button 
              type="submit" 
              disabled={!username.trim() || isSubmitting}
              className="join-button"
            >
              {isSubmitting ? 'Joining...' : 'Join Global Chat'}
            </button>
          </div>
        </form>
        
        <div className="info-text">
          <div className="test-instructions">
            <p><strong>🌍 True Cross-Browser & Cross-Device Chat</strong></p>
            <p><strong>✅ Different Browsers:</strong> Chrome, Firefox, Safari, Edge - all see the same chat!</p>
            <p><strong>✅ Different Devices:</strong> Phones, tablets, laptops - everyone joins the same room!</p>
            <p><strong>✅ Real-time:</strong> Messages appear instantly across all browsers and devices!</p>
            <p><em>Just enter your name and start chatting - no links to share!</em></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsernameInput; 