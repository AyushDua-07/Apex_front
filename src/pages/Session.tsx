import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Video, MessageSquare, Clock, Send, PhoneOff, FileText } from 'lucide-react';
import { getAppointmentById, updateAppointmentStatus } from '../services/api';
import type { Appointment } from '../types';
import { getInitials, formatTime } from '../utils/helpers';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const Session: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!appointmentId) return;
      try {
        const res = await getAppointmentById(appointmentId);
        setAppointment(res.data);
      } catch {
        addToast('error', 'Failed to load session.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [appointmentId, addToast]);

  useEffect(() => {
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatElapsed = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    setMessages((prev) => [
      ...prev,
      { sender: user?.fullName || 'You', text: newMessage, time: new Date().toLocaleTimeString() },
    ]);
    setNewMessage('');
  };

  const handleEndSession = async () => {
    if (!appointment) return;
    try {
      await updateAppointmentStatus(appointment._id, 'completed');
      addToast('success', 'Session completed!');
      navigate('/dashboard');
    } catch {
      addToast('error', 'Failed to end session.');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!appointment) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-red-500">Session not found.</p>
      </div>
    );
  }

  const otherPerson =
    user?.role === 'client'
      ? appointment.consultant?.user?.fullName
      : appointment.client?.fullName;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-12rem)]">
        {/* Main Area */}
        <div className="lg:col-span-3 flex flex-col">
          {appointment.sessionType === 'video_call' ? (
            <div className="flex-1 bg-gray-900 rounded-2xl flex items-center justify-center relative">
              <div className="text-center text-white">
                <Video size={64} className="mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium">Video Call Session</p>
                <p className="text-gray-400 text-sm mt-1">with {otherPerson}</p>
                <div className="mt-4 flex items-center justify-center gap-2 text-gold">
                  <Clock size={16} />
                  <span className="font-mono text-lg">{formatElapsed(elapsed)}</span>
                </div>
              </div>
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3">
                <button
                  onClick={handleEndSession}
                  className="px-6 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <PhoneOff size={18} />
                  End Session
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-md">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-white flex items-center justify-center font-bold text-sm">
                    {getInitials(otherPerson || '')}
                  </div>
                  <div>
                    <p className="font-medium">{otherPerson}</p>
                    <p className="text-xs text-green-500">Online</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-gold">
                  <Clock size={16} />
                  <span className="font-mono">{formatElapsed(elapsed)}</span>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 && (
                  <p className="text-center text-gray-400 mt-8">Start the conversation...</p>
                )}
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.sender === user?.fullName ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-4 py-2 rounded-2xl ${
                        msg.sender === user?.fullName
                          ? 'bg-royal text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{msg.text}</p>
                      <p className="text-xs opacity-60 mt-1">{msg.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                />
                <button
                  onClick={handleSendMessage}
                  className="px-4 py-2 bg-royal text-white rounded-lg hover:bg-royal-dark transition-colors"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="p-4 border-t border-gray-100">
                <button
                  onClick={handleEndSession}
                  className="w-full py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  <PhoneOff size={16} />
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-semibold text-navy mb-3">Session Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span>{appointment.appointmentDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span>{formatTime(appointment.appointmentTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="flex items-center gap-1">
                  {appointment.sessionType === 'video_call' ? <Video size={14} /> : <MessageSquare size={14} />}
                  {appointment.sessionType === 'video_call' ? 'Video' : 'Chat'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-md p-4">
            <h3 className="font-semibold text-navy mb-3 flex items-center gap-2">
              <FileText size={16} />
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              placeholder="Take notes during the session..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-royal focus:border-transparent outline-none resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Session;
