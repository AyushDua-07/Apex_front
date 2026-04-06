import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const plans = [
  {
    name: 'Basic',
    commission: '15%',
    price: 'Free',
    features: [
      'Up to 10 sessions/month',
      'Email support',
      'Basic listing',
      'Standard visibility',
    ],
    popular: false,
  },
  {
    name: 'Standard',
    commission: '10%',
    price: '$29/mo',
    features: [
      'Up to 50 sessions/month',
      'Priority email + chat support',
      'Featured listing',
      'Enhanced visibility',
      'Analytics dashboard',
    ],
    popular: true,
  },
  {
    name: 'Premium',
    commission: '5%',
    price: '$79/mo',
    features: [
      'Unlimited sessions',
      '24/7 dedicated support',
      'Top listing priority',
      'Maximum visibility',
      'Advanced analytics',
      'Custom branding',
    ],
    popular: false,
  },
];

const Pricing: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-navy mb-4">Simple, Transparent Pricing</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Choose the plan that fits your consulting practice. All plans include access to our marketplace and booking system.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-2xl shadow-md p-8 relative ${
              plan.popular ? 'ring-2 ring-royal' : ''
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-royal text-white text-xs font-medium rounded-full">
                Most Popular
              </span>
            )}
            <h3 className="text-xl font-bold text-navy">{plan.name}</h3>
            <div className="mt-4 mb-2">
              <span className="text-3xl font-bold text-navy">{plan.price}</span>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Platform commission: <span className="font-semibold text-gold">{plan.commission}</span>
            </p>
            <ul className="space-y-3 mb-8">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check size={16} className="text-green-500 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              className={`block w-full py-3 text-center font-semibold rounded-xl transition-colors ${
                plan.popular
                  ? 'bg-royal text-white hover:bg-royal-dark'
                  : 'bg-gray-100 text-navy hover:bg-gray-200'
              }`}
            >
              Get Started
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Pricing;
