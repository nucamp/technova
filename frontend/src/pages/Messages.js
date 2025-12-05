import React, { useState, useEffect } from 'react';
import { getMessages, sendMessage } from '../services/api';

function Messages({ user }) {
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [formData, setFormData] = useState({
    to_user_id: '',
    subject: '',
    body: ''
  });

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const fetchMessages = async () => {
    try {
      const data = await getMessages(user.id);
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    try {
      // VULNERABILITY: No sanitization of message content before sending
      await sendMessage(formData);
      alert('Message sent successfully!');
      setShowCompose(false);
      setFormData({
        to_user_id: '',
        subject: '',
        body: ''
      });
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message: ' + error.message);
    }
  };

  const handleSelectMessage = (message) => {
    setSelectedMessage(message);
  };

  const inbox = messages.filter(m => m.to_user_id === user.id);
  const sent = messages.filter(m => m.from_user_id === user.id);

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Messages</h2>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="btn btn-primary"
        >
          {showCompose ? 'Cancel' : 'Compose Message'}
        </button>
      </div>

      {showCompose && (
        <div className="card">
          <h3>Compose Message</h3>
          <form onSubmit={handleSendMessage}>
            <div className="form-group">
              <label>To (User ID)</label>
              <input
                type="number"
                value={formData.to_user_id}
                onChange={(e) => setFormData({ ...formData, to_user_id: e.target.value })}
                required
              />
              <small>Admin: 1, Dr. Smith: 3, Patient001: 9</small>
            </div>

            <div className="form-group">
              <label>Subject</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                rows="5"
                required
              />
              <small style={{ color: 'red' }}>
                ⚠️ XSS Vulnerability: Try entering HTML/JavaScript like: {`<script>alert('XSS')</script>`} or {`<img src=x onerror=alert('XSS')>`}
              </small>
            </div>

            <button type="submit" className="btn btn-success">
              Send Message
            </button>
          </form>
        </div>
      )}

      <div className="messages-container">
        <div className="message-list">
          <h3>Inbox ({inbox.filter(m => !m.is_read).length} unread)</h3>
          {loading ? (
            <p>Loading...</p>
          ) : inbox.length === 0 ? (
            <p>No messages in inbox.</p>
          ) : (
            inbox.map((message) => (
              <div
                key={message.id}
                className={`message-item ${!message.is_read ? 'unread' : ''}`}
                onClick={() => handleSelectMessage(message)}
              >
                <div style={{ marginBottom: '5px' }}>
                  <strong>From:</strong> {message.from_first_name} {message.from_last_name}
                </div>
                <div style={{ marginBottom: '5px' }}>
                  <strong>Subject:</strong> {message.subject}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {new Date(message.sent_at).toLocaleString()}
                </div>
              </div>
            ))
          )}

          <h3 style={{ marginTop: '30px' }}>Sent ({sent.length})</h3>
          {sent.map((message) => (
            <div
              key={message.id}
              className="message-item"
              onClick={() => handleSelectMessage(message)}
            >
              <div style={{ marginBottom: '5px' }}>
                <strong>To:</strong> {message.to_first_name} {message.to_last_name}
              </div>
              <div style={{ marginBottom: '5px' }}>
                <strong>Subject:</strong> {message.subject}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {new Date(message.sent_at).toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="message-detail">
          {selectedMessage ? (
            <>
              <h3>{selectedMessage.subject}</h3>
              <div style={{ borderBottom: '1px solid #ddd', paddingBottom: '15px', marginBottom: '15px' }}>
                <p>
                  <strong>From:</strong> {selectedMessage.from_first_name} {selectedMessage.from_last_name}
                </p>
                <p>
                  <strong>To:</strong> {selectedMessage.to_first_name} {selectedMessage.to_last_name}
                </p>
                <p>
                  <strong>Date:</strong> {new Date(selectedMessage.sent_at).toLocaleString()}
                </p>
              </div>

              {/* VULNERABILITY: XSS - Rendering HTML without sanitization */}
              <div
                style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '4px',
                  minHeight: '200px'
                }}
                dangerouslySetInnerHTML={{ __html: selectedMessage.body }}
              />

              <div style={{ marginTop: '15px', padding: '10px', background: '#fff3cd', borderRadius: '4px' }}>
                <small style={{ color: '#856404' }}>
                  ⚠️ This message is rendered without sanitization (XSS vulnerability)
                </small>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '400px', color: '#999' }}>
              <p>Select a message to view</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Messages;
