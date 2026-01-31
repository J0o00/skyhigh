/**
 * Socket Context
 * 
 * Manages WebSocket connection for real-time updates.
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || (
    window.location.hostname === 'localhost'
        ? 'http://localhost:5000'
        : '/'
);

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callEnded, setCallEnded] = useState(null);
    const { user, isAuthenticated } = useAuth();

    // Use refs to avoid stale closures in event handlers
    const userRef = useRef(user);

    // Update userRef when user changes
    useEffect(() => {
        userRef.current = user;
    }, [user]);

    // Initialize socket connection
    // Only depend on user._id and role to avoid unnecessary reconnections
    const userId = user?._id;
    const userRole = user?.role;

    useEffect(() => {
        if (!isAuthenticated || !userId) {
            return;
        }

        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket'],
            extraHeaders: {
                'ngrok-skip-browser-warning': 'true'
            }
        });

        // Event handlers
        const handleConnect = () => {
            console.log('Socket connected');
            setIsConnected(true);

            // Join agent room (only for agents)
            if (userRole === 'agent') {
                socketInstance.emit('agent:join', { agentId: userId });
            }
        };

        const handleDisconnect = () => {
            console.log('Socket disconnected');
            setIsConnected(false);
        };

        const handleAgentJoined = (data) => {
            console.log('Joined room:', data.room);
        };

        const handleCallIncoming = (data) => {
            console.log('Incoming call:', data);
            setIncomingCall(data);
        };

        const handleCallEnded = (data) => {
            console.log('Call ended:', data);
            setCallEnded(data);
            setIncomingCall(null);
        };

        const handleCustomerUpdated = (data) => {
            console.log('Customer updated:', data);
            // This could trigger a refresh in relevant components
        };

        // Register event listeners
        socketInstance.on('connect', handleConnect);
        socketInstance.on('disconnect', handleDisconnect);
        socketInstance.on('agent:joined', handleAgentJoined);
        socketInstance.on('call:incoming', handleCallIncoming);
        socketInstance.on('call:ended', handleCallEnded);
        socketInstance.on('customer:updated', handleCustomerUpdated);

        setSocket(socketInstance);

        // Cleanup: Remove all event listeners before disconnecting
        return () => {
            // Remove all event listeners to prevent memory leaks
            socketInstance.off('connect', handleConnect);
            socketInstance.off('disconnect', handleDisconnect);
            socketInstance.off('agent:joined', handleAgentJoined);
            socketInstance.off('call:incoming', handleCallIncoming);
            socketInstance.off('call:ended', handleCallEnded);
            socketInstance.off('customer:updated', handleCustomerUpdated);

            // Use ref to safely access current user data during cleanup
            if (userRef.current?.role === 'agent') {
                socketInstance.emit('agent:leave', { agentId: userRef.current._id });
            }
            socketInstance.disconnect();
            setSocket(null);
            setIsConnected(false);
        };
    }, [isAuthenticated, userId, userRole]);

    // Clear incoming call
    const clearIncomingCall = useCallback(() => {
        setIncomingCall(null);
    }, []);

    // Clear call ended
    const clearCallEnded = useCallback(() => {
        setCallEnded(null);
    }, []);

    const value = {
        socket,
        isConnected,
        incomingCall,
        callEnded,
        clearIncomingCall,
        clearCallEnded
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
