import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Users } from 'lucide-react';
import { getAdvisors } from '../services/api';
import type { Consultant } from '../types';
import ConsultantCard from '../components/ConsultantCard';
import LoadingSpinner from '../components/LoadingSpinner';

const industries = ['All', 'Finance', 'Marketing', 'Technology', 'Legal', 'Healthcare', 'Strategy', 'Operations', 'HR'];

const Consultants: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('query') || '');
  const [industry, setIndustry] = useState('All');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const params: { query?: string; industry?: string } = {};
        if (search) params.query = search;
        if (industry !== 'All') params.industry = industry;
        const res = await getAdvisors(params);
        setConsultants(res.data);
      } catch {
        setError('Failed to load consultants. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [search, industry]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-navy mb-8">Find Your Expert Consultant</h1>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search consultants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
          />
        </div>
        <select
          value={industry}
          onChange={(e) => setIndustry(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-royal focus:border-transparent outline-none bg-white"
        >
          {industries.map((ind) => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{error}</p>
        </div>
      ) : consultants.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No consultants available yet</h3>
          <p className="text-gray-500">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultants.map((c) => (
            <ConsultantCard key={c._id} consultant={c} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Consultants;
