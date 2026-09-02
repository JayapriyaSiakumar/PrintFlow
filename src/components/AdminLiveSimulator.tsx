import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { OrderStatus } from '../types';
import {
  X,
  Activity,
  Send,
  Zap,
  Radio,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

export const AdminLiveSimulator: React.FC = () => {
  const {
    isAdminSimulatorOpen,
    setIsAdminSimulatorOpen,
    orders,
    simulateOrderProgress,
    sendBroadcastMessage,
    socketConnected,
  } = useApp();

  const [broadcastTitle, setBroadcastTitle] = useState('🔥 Flash Sale Alert!');
  const [broadcastMsg, setBroadcastMsg] = useState('Take 20% off all organic cotton hoodies for the next 2 hours with code FLASH20.');
  const [broadcasting, setBroadcasting] = useState(false);

  if (!isAdminSimulatorOpen) return null;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastTitle || !broadcastMsg) return;
    setBroadcasting(true);
    try {
      await sendBroadcastMessage(broadcastTitle, broadcastMsg);
      setBroadcastTitle('');
      setBroadcastMsg('');
    } finally {
      setBroadcasting(false);
    }
  };

  const statusList: OrderStatus[] = ['pending', 'processing', 'printing', 'quality_check', 'shipped', 'delivered'];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200 flex justify-end">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between border-l border-[#e2e2e2] animate-in slide-in-from-right duration-250"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#f9f9f9]">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#0058be]" />
            <div>
              <h2 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                Real-Time Socket.io & Order Simulator
              </h2>
              <p className="text-[11px] text-[#555f6f]">
                Live event emitter testing tool for production verification
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAdminSimulatorOpen(false)}
            className="w-8 h-8 rounded-full bg-[#eeeeee] hover:bg-[#e2e2e2] flex items-center justify-center text-[#1a1c1c] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          
          {/* Socket Connection Status */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${socketConnected ? 'bg-emerald-400' : 'bg-amber-400'} opacity-75`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${socketConnected ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
              </span>
              <div>
                <p className="text-xs font-bold text-emerald-900">
                  {socketConnected ? 'WebSocket Channel Connected' : 'Reconnecting to Server...'}
                </p>
                <p className="text-[10px] text-emerald-700">
                  Bi-directional event streaming with room isolation
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-1 rounded bg-white font-bold text-emerald-800 border border-emerald-300">
              PORT 3000
            </span>
          </div>

          {/* Broadcast to All Users */}
          <form onSubmit={handleBroadcast} className="p-4 bg-white rounded-xl border border-[#e2e2e2] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
              <Radio className="w-4 h-4 text-[#0058be]" />
              <span>Broadcast Live Notification to All Tabs</span>
            </div>
            <p className="text-[11px] text-[#555f6f]">
              Emits a Socket.io event that immediately pops up in the notification bell across all active connected browser sessions.
            </p>

            <div>
              <label className="text-[11px] font-bold text-[#1a1c1c] block mb-1">Headline</label>
              <input
                type="text"
                value={broadcastTitle}
                onChange={(e) => setBroadcastTitle(e.target.value)}
                placeholder="e.g. Special Announcement"
                className="w-full px-3 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#1a1c1c] block mb-1">Message Content</label>
              <textarea
                rows={2}
                value={broadcastMsg}
                onChange={(e) => setBroadcastMsg(e.target.value)}
                placeholder="Message payload..."
                className="w-full px-3 py-1.5 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={broadcasting || !broadcastTitle}
              className="w-full py-2 bg-[#0058be] hover:bg-[#2170e4] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{broadcasting ? 'Emitting...' : 'Emit Real-Time Broadcast'}</span>
            </button>
          </form>

          {/* Advance Order Status in Real-Time */}
          <div className="p-4 bg-white rounded-xl border border-[#e2e2e2] space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">
              <Zap className="w-4 h-4 text-[#6b38d4]" />
              <span>Simulate Production Workflow</span>
            </div>
            <p className="text-[11px] text-[#555f6f]">
              Advance the status of active orders to trigger automated live timeline updates and customer notifications.
            </p>

            {orders.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#727785] bg-[#f9f9f9] rounded-lg">
                No orders in the database. Place an order from the cart to simulate workflow.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div key={order.id} className="p-3 bg-[#f9f9f9] rounded-lg border border-[#eeeeee] space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="font-mono font-bold text-[#1a1c1c]">#{order.id}</span>
                        <span className="text-[#727785] ml-2">({order.items.length} items)</span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#d8e2ff] text-[#0058be] uppercase">
                        {order.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {statusList.map((st) => (
                        <button
                          key={st}
                          onClick={() => simulateOrderProgress(order.id, st)}
                          className={`px-2 py-1 rounded text-[10px] font-semibold capitalize transition-colors ${
                            order.status === st
                              ? 'bg-[#0058be] text-white shadow-xs'
                              : 'bg-white text-[#424754] border border-[#e2e2e2] hover:border-[#0058be]'
                          }`}
                        >
                          → {st.replace('_', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer info */}
        <div className="p-4 border-t border-[#eeeeee] bg-[#f9f9f9] text-center text-[11px] text-[#727785]">
          Socket.io Event Channel: <code className="font-mono text-[#0058be]">order_updated</code> & <code className="font-mono text-[#0058be]">new_notification</code>
        </div>
      </div>
    </div>
  );
};
