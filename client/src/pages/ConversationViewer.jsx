import { useState, useEffect } from 'react';
import axios from 'axios';
import './ConversationViewer.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function ConversationViewer() {
    const [viewType, setViewType] = useState('all'); // 'all', 'customer', 'agent'
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filters
    const [customerId, setCustomerId] = useState('');
    const [agentId, setAgentId] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchConversations();
    }, [viewType, customerId, agentId, page]);

    const fetchConversations = async () => {
        setLoading(true);
        setError(null);

        try {
            let url = '';
            const params = { page, limit: 20, includeTranscript: 'false' };

            if (viewType === 'customer' && customerId) {
                url = `${API_BASE}/api/conversations/customer/${customerId}`;
            } else if (viewType === 'agent' && agentId) {
                url = `${API_BASE}/api/conversations/agent/${agentId}`;
            } else {
                url = `${API_BASE}/api/conversations/all/list`;
            }

            const response = await axios.get(url, { params });

            if (response.data.success) {
                const convos = response.data.data.conversations || [];
                setConversations(convos);

                const pagination = response.data.data.pagination;
                if (pagination) {
                    setTotalPages(pagination.pages);
                }
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const viewFullConversation = async (interactionId) => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/api/conversations/${interactionId}`);
            if (response.data.success) {
                setSelectedConversation(response.data.data);
            }
        } catch (err) {
            console.error('Error fetching full conversation:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            fetchConversations();
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await axios.get(`${API_BASE}/api/conversations/search/query`, {
                params: { q: searchQuery, page, limit: 20 }
            });

            if (response.data.success) {
                const convos = response.data.data.conversations || [];
                setConversations(convos);

                const pagination = response.data.data.pagination;
                if (pagination) {
                    setTotalPages(pagination.pages);
                }
            }
        } catch (err) {
            console.error('Error searching conversations:', err);
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatDuration = (seconds) => {
        if (!seconds) return 'N/A';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    return (
        <div className="conversation-viewer">
            <div className="viewer-header">
                <h1>📞 Conversation Viewer</h1>
                <p>View and search client-agent conversations</p>
            </div>

            <div className="filters-section">
                <div className="view-type-toggle">
                    <button
                        className={viewType === 'all' ? 'active' : ''}
                        onClick={() => { setViewType('all'); setPage(1); }}
                    >
                        All Conversations
                    </button>
                    <button
                        className={viewType === 'customer' ? 'active' : ''}
                        onClick={() => { setViewType('customer'); setPage(1); }}
                    >
                        By Customer
                    </button>
                    <button
                        className={viewType === 'agent' ? 'active' : ''}
                        onClick={() => { setViewType('agent'); setPage(1); }}
                    >
                        By Agent
                    </button>
                </div>

                {viewType === 'customer' && (
                    <div className="filter-input">
                        <label>Customer ID:</label>
                        <input
                            type="text"
                            value={customerId}
                            onChange={(e) => setCustomerId(e.target.value)}
                            placeholder="Enter customer ID"
                        />
                        <button onClick={fetchConversations}>Fetch</button>
                    </div>
                )}

                {viewType === 'agent' && (
                    <div className="filter-input">
                        <label>Agent ID:</label>
                        <input
                            type="text"
                            value={agentId}
                            onChange={(e) => setAgentId(e.target.value)}
                            placeholder="Enter agent ID"
                        />
                        <button onClick={fetchConversations}>Fetch</button>
                    </div>
                )}

                <div className="search-bar">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="Search conversations (keywords, summary, notes...)"
                    />
                    <button onClick={handleSearch}>🔍 Search</button>
                </div>
            </div>

            {error && <div className="error-message">❌ {error}</div>}

            {loading && <div className="loading">Loading conversations...</div>}

            <div className="conversations-grid">
                <div className="conversations-list">
                    <h2>Conversations ({conversations.length})</h2>
                    {conversations.length === 0 && !loading && (
                        <p className="no-data">No conversations found</p>
                    )}

                    {conversations.map((conv) => (
                        <div
                            key={conv._id}
                            className="conversation-card"
                            onClick={() => viewFullConversation(conv._id)}
                        >
                            <div className="conv-header">
                                <span className="channel-badge">{conv.channel}</span>
                                <span className={`direction-badge ${conv.direction}`}>
                                    {conv.direction}
                                </span>
                            </div>

                            <div className="conv-participants">
                                <div className="participant">
                                    <strong>Customer:</strong> {conv.customerId?.name || 'Unknown'}
                                    {conv.customerId?.phone && ` (${conv.customerId.phone})`}
                                </div>
                                <div className="participant">
                                    <strong>Agent:</strong> {conv.agentId?.name || 'Unassigned'}
                                </div>
                            </div>

                            <div className="conv-summary">
                                <p>{conv.summary}</p>
                            </div>

                            <div className="conv-metadata">
                                <span>📅 {formatDate(conv.createdAt)}</span>
                                {conv.callDuration && (
                                    <span>⏱️ {formatDuration(conv.callDuration)}</span>
                                )}
                            </div>

                            {conv.intent && (
                                <div className="conv-tags">
                                    <span className="tag intent-tag">{conv.intent}</span>
                                    {conv.outcome && (
                                        <span className="tag outcome-tag">{conv.outcome}</span>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage(p => p - 1)}
                            >
                                ← Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage(p => p + 1)}
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>

                <div className="conversation-detail">
                    {!selectedConversation ? (
                        <div className="no-selection">
                            <p>👆 Select a conversation to view full details</p>
                        </div>
                    ) : (
                        <div className="detail-content">
                            <div className="detail-header">
                                <h2>Conversation Details</h2>
                                <button onClick={() => setSelectedConversation(null)}>✕</button>
                            </div>

                            <div className="detail-section">
                                <h3>Participants</h3>
                                <div className="participant-info">
                                    <div>
                                        <strong>Customer:</strong> {selectedConversation.customer?.name || 'Unknown'}
                                        <br />
                                        <small>
                                            {selectedConversation.customer?.phone && `Phone: ${selectedConversation.customer.phone}`}
                                            {selectedConversation.customer?.email && ` | Email: ${selectedConversation.customer.email}`}
                                        </small>
                                    </div>
                                    <div>
                                        <strong>Agent:</strong> {selectedConversation.agent?.name || 'Unassigned'}
                                        <br />
                                        {selectedConversation.agent?.email && (
                                            <small>Email: {selectedConversation.agent.email}</small>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Call Information</h3>
                                <div className="info-grid">
                                    <div><strong>Channel:</strong> {selectedConversation.channel}</div>
                                    <div><strong>Direction:</strong> {selectedConversation.direction}</div>
                                    <div><strong>Intent:</strong> {selectedConversation.intent || 'Unknown'}</div>
                                    <div><strong>Outcome:</strong> {selectedConversation.outcome || 'N/A'}</div>
                                    <div><strong>Date:</strong> {formatDate(selectedConversation.startTime)}</div>
                                    <div>
                                        <strong>Duration:</strong> {formatDuration(selectedConversation.duration)}
                                    </div>
                                </div>
                            </div>

                            <div className="detail-section">
                                <h3>Summary</h3>
                                <p className="summary-text">{selectedConversation.summary}</p>
                            </div>

                            {selectedConversation.keywords?.length > 0 && (
                                <div className="detail-section">
                                    <h3>Keywords</h3>
                                    <div className="keywords-list">
                                        {selectedConversation.keywords.map((kw, idx) => (
                                            <span key={idx} className="keyword-tag">{kw}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedConversation.transcript?.length > 0 && (
                                <div className="detail-section">
                                    <h3>Full Transcript</h3>
                                    <div className="transcript">
                                        {selectedConversation.transcript.map((message, idx) => (
                                            <div key={idx} className={`message ${message.speaker?.toLowerCase()}`}>
                                                <div className="message-header">
                                                    <strong>{message.speaker || 'Unknown'}:</strong>
                                                    {message.timestamp && (
                                                        <span className="timestamp">
                                                            {formatDate(message.timestamp)}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="message-text">{message.text}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedConversation.notes && (
                                <div className="detail-section">
                                    <h3>Notes</h3>
                                    <p className="notes-text">{selectedConversation.notes}</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ConversationViewer;
