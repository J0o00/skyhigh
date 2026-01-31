/**
 * Socket Context
 * 
 * Manages WebSocket connection for real-time updates.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

export function SocketProvider({ children }) {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [incomingCall, setIncomingCall] = useState(null);
    const [callEnded, setCallEnded] = useState(null);
    const { user, isAuthenticated } = useAuth();

    // Initialize socket connection
    useEffect(() => {
        if (!isAuthenticated || !user) {
            return;
        }

        const socketInstance = io(SOCKET_URL, {
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000
        });

        socketInstance.on('connect', () => {
            console.log('🔌 Socket connected');
            setIsConnected(true);

            // Join agent room (only for agents)
            if (user.role === 'agent') {
                socketInstance.emit('agent:join', { agentId: user._id });
            }
        });

        socketInstance.on('disconnect', () => {
            console.log('🔌 Socket disconnected');
            setIsConnected(false);
        });

        socketInstance.on('agent:joined', (data) => {
            console.log('👤 Joined room:', data.room);
        });

        // Incoming call notification
        socketInstance.on('call:incoming', (data) => {
            console.log('📞 Incoming call:', data);
            setIncomingCall(data);
        });

        // Call ended notification
        socketInstance.on('call:ended', (data) => {
            console.log('📞 Call ended:', data);
            setCallEnded(data);
            setIncomingCall(null);
        });

        // Customer updated
        socketInstance.on('customer:updated', (data) => {
            console.log('👤 Customer updated:', data);
            // This could trigger a refresh in relevant components
        });

        setSocket(socketInstance);

        return () => {
            if (user.role === 'agent') {
                socketInstance.emit('agent:leave', { agentId: user._id });
            }
            socketInstance.disconnect();
        };
    }, [isAuthenticated, user]);

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
