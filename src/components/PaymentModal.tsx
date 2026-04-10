import React, { useState } from 'react';
import { X, CreditCard, Lock, Check, Loader2 } from 'lucide-react';
import type { MembershipPlan } from '../types';
import { clientSubscribe } from '../services/api';
import { useToast } from '../context/ToastContext';

interface Props {
  plan: MembershipPlan;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<Props> = ({ plan, onClose, onSuccess }) => {
  const { addToast } = useToast();
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatCardNumber = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    return cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
  };

  const formatExpiry = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 3) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  };

  const detectCardBrand = (num: string): string => {
    const clean = num.replace(/\s/g, '');
    if (/^4/.test(clean)) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    if (/^6(?:011|5)/.test(clean)) return 'Discover';
    return '';
  };

  const cardBrand = detectCardBrand(cardNumber);

  const handleSubmit = async () => {
    if (plan.price > 0) {
      if (!cardName.trim()) { addToast('error', 'Please enter the cardholder name.'); return; }
      if (cardNumber.replace(/\s/g, '').length < 13) { addToast('error', 'Please enter a valid card number.'); return; }
      if (cardExpiry.length < 5) { addToast('error', 'Please enter a valid expiry date.'); return; }
      if (cardCvc.length < 3) { addToast('error', 'Please enter a valid CVC.'); return; }
    }

    setProcessing(true);
    try {
      await clientSubscribe({
        planId: plan._id,
        cardNumber: cardNumber.replace(/\s/g, ''),
        cardExpiry,
        cardCvc,
        cardName,
      });
      setSuccess(true);
      addToast('success', plan.price > 0
        ? `Payment of $${plan.price} processed! You're now on the ${plan.planName} plan.`
        : `You're now on the ${plan.planName} plan!`
      );
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Payment failed. Please try again.';
      addToast('error', msg);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check size={32} className="text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-navy mb-2">Payment Successful!</h3>
          <p className="text-gray-600">
            You are now subscribed to the <span className="font-semibold">{plan.planName}</span> plan.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-navy">Subscribe to {plan.planName}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {plan.price === 0 ? 'Free plan — no payment required' : `$${plan.price}/month`}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* Plan Summary */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100">
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-medium text-gray-700">{plan.planName} Plan</span>
            <span className="text-lg font-bold text-navy">
              {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
            </span>
          </div>
          <ul className="space-y-1.5">
            {(plan.features || []).map((f, i) => (
              <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                <Check size={12} className="text-green-500 flex-shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Payment Form */}
        <div className="p-6 space-y-4">
          {plan.price > 0 ? (
            <>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard size={18} className="text-royal" />
                <span className="text-sm font-semibold text-navy">Payment Details</span>
                <div className="flex-1" />
                <Lock size={14} className="text-green-500" />
                <span className="text-xs text-green-600">Secure</span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none pr-20"
                  />
                  {cardBrand && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {cardBrand}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-royal focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
                This is a simulated payment. No real charges will be made. Use any valid-looking card number (e.g., 4242 4242 4242 4242).
              </div>
            </>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Check size={24} className="text-green-600 mx-auto mb-2" />
              <p className="text-sm text-green-700 font-medium">No payment required for the Basic plan.</p>
              <p className="text-xs text-green-600 mt-1">Click below to activate your free plan.</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={processing}
            className="w-full py-3 bg-royal text-white font-semibold rounded-xl hover:bg-royal-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {processing ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Processing...
              </>
            ) : plan.price > 0 ? (
              <>
                <Lock size={16} />
                Pay ${plan.price} & Subscribe
              </>
            ) : (
              'Activate Free Plan'
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
