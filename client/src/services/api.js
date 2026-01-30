/**
 * API Service
 * 
 * Axios instance and API helper functions.
 */

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ============ Customer APIs ============

export const customerApi = {
    // Get all customers
    getAll: async (params = {}) => {
        const response = await api.get('/customers', { params });
        return response.data;
    },

    // Get single customer with context
    getById: async (id) => {
        const response = await api.get(`/customers/${id}`);
        return response.data;
    },

    // Lookup by phone
    getByPhone: async (phone) => {
        const response = await api.get(`/customers/phone/${encodeURIComponent(phone)}`);
        return response.data;
    },

    // Create customer
    create: async (data) => {
        const response = await api.post('/customers', data);
        return response.data;
    },

    // Update customer
    update: async (id, data) => {
        const response = await api.put(`/customers/${id}`, data);
        return response.data;
    },

    // Add keywords
    addKeywords: async (id, keywords, agentId) => {
        const response = await api.post(`/customers/${id}/keywords`, { keywords, agentId });
        return response.data;
    },

    // Submit feedback
    submitFeedback: async (id, feedbackData) => {
        const response = await api.put(`/customers/${id}/feedback`, feedbackData);
        return response.data;
    },

    // Get channel assist
    getAssist: async (id, channel) => {
        const response = await api.get(`/customers/${id}/assist/${channel}`);
        return response.data;
    }
};

// ============ Call Event APIs ============

export const callApi = {
    // Trigger incoming call event (simulation)
    triggerCall: async (agentId, callerNumber, direction = 'inbound') => {
        const response = await api.post('/call-event', {
            agent_id: agentId,
            caller_number: callerNumber,
            timestamp: new Date().toISOString(),
            direction
        });
        return response.data;
    },

    // End call
    endCall: async (callId, duration) => {
        const response = await api.post(`/call-event/${callId}/end`, { duration });
        return response.data;
    },

    // Submit call summary
    submitSummary: async (callId, summaryData) => {
        const response = await api.post(`/call-event/${callId}/summary`, summaryData);
        return response.data;
    },

    // Get call details
    getCall: async (callId) => {
        const response = await api.get(`/call-event/${callId}`);
        return response.data;
    },

    // Get active call for agent
    getActiveCall: async (agentId) => {
        const response = await api.get(`/call-event/active/${agentId}`);
        return response.data;
    }
};

// ============ Interaction APIs ============

export const interactionApi = {
    // Get customer timeline
    getByCustomer: async (customerId, params = {}) => {
        const response = await api.get(`/interactions/customer/${customerId}`, { params });
        return response.data;
    },

    // Create interaction
    create: async (data) => {
        const response = await api.post('/interactions', data);
        return response.data;
    },

    // Update follow-up
    updateFollowUp: async (id, data) => {
        const response = await api.put(`/interactions/${id}/follow-up`, data);
        return response.data;
    },

    // Get pending follow-ups
    getPendingFollowUps: async (agentId) => {
        const response = await api.get(`/interactions/pending-followups/${agentId}`);
        return response.data;
    }
};

// ============ Keyword APIs ============

export const keywordApi = {
    // Get all keywords
    getAll: async () => {
        const response = await api.get('/keywords');
        return response.data;
    },

    // Suggest new keyword
    suggest: async (keyword, category, agentId) => {
        const response = await api.post('/keywords', { keyword, category, suggestedBy: agentId });
        return response.data;
    },

    // Increment usage
    incrementUsage: async (id) => {
        const response = await api.post(`/keywords/${id}/increment-usage`);
        return response.data;
    }
};

// ============ Agent APIs ============

export const agentApi = {
    // Get all agents
    getAll: async () => {
        const response = await api.get('/agents');
        return response.data;
    },

    // Get agent stats
    getStats: async (id) => {
        const response = await api.get(`/agents/${id}/stats`);
        return response.data;
    }
};

export default api;
