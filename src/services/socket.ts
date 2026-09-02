import { io, Socket } from 'socket.io-client';
import { LiveNotification, Order } from '../types';

let socketInstance: Socket | null = null;

// Audio chime using Web Audio API (no external file needed)
export const playNotificationChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be restricted by browser policy before first user interaction
  }
};

export const getSocket = (): Socket => {
  if (!socketInstance) {
    socketInstance = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500,
    });

    socketInstance.on('connect', () => {
      console.log('⚡ Connected to PrintFlow Live WebSocket server:', socketInstance?.id);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from WebSocket server:', reason);
    });
  }
  return socketInstance;
};

export interface SocketEventsListener {
  onNotification?: (notification: LiveNotification) => void;
  onOrderStatusUpdated?: (data: { orderId: string; status: string; timeline: any[]; order: Order }) => void;
  onOrderCreated?: (data: { order: Order; message: string }) => void;
  onActivityLive?: (activity: { type: string; text: string; timestamp: string; orderId?: string }) => void;
  onStatusChange?: (connected: boolean) => void;
}

export const subscribeToSocketEvents = (listeners: SocketEventsListener) => {
  const socket = getSocket();

  const handleConnect = () => listeners.onStatusChange?.(true);
  const handleDisconnect = () => listeners.onStatusChange?.(false);

  const handleNotif = (notif: LiveNotification) => {
    playNotificationChime();
    listeners.onNotification?.(notif);
  };

  const handleOrderStatus = (data: any) => {
    playNotificationChime();
    listeners.onOrderStatusUpdated?.(data);
  };

  const handleOrderCreated = (data: any) => {
    listeners.onOrderCreated?.(data);
  };

  const handleActivity = (activity: any) => {
    listeners.onActivityLive?.(activity);
  };

  socket.on('connect', handleConnect);
  socket.on('disconnect', handleDisconnect);
  socket.on('notification:new', handleNotif);
  socket.on('broadcast:announcement', handleNotif);
  socket.on('order:status_updated', handleOrderStatus);
  socket.on('order:created', handleOrderCreated);
  socket.on('activity:live', handleActivity);

  // Set initial status
  listeners.onStatusChange?.(socket.connected);

  return () => {
    socket.off('connect', handleConnect);
    socket.off('disconnect', handleDisconnect);
    socket.off('notification:new', handleNotif);
    socket.off('broadcast:announcement', handleNotif);
    socket.off('order:status_updated', handleOrderStatus);
    socket.off('order:created', handleOrderCreated);
    socket.off('activity:live', handleActivity);
  };
};
