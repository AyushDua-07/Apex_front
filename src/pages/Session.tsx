import io from 'socket.io-client';
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [otherTyping, setOtherTyping] = useState<string | null>(null);

  const socketRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load appointment
  useEffect(() => {
    if (!appointmentId) return;
    getAppointmentById(appointmentId)
      .then((res) => setAppointment(res.data))
      .catch(() => addToast('error', 'Failed to load session.'))
      .finally(() => setLoading(false));
  }, [appointmentId, addToast]);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Socket.io
  useEffect(() => {
    if (!appointmentId || !user || appointment?.sessionType !== 'chat') return;

    const socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join_session', {
        appointmentId,
        userId: user._id,
        userName: user.fullName,
      });
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('user_typing', ({ userName, isTyping }: any) => {
      setOtherTyping(isTyping ? userName : null);
    });

    socket.on('user_joined', ({ userName }: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          senderId: 'system',
          text: `${userName} joined`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    socket.on('user_left', ({ userName }: any) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `sys-${Date.now()}`,
          sender: 'system',
          senderId: 'system',
          text: `${userName} left`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, [appointmentId, user, appointment?.sessionType]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSendMessage = useCallback(() => {
    const text = newMessage.trim();
    if (!text || !socketRef.current || !appointmentId) return;

    socketRef.current.emit('send_message', {
      appointmentId,
      message: text,
    });

    socketRef.current.emit('typing', { appointmentId, isTyping: false });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setNewMessage('');
  }, [newMessage, appointmentId]);

  // Typing
  const handleTyping = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    if (!socketRef.current || !appointmentId) return;

    socketRef.current.emit('typing', { appointmentId, isTyping: true });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit('typing', { appointmentId, isTyping: false });
    }, 1500);
  }, [appointmentId]);

  // End session
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

  if (loading) return <LoadingSpinner />;

  if (!appointment) {
    return (
      <div className="text-center py-10">
        <p className="text-red-500">Session not found.</p>
      </div>
    );
  }

  const otherPerson =
    user?.role === 'client'
      ? appointment.consultant?.user?.fullName
      : appointment.client?.fullName;

  const isVideo = appointment.sessionType === 'video_call';

  const jitsiRoom = `apexadvisory-${appointmentId}`;
  const jitsiUrl = `https://meet.jit.si/${jitsiRoom}`;

  return (
    <div className="p-4">
      {isVideo ? (
        <iframe
          src={jitsiUrl}
          className="w-full h-[500px]"
          allow="camera; microphone"
        />
      ) : (
        <div>
          <div className="h-[400px] overflow-y-auto border p-2">
            {messages.map((msg) => (
              <div key={msg.id}>
                <b>{msg.sender}:</b> {msg.text}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <input
            value={newMessage}
            onChange={handleTyping}
            placeholder="Type..."
          />

          <button onClick={handleSendMessage}>Send</button>
        </div>
      )}

      <button onClick={handleEndSession}>End Session</button>
    </div>
  );
};

export default Session;