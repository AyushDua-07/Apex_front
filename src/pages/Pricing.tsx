import React, { useState, useEffect } from 'react';
import { Check, Loader2, Zap, Star, Crown, ChevronRight, Shield, CreditCard } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlans, subscribeToPlan, getMySubscription, getMyConsultantProfile } from '../services/api';
import type { MembershipPlan, ClientSubscription } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';
import PaymentModal from '../components/PaymentModal';

const planConfig: Record<string, {
  monthlyPrice: number; yearlyPrice: number; icon: React.ReactNode;
  features: { text: string; included: boolean }[]; usageLimits: string[];
}> = {
  Basic: {
    monthlyPrice: 0, yearlyPrice: 0, icon: <Zap size={22} />,
    features: [
      { text: 'Basic platform access', included: true }, { text: 'Standard listing visibility', included: true },
      { text: 'Basic customer support', included: true }, { text: 'Enhanced platform features', included: false },
      { text: 'Priority listing', included: false }, { text: 'Dedicated support', included: false },
    ],
    usageLimits: ['Up to 3 sessions per month', 'Standard transaction processing'],
  },
  Standard: {
    monthlyPrice: 29, yearlyPrice: 23, icon: <Star size={22} />,
    features: [
      { text: 'Basic platform access', included: true }, { text: 'Standard listing visibility', included: true },
      { text: 'Basic customer support', included: true }, { text: 'Enhanced platform features', included: true },
      { text: 'Higher visibility in search', included: true }, { text: 'Priority over Basic users', included: true },
    ],
    usageLimits: ['Up to 15 sessions per month', 'Faster processing'],
  },
  Premium: {
    monthlyPrice: 79, yearlyPrice: 63, icon: <Crown size={22} />,
    features: [
      { text: 'Full platform access', included: true }, { text: 'Maximum visibility & priority listing', included: true },
      { text: 'Dedicated priority support', included: true }, { text: 'Enhanced platform features', included: true },
      { text: 'Advanced analytics', included: true }, { text: 'Custom branding options', included: true },
    ],
    usageLimits: ['Unlimited sessions', 'No usage restrictions'],
  },
};

const commissionMap: Record<string, string> = { Basic: '15% per transaction', Standard: '10% per transaction', Premium: '5% per transaction' };

const Pricing: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [clientSubscription, setClientSubscription] = useState<ClientSubscription | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [paymentPlan, setPaymentPlan] = useState<MembershipPlan | null>(null);

  useEffect(() => {
    getPlans().then((res) => setPlans(res.data)).catch(() => addToast('error', 'Failed to load plans.')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.role === 'client') {
      getMySubscription().then((res) => { if (res.data.hasSubscription) { setClientSubscription(res.data.subscription); setCurrentPlanId(res.data.subscription.plan?._id || null); } }).catch(() => {});
    } else if (user.role === 'consultant') {
      getMyConsultantProfile().then((res) => setCurrentPlanId(res.data.membershipPlan?._id || null)).catch(() => {});
    }
  }, [isAuthenticated, user]);

  const handleConsultantSubscribe = async (planId: string, planName: string) => {
    if (!isAuthenticated || user?.role !== 'consultant') { addToast('info', 'Plans for consultants only.'); return; }
    setSubscribing(planId);
    try { await subscribeToPlan(planId); setCurrentPlanId(planId); addToast('success', `Subscribed to ${planName}!`); }
    catch (err: unknown) { addToast('error', (err as any)?.response?.data?.message || 'Failed.'); }
    finally { setSubscribing(null); }
  };

  const handleClientSelect = (plan: MembershipPlan) => {
    if (!isAuthenticated) { addToast('info', 'Please sign up first.'); return; }
    setPaymentPlan(plan);
  };

  const handlePaymentSuccess = async () => {
    setPaymentPlan(null);
    try { const res = await getMySubscription(); if (res.data.hasSubscription) { setClientSubscription(res.data.subscription); setCurrentPlanId(res.data.subscription.plan?._id || null); } } catch {}
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gray-950 pt-20 pb-12">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-3">Revenue Model</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Simple, Transparent<br /><span className="text-yellow-400">Pricing Plans</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-4">
            {user?.role === 'client' ? 'Choose a plan to start booking sessions.' : 'Choose the tier that fits your practice.'}
          </p>
          <div className="inline-flex items-center bg-gray-900 border border-gray-800 rounded-full p-1 mt-4">
            <button onClick={() => setBilling('monthly')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === 'monthly' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-white'}`}>Monthly</button>
            <button onClick={() => setBilling('yearly')} className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${billing === 'yearly' ? 'bg-yellow-400 text-gray-900' : 'text-gray-400 hover:text-white'}`}>Yearly <span className="ml-1.5 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">-20%</span></button>
          </div>
        </div>
      </div>

      {/* Client subscription banner */}
      {isAuthenticated && user?.role === 'client' && clientSubscription && (
        <div className="max-w-6xl mx-auto px-4 mb-6">
          <div className="bg-green-900/30 border border-green-700 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Shield size={20} className="text-green-400" />
              <div>
                <p className="font-semibold text-green-300">Active: {clientSubscription.plan?.planName} Plan</p>
                <p className="text-sm text-green-400">{typeof clientSubscription.remaining === 'string' ? clientSubscription.remaining : `${clientSubscription.remaining} sessions remaining`}</p>
              </div>
            </div>
            {clientSubscription.cardLast4 && (
              <div className="flex items-center gap-2 text-sm text-green-400"><CreditCard size={16} /><span>{clientSubscription.cardBrand} ****{clientSubscription.cardLast4}</span></div>
            )}
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const cfg = planConfig[plan.planName] || planConfig['Basic'];
            const isCurrent = currentPlanId === plan._id;
            const isPopular = plan.planName === 'Standard';
            const price = billing === 'monthly' ? cfg.monthlyPrice : cfg.yearlyPrice;

            return (
              <div key={plan._id} className={`relative rounded-2xl border transition-all ${isPopular ? 'border-yellow-400 bg-gray-900 shadow-[0_0_40px_rgba(250,204,21,0.12)]' : 'border-gray-800 bg-gray-900/60'}`}>
                {isPopular && <div className="absolute -top-3.5 left-1/2 -translate-x-1/2"><span className="bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">Most Popular</span></div>}
                {isCurrent && <div className="absolute -top-3.5 right-4"><span className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">Current Plan</span></div>}

                <div className="p-7">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-400 text-sm font-semibold mb-5">{cfg.icon} {plan.planName} Tier</div>

                  <div className={`rounded-xl border mb-6 p-4 text-center ${isPopular ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-gray-700 bg-gray-800/50'}`}>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Commission</p>
                    <p className="text-white font-bold text-lg">{commissionMap[plan.planName] || `${plan.commissionRate}%`}</p>
                  </div>

                  <div className="mb-6">
                    {cfg.monthlyPrice === 0
                      ? <span className="text-4xl font-bold text-white">Free</span>
                      : <><span className="text-gray-400 text-lg">$</span><span className="text-4xl font-bold text-white">{price}</span><span className="text-gray-400 text-sm">/mo</span>{billing === 'yearly' && <span className="ml-2 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Save 20%</span>}</>}
                  </div>

                  <div className="mb-5">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">Features</p>
                    <ul className="space-y-2.5">
                      {cfg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${f.included ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-600'}`}>
                            {f.included ? <Check size={10} strokeWidth={3} /> : <span className="text-xs">–</span>}
                          </span>
                          <span className={`text-sm ${f.included ? 'text-gray-200' : 'text-gray-600 line-through'}`}>{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mb-7 border-t border-gray-800 pt-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">Usage</p>
                    <ul className="space-y-2">{cfg.usageLimits.map((l, i) => <li key={i} className="flex items-center gap-2 text-sm text-gray-300"><ChevronRight size={13} className="text-yellow-400" />{l}</li>)}</ul>
                  </div>

                  {/* CTA */}
                  {isAuthenticated && user?.role === 'consultant' ? (
                    <button onClick={() => handleConsultantSubscribe(plan._id, plan.planName)} disabled={isCurrent || subscribing === plan._id}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${isCurrent ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default' : isPopular ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'} disabled:opacity-60`}>
                      {subscribing === plan._id ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : isCurrent ? <><Check size={16} /> Current Plan</> : `Select ${plan.planName}`}
                    </button>
                  ) : isAuthenticated && user?.role === 'client' ? (
                    <button onClick={() => handleClientSelect(plan)} disabled={isCurrent}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${isCurrent ? 'bg-green-500/20 text-green-400 cursor-default' : isPopular ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>
                      {isCurrent ? 'Current Plan' : cfg.monthlyPrice === 0 ? 'Get Started Free' : `Subscribe — $${price}/mo`}
                    </button>
                  ) : (
                    <Link to="/signup" className={`block w-full py-3 rounded-xl font-semibold text-sm text-center ${isPopular ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300' : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'}`}>Get Started</Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Comparison table */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 border-b border-gray-800">
            <div className="p-5 border-r border-gray-800" />
            {['Basic Tier', 'Standard Tier', 'Premium Tier'].map((name, i) => <div key={name} className={`p-5 text-center ${i < 2 ? 'border-r border-gray-800' : ''}`}><span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400 text-gray-900 text-sm font-bold">{name}</span></div>)}
          </div>
          {[
            { label: 'Commission', values: ['15%', '10%', '5%'] },
            { label: 'Sessions/month', values: ['3', '15', 'Unlimited'] },
            { label: 'Support', values: ['Basic', 'Priority', 'Dedicated 24/7'] },
            { label: 'Listing', values: ['Standard', 'Enhanced', 'Maximum'] },
          ].map((row, ri) => (
            <div key={ri} className={`grid grid-cols-4 ${ri < 3 ? 'border-b border-gray-800' : ''}`}>
              <div className="p-4 border-r border-gray-800"><p className="text-gray-300 text-sm font-medium">{row.label}</p></div>
              {row.values.map((val, vi) => <div key={vi} className={`p-4 text-center ${vi < 2 ? 'border-r border-gray-800' : ''}`}><p className="text-gray-300 text-sm">{val}</p></div>)}
            </div>
          ))}
        </div>
      </div>

      {paymentPlan && <PaymentModal plan={paymentPlan} onClose={() => setPaymentPlan(null)} onSuccess={handlePaymentSuccess} />}
    </div>
  );
};

export default Pricing;
