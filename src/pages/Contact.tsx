import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { submitContactForm } from '../services/api';

const Contact: React.FC = () => {
  const { addToast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await submitContactForm(form);
      addToast('success', 'Message sent! We will get back to you soon.');
      setForm({ name: '', email: '', subject: '', message: '' });
    } catch {
      addToast('error', 'Failed to send message. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-navy mb-4">Get in Touch</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Have a question or need help? We'd love to hear from you.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-md p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input
                  type="text"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <Send size={18} />
                {submitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-royal/10 rounded-lg flex items-center justify-center text-royal">
                <Mail size={20} />
              </div>
              <div>
                <p className="font-medium text-navy">Email</p>
                <p className="text-sm text-gray-500">support@apexadvisory.com</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-royal/10 rounded-lg flex items-center justify-center text-royal">
                <Phone size={20} />
              </div>
              <div>
                <p className="font-medium text-navy">Phone</p>
                <p className="text-sm text-gray-500">+1 (555) 123-4567</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-royal/10 rounded-lg flex items-center justify-center text-royal">
                <MapPin size={20} />
              </div>
              <div>
                <p className="font-medium text-navy">Address</p>
                <p className="text-sm text-gray-500">123 Business Ave, Suite 100<br />San Francisco, CA 94102</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
