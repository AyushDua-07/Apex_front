import React, { useState, useEffect } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getPlans, subscribeToPlan } from '../services/api';
import type { MembershipPlan } from '../types';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

// Static display info keyed by plan name (features and price are not in the DB model)
const planDisplay: Record<string, { price: string; features: string[] }> = {
  Basic: {
    price: 'Free',
    features: [
      'Up to 10 sessions/month',
      'Email support',
      'Basic listing',
      'Standard visibility',
    ],
  },
  Standard: {
    price: '$29/mo',
    features: [
      'Up to 50 sessions/month',
      'Priority email + chat support',
      'Featured listing',
      'Enhanced visibility',
      'Analytics dashboard',
    ],
  },
  Premium: {
    price: '$79/mo',
    features: [
      'Unlimited sessions',
      '24/7 dedicated support',
      'Top listing priority',
      'Maximum visibility',
      'Advanced analytics',
      'Custom branding',
    ],
  },
};

const Pricing: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPlans();
        setPlans(res.data);
      } catch {
        addToast('error', 'Failed to load plans.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Load current consultant plan if applicable
  useEffect(() => {
    if (isAuthenticated && user?.role === 'consultant') {
      import('../services/api').then(({ getMyConsultantProfile }) => {
        getMyConsultantProfile().then((res) => {
          setCurrentPlanId(res.data.membershipPlan?._id || null);
        }).catch(() => {});
      });
    }
  }, [isAuthenticated, user]);

  const handleSubscribe = async (planId: string) => {
    if (!isAuthenticated) {
      addToast('info', 'Please sign up as a consultant first.');
      return;
    }
    if (user?.role !== 'consultant') {
      addToast('info', 'Plans are for consultants. Sign up as a consultant to subscribe.');
      return;
    }

    setSubscribing(planId);
    try {
      await subscribeToPlan(planId);
      setCurrentPlanId(planId);
      addToast('success', 'Plan updated successfully!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to subscribe.';
      addToast('error', msg);
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) return <LoadingSpinner />;

  // Determine which plan is "popular" (Standard / middle one)
  const popularName = 'Standard';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-navy mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your consulting practice. All plans include access to our marketplace and booking system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const display = planDisplay[plan.planName] || { price: 'Contact us', features: [] };
          const isPopular = plan.planName === popularName;
          const isCurrent = currentPlanId === plan._id;

          return (
            <div
              key={plan._id}
              className={`bg-white rounded-2xl shadow-md p-8 relative ${
                isPopular ? 'ring-2 ring-royal' : ''
              }`}
            >
              {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-royal text-white text-xs font-medium rounded-full">
                  Most Popular
                </span>
              )}
              {isCurrent && (
                <span className="absolute -top-3 right-4 px-4 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                  Current Plan
                </span>
              )}
              <h3 className="text-xl font-bold text-navy">{plan.planName}</h3>
              <div className="mt-4 mb-2">
                <span className="text-3xl font-bold text-navy">{display.price}</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Platform commission: <span className="font-semibold text-gold">{plan.commissionRate}%</span>
              </p>
              <p className="text-xs text-gray-400 mb-6">
                {plan.monthlyTransactionLimit === -1
                  ? 'Unlimited sessions'
                  : `Up to ${plan.monthlyTransactionLimit} sessions/month`}
              </p>
              <ul className="space-y-3 mb-8">
                {display.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check size={16} className="text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {isAuthenticated && user?.role === 'consultant' ? (
                <button
                  onClick={() => handleSubscribe(plan._id)}
                  disabled={isCurrent || subscribing === plan._id}
                  className={`block w-full py-3 text-center font-semibold rounded-xl transition-colors ${
                    isCurrent
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : isPopular
                      ? 'bg-royal text-white hover:bg-royal-dark disabled:opacity-50'
                      : 'bg-gray-100 text-navy hover:bg-gray-200 disabled:opacity-50'
                  }`}
                >
                  {subscribing === plan._id ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 size={16} className="animate-spin" /> Subscribing...
                    </span>
                  ) : isCurrent ? (
                    'Current Plan'
                  ) : (
                    'Select Plan'
                  )}
                </button>
              ) : (
                <Link
                  to="/signup"
                  className={`block w-full py-3 text-center font-semibold rounded-xl transition-colors ${
                    isPopular
                      ? 'bg-royal text-white hover:bg-royal-dark'
                      : 'bg-gray-100 text-navy hover:bg-gray-200'
                  }`}
                >
                  Get Started
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Pricing;
