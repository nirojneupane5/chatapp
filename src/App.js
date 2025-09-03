import React, { useState, useEffect } from 'react';
import './App.css';
import UsernameInput from './components/UsernameInput';
import ChatRoom from './components/ChatRoom';
import chatService from './utils/chatService';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Cleanup when component unmounts
    return () => {
      if (currentUser) {
        chatService.setCurrentUser(null);
      }
    };
  }, [currentUser]);

  const handleUsernameSet = (username) => {
    setCurrentUser(username);
    chatService.setCurrentUser(username);
  };

  const handleLeaveChat = () => {
    if (currentUser) {
      chatService.setCurrentUser(null);
    }
    setCurrentUser(null);
  };

  return (
    <div className="app">
      <div className="app-header">
        <h1>💬 Chat App</h1>
        {currentUser && (
          <div className="current-user-display">
            Logged in as <strong>{currentUser}</strong>
          </div>
        )}
      </div>

      <div className="app-content">
        {!currentUser ? (
          <UsernameInput onUsernameSet={handleUsernameSet} />
        ) : (
          <ChatRoom 
            currentUser={currentUser} 
            onLeave={handleLeaveChat}
          />
        )}
      </div>
    </div>
  );
}

export default App; 