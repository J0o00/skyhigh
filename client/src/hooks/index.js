/**
 * Custom Hooks
 */

import { useState, useEffect, useCallback } from 'react';
import { customerApi, interactionApi, keywordApi } from '../services/api';

/**
 * Hook for fetching customers with search/filter
 */
export function useCustomers(initialParams = {}) {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({});

    const fetchCustomers = useCallback(async (params = initialParams) => {
        setLoading(true);
        setError(null);
        try {
            const response = await customerApi.getAll(params);
            setCustomers(response.data);
            setPagination(response.pagination);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    return { customers, loading, error, pagination, refetch: fetchCustomers };
}

/**
 * Hook for fetching single customer with full context
 */
export function useCustomer(customerId) {
    const [customer, setCustomer] = useState(null);
    const [interactions, setInteractions] = useState([]);
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCustomer = useCallback(async () => {
        if (!customerId) return;

        setLoading(true);
        setError(null);
        try {
            const response = await customerApi.getById(customerId);
            setCustomer(response.data.customer);
            setInteractions(response.data.recentInteractions || []);
            setRecommendations(response.data.recommendations || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [customerId]);

    useEffect(() => {
        fetchCustomer();
    }, [fetchCustomer]);

    return {
        customer,
        interactions,
        recommendations,
        loading,
        error,
        refetch: fetchCustomer
    };
}

/**
 * Hook for fetching keywords
 */
export function useKeywords() {
    const [keywords, setKeywords] = useState([]);
    const [grouped, setGrouped] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKeywords() {
            try {
                const response = await keywordApi.getAll();
                setKeywords(response.data.keywords);
                setGrouped(response.data.grouped);
            } catch (err) {
                console.error('Error fetching keywords:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchKeywords();
    }, []);

    return { keywords, grouped, loading };
}

/**
 * Hook for managing call state
 */
export function useCallState(initialCallData = null) {
    const [activeCall, setActiveCall] = useState(initialCallData);
    const [callDuration, setCallDuration] = useState(0);
    const [isCallActive, setIsCallActive] = useState(false);

    // Start timer when call is active
    useEffect(() => {
        let interval;
        if (isCallActive) {
            interval = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isCallActive]);

    const startCall = useCallback((callData) => {
        setActiveCall(callData);
        setIsCallActive(true);
        setCallDuration(0);
    }, []);

    const endCall = useCallback(() => {
        setIsCallActive(false);
        return { callId: activeCall?.callId, duration: callDuration };
    }, [activeCall, callDuration]);

    const clearCall = useCallback(() => {
        setActiveCall(null);
        setIsCallActive(false);
        setCallDuration(0);
    }, []);

    const formatDuration = useCallback((seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, []);

    return {
        activeCall,
        callDuration,
        isCallActive,
        formattedDuration: formatDuration(callDuration),
        startCall,
        endCall,
        clearCall
    };
}

/**
 * Hook for pending follow-ups
 */
export function useFollowUps(agentId) {
    const [followUps, setFollowUps] = useState({ overdue: [], today: [], upcoming: [] });
    const [loading, setLoading] = useState(true);

    const fetchFollowUps = useCallback(async () => {
        if (!agentId) return;

        try {
            const response = await interactionApi.getPendingFollowUps(agentId);
            setFollowUps(response.data);
        } catch (err) {
            console.error('Error fetching follow-ups:', err);
        } finally {
            setLoading(false);
        }
    }, [agentId]);

    useEffect(() => {
        fetchFollowUps();
    }, [fetchFollowUps]);

    return { followUps, loading, refetch: fetchFollowUps };
}
