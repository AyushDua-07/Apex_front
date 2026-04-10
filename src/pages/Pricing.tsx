import React, { useState, useEffect } from 'react';
import { Check, Loader2, Zap, Star, Crown, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlans, subscribeToPlan } from '../services/api';
import type { MembershipPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

// ── Plan display config ────────────────────────────────────────────────────────
const planConfig: Record<string, {
  monthlyPrice: number;
  yearlyPrice: number;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  badgeColor: string;
  badgeText: string;
  features: { text: string; included: boolean }[];
  usageLimits: string[];
}> = {
  Basic: {
    monthlyPrice: 0,
    yearlyPrice: 0,
    icon: <Zap size={22} />,
    color: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-400',
    badgeColor: 'bg-yellow-400 text-gray-900',
    badgeText: 'Starter',
    features: [
      { text: 'Basic platform access', included: true },
      { text: 'Standard listing visibility', included: true },
      { text: 'Basic customer support', included: true },
      { text: 'Enhanced platform features', included: false },
      { text: 'Priority listing', included: false },
      { text: 'Dedicated support', included: false },
    ],
    usageLimits: [
      'Limited sessions per month',
      'Standard transaction processing',
    ],
  },
  Standard: {
    monthlyPrice: 29,
    yearlyPrice: 23,
    icon: <Star size={22} />,
    color: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-400',
    badgeColor: 'bg-yellow-400 text-gray-900',
    badgeText: 'Most Popular',
    features: [
      { text: 'Basic platform access', included: true },
      { text: 'Standard listing visibility', included: true },
      { text: 'Basic customer support', included: true },
      { text: 'Enhanced platform features', included: true },
      { text: 'Higher visibility in search', included: true },
      { text: 'Priority over Basic users', included: true },
    ],
    usageLimits: [
      'Increased transaction limits',
      'Faster processing',
    ],
  },
  Premium: {
    monthlyPrice: 79,
    yearlyPrice: 63,
    icon: <Crown size={22} />,
    color: 'from-yellow-400 to-yellow-500',
    borderColor: 'border-yellow-400',
    badgeColor: 'bg-yellow-400 text-gray-900',
    badgeText: 'Best Value',
    features: [
      { text: 'Full platform access', included: true },
      { text: 'Maximum visibility & priority listing', included: true },
      { text: 'Dedicated priority support', included: true },
      { text: 'Enhanced platform features', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Custom branding options', included: true },
    ],
    usageLimits: [
      'Unlimited transactions',
      'No usage restrictions',
    ],
  },
};

// ── Commission badge ───────────────────────────────────────────────────────────
const commissionMap: Record<string, string> = {
  Basic: '15% per successful transaction',
  Standard: '10% per successful transaction',
  Premium: '5% per successful transaction',
};

const Pricing: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    getPlans()
      .then((res) => setPlans(res.data))
      .catch(() => addToast('error', 'Failed to load plans.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'consultant') {
      import('../services/api').then(({ getMyConsultantProfile }) => {
        getMyConsultantProfile()
          .then((res) => setCurrentPlanId(res.data.membershipPlan?._id || null))
          .catch(() => {});
      });
    }
  }, [isAuthenticated, user]);

  const handleSubscribe = async (planId: string, planName: string) => {
    if (!isAuthenticated) {
      addToast('info', 'Please sign up as a consultant first.');
      return;
    }
    if (user?.role !== 'consultant') {
      addToast('info', 'Plans are for consultants only.');
      return;
    }
    setSubscribing(planId);
    try {
      await subscribeToPlan(planId);
      setCurrentPlanId(planId);
      addToast('success', `Subscribed to ${planName} plan!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to subscribe.';
      addToast('error', msg);
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="min-h-screen bg-gray-950">

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gray-950 pt-20 pb-12">
        {/* decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-yellow-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-1/4 w-[200px] h-[200px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-1/4 w-[200px] h-[200px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 text-center">
          <p className="text-yellow-400 text-sm font-semibold uppercase tracking-widest mb-3">Revenue Model</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">
            Simple, Transparent<br />
            <span className="text-yellow-400">Pricing Plans</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-xl mx-auto mb-8">
            Choose the tier that fits your practice. Lower commission as you grow.
          </p>
          <p className="text-xs text-gray-500">*Subject to Vary</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-gray-900 border border-gray-800 rounded-full p-1 mt-6">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'monthly'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                billing === 'yearly'
                  ? 'bg-yellow-400 text-gray-900'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded-full">-20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Plan cards ────────────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan, idx) => {
            const cfg = planConfig[plan.planName] || planConfig['Basic'];
            const isCurrent = currentPlanId === plan._id;
            const isPopular = plan.planName === 'Standard';
            const price = billing === 'monthly' ? cfg.monthlyPrice : cfg.yearlyPrice;

            return (
              <div
                key={plan._id}
                className={`relative rounded-2xl border transition-all duration-300 ${
                  isPopular
                    ? 'border-yellow-400 bg-gray-900 shadow-[0_0_40px_rgba(250,204,21,0.12)]'
                    : 'border-gray-800 bg-gray-900/60'
                }`}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span className="bg-yellow-400 text-gray-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">
                      Most Popular
                    </span>
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3.5 right-4">
                    <span className="bg-green-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Current Plan
                    </span>
                  </div>
                )}

                <div className="p-7">
                  {/* Plan header */}
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-400/10 text-yellow-400 text-sm font-semibold mb-2`}>
                        {cfg.icon}
                        {plan.planName} Tier
                      </div>
                    </div>
                  </div>

                  {/* Commission — the key pricing metric from the image */}
                  <div className={`rounded-xl border mb-6 p-4 text-center ${
                    isPopular ? 'border-yellow-400/30 bg-yellow-400/5' : 'border-gray-700 bg-gray-800/50'
                  }`}>
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Pricing</p>
                    <p className="text-white font-bold text-lg">
                      {commissionMap[plan.planName] || `${plan.commissionRate}% per transaction`}
                    </p>
                  </div>

                  {/* Monthly subscription price */}
                  <div className="mb-6">
                    {cfg.monthlyPrice === 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-white">Free</span>
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-gray-400 text-lg">$</span>
                        <span className="text-4xl font-bold text-white">{price}</span>
                        <span className="text-gray-400 text-sm">/mo</span>
                        {billing === 'yearly' && (
                          <span className="ml-2 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">Save 20%</span>
                        )}
                      </div>
                    )}
                    {billing === 'yearly' && cfg.monthlyPrice > 0 && (
                      <p className="text-gray-500 text-xs mt-1">Billed ${price * 12}/year</p>
                    )}
                  </div>

                  {/* Features */}
                  <div className="mb-5">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">Features</p>
                    <ul className="space-y-2.5">
                      {cfg.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2.5">
                          <span className={`mt-0.5 flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${
                            f.included ? 'bg-yellow-400/20 text-yellow-400' : 'bg-gray-800 text-gray-600'
                          }`}>
                            {f.included ? (
                              <Check size={10} strokeWidth={3} />
                            ) : (
                              <span className="text-xs leading-none">–</span>
                            )}
                          </span>
                          <span className={`text-sm ${f.included ? 'text-gray-200' : 'text-gray-600 line-through'}`}>
                            {f.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Usage limits */}
                  <div className="mb-7 border-t border-gray-800 pt-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wider mb-3 font-semibold">Usage Limits</p>
                    <ul className="space-y-2">
                      {cfg.usageLimits.map((limit, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                          <ChevronRight size={13} className="text-yellow-400 flex-shrink-0" />
                          {limit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA button */}
                  {isAuthenticated && user?.role === 'consultant' ? (
                    <button
                      onClick={() => handleSubscribe(plan._id, plan.planName)}
                      disabled={isCurrent || subscribing === plan._id}
                      className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        isCurrent
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30 cursor-default'
                          : isPopular
                          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300 active:scale-95'
                          : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700 active:scale-95'
                      } disabled:opacity-60 disabled:cursor-not-allowed`}
                    >
                      {subscribing === plan._id ? (
                        <><Loader2 size={16} className="animate-spin" /> Processing...</>
                      ) : isCurrent ? (
                        <><Check size={16} /> Current Plan</>
                      ) : (
                        `Select ${plan.planName}`
                      )}
                    </button>
                  ) : (
                    <Link
                      to="/signup"
                      className={`block w-full py-3 rounded-xl font-semibold text-sm text-center transition-all active:scale-95 ${
                        isPopular
                          ? 'bg-yellow-400 text-gray-900 hover:bg-yellow-300'
                          : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      Get Started
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Commission comparison table ────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-4 pb-16">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
          <div className="grid grid-cols-4 border-b border-gray-800">
            <div className="p-5 border-r border-gray-800">
              <p className="text-gray-400 text-sm font-semibold uppercase tracking-wide"></p>
            </div>
            {['Basic Tier', 'Standard Tier', 'Premium Tier'].map((name, i) => (
              <div key={name} className={`p-5 text-center ${i < 2 ? 'border-r border-gray-800' : ''}`}>
                <span className="inline-block px-4 py-1.5 rounded-full bg-yellow-400 text-gray-900 text-sm font-bold">
                  {name}
                </span>
              </div>
            ))}
          </div>

          {[
            { label: 'Pricing', values: ['15% per transaction', '10% per transaction', '5% per transaction'] },
            { label: 'Platform Access', values: ['Basic', 'Enhanced', 'Full'] },
            { label: 'Listing Visibility', values: ['Standard', 'Higher in search', 'Maximum + Priority'] },
            { label: 'Support', values: ['Basic support', 'Priority support', 'Dedicated 24/7'] },
            { label: 'Monthly Sessions', values: ['Limited', 'Increased limits', 'Unlimited'] },
            { label: 'Processing Speed', values: ['Standard', 'Faster', 'Priority'] },
          ].map((row, ri) => (
            <div key={ri} className={`grid grid-cols-4 ${ri < 5 ? 'border-b border-gray-800' : ''}`}>
              <div className="p-4 border-r border-gray-800 flex items-center">
                <p className="text-gray-300 text-sm font-medium">{row.label}</p>
              </div>
              {row.values.map((val, vi) => (
                <div key={vi} className={`p-4 text-center flex items-center justify-center ${vi < 2 ? 'border-r border-gray-800' : ''}`}>
                  <p className="text-gray-300 text-sm">{val}</p>
                </div>
              ))}
            </div>
          ))}
        </div>

        <p className="text-center text-gray-600 text-xs mt-4">*All prices subject to vary. Commission rates apply per successful transaction.</p>
      </div>

    </div>
  );
};

export default Pricing;
