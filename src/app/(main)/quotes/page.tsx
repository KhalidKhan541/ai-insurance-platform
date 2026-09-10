'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Car,
  Home,
  Heart,
  Briefcase,
  Shield,
  Brain,
  Zap,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  DollarSign,
  Clock,
  TrendingDown,
  Star,
  ArrowRight,
  Info,
  AlertCircle,
  Sparkles,
  Calculator,
  ShieldCheck,
  Award,
  Percent,
} from 'lucide-react';

const insuranceTypes = [
  {
    id: 'auto',
    name: 'Auto Insurance',
    icon: Car,
    description: 'Protect your vehicle and liability on the road',
    popular: true,
    startingPrice: 45,
  },
  {
    id: 'home',
    name: 'Home Insurance',
    icon: Home,
    description: 'Comprehensive coverage for your home and belongings',
    popular: true,
    startingPrice: 65,
  },
  {
    id: 'life',
    name: 'Life Insurance',
    icon: Heart,
    description: 'Secure your family\'s financial future',
    popular: false,
    startingPrice: 25,
  },
  {
    id: 'business',
    name: 'Business Insurance',
    icon: Briefcase,
    description: 'Protect your business from unexpected events',
    popular: false,
    startingPrice: 99,
  },
];

const coverageLevels = [
  {
    id: 'basic',
    name: 'Basic',
    description: 'Essential coverage at an affordable price',
    multiplier: 1,
    features: [
      'Liability coverage',
      'Basic claims processing',
      'Email support',
      'Digital policy management',
    ],
  },
  {
    id: 'standard',
    name: 'Standard',
    description: 'Balanced coverage with added benefits',
    multiplier: 1.5,
    popular: true,
    features: [
      'Enhanced liability coverage',
      'Priority claims processing',
      'Phone & chat support',
      'Roadside assistance',
      'Rental coverage',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'Maximum protection with premium perks',
    multiplier: 2.2,
    features: [
      'Maximum liability coverage',
      'Instant AI claims approval',
      '24/7 dedicated support',
      'Full roadside assistance',
      'Rental & trip interruption',
      'Accident forgiveness',
      'New car replacement',
    ],
  },
];

const addOns = [
  { id: 'roadside', name: 'Roadside Assistance', price: 8, description: '24/7 towing and breakdown help' },
  { id: 'rental', name: 'Rental Car Coverage', price: 12, description: 'Replacement vehicle while yours is repaired' },
  { id: 'gap', name: 'Gap Insurance', price: 15, description: 'Covers difference between value and loan amount' },
  { id: 'umbrella', name: 'Umbrella Policy', price: 25, description: 'Extra liability protection above limits' },
  { id: 'identity', name: 'Identity Theft Protection', price: 10, description: 'Monitoring and recovery assistance' },
];

const discountTypes = [
  { name: 'Safe Driver', percentage: 15, icon: Shield },
  { name: 'Multi-Policy', percentage: 10, icon: ShieldCheck },
  { name: 'Good Credit', percentage: 8, icon: Award },
  { name: 'Paperless', percentage: 5, icon: Sparkles },
];

export default function QuotesPage() {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    zipCode: '',
    vehicleYear: '',
    vehicleMake: '',
    vehicleModel: '',
    homeValue: '',
    coverageLevel: 'standard',
    addOns: [] as string[],
    currentInsurance: '',
    claimsHistory: 'none',
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [quoteResult, setQuoteResult] = useState<{
    monthlyPremium: number;
    annualPremium: number;
    savings: number;
    discounts: { name: string; amount: number }[];
  } | null>(null);

  const updateField = (field: string, value: string | string[]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleAddOn = (addOnId: string) => {
    const current = formData.addOns;
    if (current.includes(addOnId)) {
      updateField('addOns', current.filter((id) => id !== addOnId));
    } else {
      updateField('addOns', [...current, addOnId]);
    }
  };

  const calculateQuote = () => {
    setIsCalculating(true);

    setTimeout(() => {
      const basePrice = insuranceTypes.find((t) => t.id === selectedType)?.startingPrice || 50;
      const levelMultiplier = coverageLevels.find((l) => l.id === formData.coverageLevel)?.multiplier || 1.5;
      const addOnTotal = formData.addOns.reduce((sum, id) => {
        const addOn = addOns.find((a) => a.id === id);
        return sum + (addOn?.price || 0);
      }, 0);

      let monthly = basePrice * levelMultiplier + addOnTotal;

      const discounts: { name: string; amount: number }[] = [];
      discountTypes.forEach((d) => {
        if (Math.random() > 0.3) {
          const amount = Math.round(monthly * (d.percentage / 100));
          discounts.push({ name: d.name, amount });
          monthly -= amount;
        }
      });

      monthly = Math.max(monthly, 19.99);

      setQuoteResult({
        monthlyPremium: Math.round(monthly * 100) / 100,
        annualPremium: Math.round(monthly * 12 * 100) / 100,
        savings: discounts.reduce((sum, d) => sum + d.amount * 12, 0),
        discounts,
      });
      setIsCalculating(false);
      setStep(4);
    }, 2000);
  };

  const totalSteps = 3;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Get Your AI-Powered Quote
        </h1>
        <p className="text-slate-600 max-w-xl mx-auto">
          Answer a few questions and our AI will find the best coverage at the best price.
          Takes less than 60 seconds.
        </p>
      </div>

      {/* Progress Bar */}
      {step <= 3 && (
        <div className="card">
          <div className="card-body py-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-700">
                Step {step} of {totalSteps}
              </span>
              <span className="text-sm text-slate-500">
                {step === 1
                  ? 'Select Insurance Type'
                  : step === 2
                  ? 'Your Information'
                  : 'Coverage Options'}
              </span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill bg-blue-600"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Step 1: Select Type */}
      {step === 1 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-slate-900">
            What type of insurance do you need?
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {insuranceTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`card text-left transition-all duration-200 ${
                  selectedType === type.id
                    ? 'ring-2 ring-blue-500 shadow-md bg-blue-50'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="card-body">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        selectedType === type.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-blue-100 text-blue-600'
                      }`}
                    >
                      <type.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-slate-900">{type.name}</h3>
                        {type.popular && (
                          <span className="badge-blue text-[10px]">Popular</span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{type.description}</p>
                      <p className="text-sm font-semibold text-blue-600 mt-2">
                        From ${type.startingPrice}/mo
                      </p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        selectedType === type.id
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-slate-300'
                      }`}
                    >
                      {selectedType === type.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={() => setStep(2)}
              disabled={!selectedType}
              className="btn-primary"
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Personal Info */}
      {step === 2 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Tell us about yourself
          </h2>

          <div className="card">
            <div className="card-body">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Age</label>
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => updateField('age', e.target.value)}
                    className="input"
                    placeholder="e.g., 30"
                    min="18"
                    max="100"
                  />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="input"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                    <option value="prefer-not">Prefer not to say</option>
                  </select>
                </div>
                <div>
                  <label className="label">ZIP Code</label>
                  <input
                    type="text"
                    value={formData.zipCode}
                    onChange={(e) => updateField('zipCode', e.target.value)}
                    className="input"
                    placeholder="e.g., 78701"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="label">Claims History</label>
                  <select
                    value={formData.claimsHistory}
                    onChange={(e) => updateField('claimsHistory', e.target.value)}
                    className="input"
                  >
                    <option value="none">No claims in past 3 years</option>
                    <option value="1">1 claim in past 3 years</option>
                    <option value="2">2+ claims in past 3 years</option>
                  </select>
                </div>
              </div>

              {selectedType === 'auto' && (
                <>
                  <div className="divider my-6" />
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    Vehicle Information
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Year</label>
                      <input
                        type="number"
                        value={formData.vehicleYear}
                        onChange={(e) => updateField('vehicleYear', e.target.value)}
                        className="input"
                        placeholder="e.g., 2022"
                      />
                    </div>
                    <div>
                      <label className="label">Make</label>
                      <input
                        type="text"
                        value={formData.vehicleMake}
                        onChange={(e) => updateField('vehicleMake', e.target.value)}
                        className="input"
                        placeholder="e.g., Toyota"
                      />
                    </div>
                    <div>
                      <label className="label">Model</label>
                      <input
                        type="text"
                        value={formData.vehicleModel}
                        onChange={(e) => updateField('vehicleModel', e.target.value)}
                        className="input"
                        placeholder="e.g., Camry"
                      />
                    </div>
                  </div>
                </>
              )}

              {selectedType === 'home' && (
                <>
                  <div className="divider my-6" />
                  <h3 className="text-sm font-semibold text-slate-900 mb-4">
                    Home Information
                  </h3>
                  <div>
                    <label className="label">Estimated Home Value</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        type="number"
                        value={formData.homeValue}
                        onChange={(e) => updateField('homeValue', e.target.value)}
                        className="input pl-9"
                        placeholder="e.g., 350000"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(1)} className="btn-secondary">
              Back
            </button>
            <button onClick={() => setStep(3)} className="btn-primary">
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Coverage Options */}
      {step === 3 && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">
            Choose your coverage level
          </h2>

          {/* Coverage Levels */}
          <div className="grid sm:grid-cols-3 gap-4">
            {coverageLevels.map((level) => (
              <button
                key={level.id}
                onClick={() => updateField('coverageLevel', level.id)}
                className={`card text-left transition-all duration-200 ${
                  formData.coverageLevel === level.id
                    ? 'ring-2 ring-blue-500 shadow-md bg-blue-50'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="card-body">
                  {level.popular && (
                    <span className="badge-blue text-[10px] mb-2 inline-block">
                      Most Popular
                    </span>
                  )}
                  <h3 className="font-semibold text-slate-900">{level.name}</h3>
                  <p className="text-sm text-slate-500 mt-1 mb-4">{level.description}</p>
                  <ul className="space-y-2">
                    {level.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-600">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </button>
            ))}
          </div>

          {/* Add-ons */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 mb-4">
              Optional Add-ons
            </h2>
            <div className="card">
              <div className="card-body">
                <div className="space-y-3">
                  {addOns.map((addOn) => (
                    <label
                      key={addOn.id}
                      className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-colors ${
                        formData.addOns.includes(addOn.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.addOns.includes(addOn.id)}
                        onChange={() => toggleAddOn(addOn.id)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-900">{addOn.name}</p>
                        <p className="text-xs text-slate-500">{addOn.description}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-700">
                        +${addOn.price}/mo
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI Features */}
          <div className="card bg-gradient-to-r from-blue-600 to-cyan-600 text-white">
            <div className="card-body">
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-cyan-200" />
                <div>
                  <h3 className="font-semibold">AI-Powered Pricing</h3>
                  <p className="text-sm text-blue-100">
                    Our AI analyzes 50+ factors in real-time to give you the most accurate and
                    fair premium possible.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <button onClick={() => setStep(2)} className="btn-secondary">
              Back
            </button>
            <button
              onClick={calculateQuote}
              disabled={isCalculating}
              className="btn-primary btn-lg"
            >
              {isCalculating ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Calculating Your Quote...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Get My AI Quote
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Quote Result */}
      {step === 4 && quoteResult && (
        <div className="space-y-6 animate-slide-up">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Your Personalized Quote
            </h2>
            <p className="text-slate-600">
              Based on your information, here&apos;s the best rate our AI found for you.
            </p>
          </div>

          {/* Main Quote Card */}
          <div className="card bg-gradient-to-br from-blue-600 to-blue-700 text-white overflow-hidden">
            <div className="card-body p-8">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-4">
                  <Shield className="w-5 h-5 text-blue-200" />
                  <span className="text-blue-200 text-sm font-medium">
                    {insuranceTypes.find((t) => t.id === selectedType)?.name} •{' '}
                    {coverageLevels.find((l) => l.id === formData.coverageLevel)?.name} Plan
                  </span>
                </div>

                <div className="flex items-end gap-3 mb-6">
                  <span className="text-5xl font-bold">
                    ${quoteResult.monthlyPremium}
                  </span>
                  <span className="text-blue-200 text-lg mb-1">/month</span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-sm text-blue-200">Annual Premium</p>
                    <p className="text-xl font-bold">
                      ${quoteResult.annualPremium.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-sm text-blue-200">Your Savings</p>
                    <p className="text-xl font-bold text-emerald-300">
                      ${quoteResult.savings.toLocaleString()}/yr
                    </p>
                  </div>
                </div>

                {quoteResult.discounts.length > 0 && (
                  <div className="mb-6">
                    <p className="text-sm text-blue-200 mb-2">Applied Discounts</p>
                    <div className="flex flex-wrap gap-2">
                      {quoteResult.discounts.map((discount) => (
                        <span
                          key={discount.name}
                          className="inline-flex items-center gap-1 bg-white/15 rounded-full px-3 py-1 text-xs"
                        >
                          <Percent className="w-3 h-3" />
                          {discount.name} (−${discount.amount}/mo)
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/register"
                    className="btn bg-white text-blue-600 hover:bg-blue-50 flex-1"
                  >
                    Accept Quote & Get Covered
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <button
                    onClick={() => {
                      setStep(1);
                      setQuoteResult(null);
                      setSelectedType('');
                    }}
                    className="btn bg-white/15 text-white border-white/20 hover:bg-white/25"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* What's Included */}
          <div className="card">
            <div className="card-body">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                What&apos;s Included
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {coverageLevels
                  .find((l) => l.id === formData.coverageLevel)
                  ?.features.map((feature) => (
                    <div key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                      <span className="text-sm text-slate-700">{feature}</span>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Trust Signals */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card">
              <div className="card-body text-center">
                <Clock className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">Instant</p>
                <p className="text-xs text-slate-500">Coverage starts immediately</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">Guaranteed</p>
                <p className="text-xs text-slate-500">30-day money back</p>
              </div>
            </div>
            <div className="card">
              <div className="card-body text-center">
                <TrendingDown className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900">No Hidden Fees</p>
                <p className="text-xs text-slate-500">What you see is what you pay</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div className="card">
        <div className="card-body">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'How accurate is the AI quote?',
                a: 'Our AI analyzes over 50 data points to provide the most accurate pricing possible. The final rate may vary slightly based on underwriting review.',
              },
              {
                q: 'Can I change my coverage after purchasing?',
                a: 'Yes! You can update your coverage at any time through your dashboard. Changes take effect immediately and your premium adjusts pro-rata.',
              },
              {
                q: 'How quickly can I file a claim?',
                a: 'You can file claims 24/7 through our app or website. AI processing typically provides a decision within minutes for straightforward claims.',
              },
              {
                q: 'What discounts am I eligible for?',
                a: 'Our AI automatically applies all discounts you qualify for. Common discounts include safe driver, multi-policy, good credit, and paperless billing.',
              },
            ].map((faq, index) => (
              <FAQItem key={index} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-slate-200 rounded-lg">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full p-4 text-left"
      >
        <span className="text-sm font-medium text-slate-900">{question}</span>
        <ChevronDown
          className={`w-5 h-5 text-slate-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-600 leading-relaxed">{answer}</p>
        </div>
      )}
    </div>
  );
}
