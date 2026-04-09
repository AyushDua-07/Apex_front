import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, MessageSquare, Clock, Send, PhoneOff, FileText, Wifi, WifiOff, User } from 'lucide-react';
import { getAppointmentById, updateAppointmentStatus } from '../services/api';
import type { Appointment } from '../types';
import { getInitials, formatTime } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

interface ChatMessage {
  id: string;
  sender: string;
  senderId: string;
  text: string;
  time: string;
}

const Session: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState('');

  // Chat
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [otherTyping, setOtherTyping] = useState<string | null>(null);
  const socketRef = useRef<SocketType | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load appointment ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appointmentId) return;
    getAppointmentById(appointmentId)
      .then((res) => setAppointment(res.data))
      .catch(() => addToast('error', 'Failed to load session.'))
      .finally(() => setLoading(false));
  }, [appointmentId, addToast]);

  // ── Timer ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // ── Socket.io (chat sessions only) ──────────────────────────────────────────
  useEffect(() => {
    if (!appointmentId || !user || appointment?.sessionType !== 'chat') return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_session', { appointmentId, userId: user._id, userName: user.fullName });
    });
    socket.on('disconnect', () => setIsConnected(false));
    socket.on('receive_message', (msg: ChatMessage) => setMessages((p) => [...p, msg]));
    socket.on('user_typing', ({ userName, isTyping }: { userName: string; isTyping: boolean }) =>
      setOtherTyping(isTyping ? userName : null)
    );
    socket.on('user_joined', ({ userName }: { userName: string }) =>
      setMessages((p) => [...p, { id: `sys-${Date.now()}`, sender: 'system', senderId: 'system', text: `${userName} joined`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    );
    socket.on('user_left', ({ userName }: { userName: string }) =>
      setMessages((p) => [...p, { id: `sys-${Date.now()}`, sender: 'system', senderId: 'system', text: `${userName} left`, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }])
    );

    return () => { socket.disconnect(); };
  }, [appointmentId, user, appointment?.sessionType]);

  // Auto-scroll
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleSendMessage = useCallback(() => {
    const text = newMessage.trim();
    if (!text || !socketRef.current || !appointmentId) return;
    socketRef.current.emit('send_message', { appointmentId, message: text });
    socketRef.current.emit('typing', { appointmentId, isTyping: false });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setNewMessage('');
  }, [newMessage, appointmentId]);

  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    if (!socketRef.current || !appointmentId) return;
    socketRef.current.emit('typing', { appointmentId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { appointmentId, isTyping: false });
    }, 1500);
  }, [appointmentId]);

  const handleEndSession = async () => {
    if (!appointment) return;
    try {
      await updateAppointmentStatus(appointment._id, 'completed');
      socketRef.current?.disconnect();
      addToast('success', 'Session completed!');
      navigate('/dashboard');
    } catch {
      addToast('error', 'Failed to end session.');
    }
  };

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  // ── Guards ──────────────────────────────────────────────────────────────────
  if (loading) return <LoadingSpinner />;
  if (!appointment) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <p className="text-red-500">Session not found.</p>
    </div>
  );

  const otherPerson = user?.role === 'client'
    ? appointment.consultant?.user?.fullName
    : appointment.client?.fullName;

  const isVideo = appointment.sessionType === 'video_call';

  // Jitsi room name: "apexadvisory-<appointmentId>"
  // Both users land on the same room automatically since they share the same appointmentId
  const jitsiRoom = `apexadvisory-${appointmentId}`;
  const jitsiUrl = `https://meet.jit.si/${jitsiRoom}#userInfo.displayName="${encodeURIComponent(user?.fullName || 'Guest')}"`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6" style={{ minHeight: 'calc(100vh - 10rem)' }}>

        {/* ── Main panel ──────────────────────────────────────────────────── */}
        <div className="lg:col-span-3 flex flex-col">

          {isVideo ? (
            /* ── VIDEO — Jitsi Meet iframe ──────────────────────────────── */
            <div className="flex-1 relative rounded-2xl overflow-hidden bg-gray-900" style={{ minHeight: '520px' }}>

              <iframe
                src={jitsiUrl}
                allow="camera; microphone; fullscreen; display-capture; autoplay"
                className="w-full h-full border-0"
                style={{ minHeight: '520px' }}
                title="Video Call"
              />

              {/* Timer badge */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-mono pointer-events-none">
                <Clock size={13} className="text-yellow-400" />
                {formatElapsed(elapsed)}
              </div>

              {/* End session button */}
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
                <button
                  onClick={handleEndSession}
                  className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center gap-2 font-medium shadow-lg transition-colors"
                >
                  <PhoneOff size={18} />
                  End Session
                </button>
              </div>
            </div>

          ) : (
            /* ── CHAT — Socket.io ───────────────────────────────────────── */
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md overflow-hidden" style={{ minHeight: '520px' }}>

              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                    {getInitials(otherPerson || '')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{otherPerson}</p>
                    <p className="text-xs flex items-center gap-1">
                      {isConnected
                        ? <><Wifi size={10} className="text-green-500" /><span className="text-green-500">Connected</span></>
                        : <><WifiOff size={10} className="text-gray-400" /><span className="text-gray-400">Connecting...</span></>}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-yellow-600 font-mono text-sm bg-yellow-50 px-3 py-1 rounded-full">
                  <Clock size={14} />
                  {formatElapsed(elapsed)}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 pt-16">
                    <MessageSquare size={40} className="opacity-30" />
                    <p className="text-sm">Start the conversation…</p>
                  </div>
                )}

                {messages.map((msg) => {
                  if (msg.senderId === 'system') return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-xs text-gray-400 bg-white border border-gray-200 rounded-full px-3 py-0.5">{msg.text}</span>
                    </div>
                  );
                  const isMine = msg.senderId === user?._id;
                  return (
                    <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {getInitials(msg.sender)}
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div className={`px-4 py-2.5 rounded-2xl max-w-xs lg:max-w-sm ${isMine ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white text-gray-800 rounded-bl-sm shadow-sm border border-gray-100'}`}>
                          <p className="text-sm leading-relaxed">{msg.text}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 px-1">{msg.time}</p>
                      </div>
                      {isMine && (
                        <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                          <User size={12} />
                        </div>
                      )}
                    </div>
                  );
                })}

                {otherTyping && (
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-xs font-bold">{getInitials(otherTyping)}</div>
                    <div className="bg-white border border-gray-100 shadow-sm px-4 py-2.5 rounded-2xl rounded-bl-sm flex gap-1 items-center">
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-4 py-3 border-t border-gray-100 bg-white flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  placeholder="Type a message…"
                  disabled={!isConnected}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm bg-gray-50"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || !isConnected}
                  className="p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send size={18} />
                </button>
              </div>

              {/* End session */}
              <div className="px-4 pb-4 bg-white">
                <button
                  onClick={handleEndSession}
                  className="w-full py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-colors flex items-center justify-center gap-2 font-medium text-sm"
                >
                  <PhoneOff size={16} />
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ─────────────────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Session details */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-semibold text-navy mb-3 text-sm uppercase tracking-wide">Session Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">With</span>
                <span className="font-medium truncate max-w-[120px]">{otherPerson}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{appointment.appointmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span>{formatTime(appointment.appointmentTime)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Type</span>
                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${isVideo ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                  {isVideo ? <Video size={12} /> : <MessageSquare size={12} />}
                  {isVideo ? 'Video Call' : 'Live Chat'}
                </span>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-semibold text-navy mb-3 flex items-center gap-2 text-sm uppercase tracking-wide">
              <FileText size={14} />
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={8}
              placeholder="Take notes during the session…"
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-gray-50"
            />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Session;
