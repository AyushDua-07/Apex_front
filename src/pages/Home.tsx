import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Shield, Clock, Users, ArrowRight, Star, Zap } from 'lucide-react';
import { getAdvisors } from '../services/api';
import type { Consultant } from '../types';
import ConsultantCard from '../components/ConsultantCard';

const Home: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featured, setFeatured] = useState<Consultant[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const loadFeatured = async () => {
      try {
        const res = await getAdvisors();
        setFeatured(res.data.slice(0, 3));
      } catch {
        setFeatured([]);
      }
    };
    loadFeatured();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/consultants?query=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-light to-royal text-white py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Expert Consulting,<br />
            <span className="text-gold">On Demand</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Connect with verified professional consultants who help entrepreneurs and small businesses grow.
          </p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by name, specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-gold-dark transition-colors"
            >
              Search
            </button>
          </form>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-navy mb-12">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Search size={32} />, title: 'Find Your Expert', desc: 'Browse our verified consultants by specialization, rating, and availability.' },
              { icon: <Clock size={32} />, title: 'Book a Session', desc: 'Choose a time that works for you and book your consultation in minutes.' },
              { icon: <Zap size={32} />, title: 'Get Results', desc: 'Connect via video call or chat and get actionable advice for your business.' },
            ].map((step, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 text-center shadow-md hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 bg-royal/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-royal">
                  {step.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy mb-2">{step.title}</h3>
                <p className="text-gray-600 text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Consultants */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-bold text-navy">Featured Consultants</h2>
            <Link to="/consultants" className="flex items-center gap-1 text-royal hover:text-royal-dark font-medium text-sm">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          {featured.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((c) => (
                <ConsultantCard key={c._id} consultant={c} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Users size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">No consultants available yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* Why Choose Apex */}
      <section className="py-16 bg-navy text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Apex Advisory</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: <Shield size={32} />, title: 'Verified Experts', desc: 'Every consultant is vetted and approved by our team.' },
              { icon: <Star size={32} />, title: 'Transparent Reviews', desc: 'Real reviews from real clients help you choose the right advisor.' },
              { icon: <Users size={32} />, title: 'Flexible Sessions', desc: 'Video calls, chat, and more — connect the way that works for you.' },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gold">
                  {item.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-300 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-r from-royal to-navy text-white text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
          <p className="text-gray-200 mb-8">Join thousands of entrepreneurs getting expert advice on Apex Advisory.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-3 bg-gold text-navy font-semibold rounded-xl hover:bg-gold-dark transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              to="/consultants"
              className="px-8 py-3 border-2 border-white text-white font-semibold rounded-xl hover:bg-white/10 transition-colors"
            >
              Browse Consultants
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
