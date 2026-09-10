import React from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Car,
  Home,
  Heart,
  Building,
  ChevronDown,
  ChevronRight,
  Check,
  AlertTriangle,
  Info,
  Bot,
  Zap,
  DollarSign,
  FileText,
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle,
} from "lucide-react";

interface QuoteFormData {
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    ssn?: string;
  };
  insuranceInfo: {
    type: "auto" | "home" | "health" | "life" | "business";
    coverageLevel: "basic" | "standard" | "premium" | "custom";
    deductible: number;
    coverageAmount: number;
    startDate: string;
    existingPolicies: boolean;
    claimsHistory: number;
    additionalDrivers?: number;
    vehicleInfo?: {
      make: string;
      model: string;
      year: number;
      vin: string;
    };
    propertyInfo?: {
      type: string;
      yearBuilt: number;
      squareFootage: number;
      constructionType: string;
    };
  };
  preferences: {
    budget: number;
    prioritize: "price" | "coverage" | "service";
    digitalDocuments: boolean;
    paperlessBilling: boolean;
  };
}

interface QuoteFormProps {
  onSubmit?: (data: QuoteFormData) => void;
  onStepChange?: (step: number) => void;
  initialData?: Partial<QuoteFormData>;
  isSubmitting?: boolean;
  aiSuggestions?: boolean;
  className?: string;
}

const STEPS = [
  { id: 1, label: "Personal Info", icon: User },
  { id: 2, label: "Insurance Details", icon: Shield },
  { id: 3, label: "Preferences", icon: Zap },
];

const INSURANCE_TYPES = [
  { id: "auto" as const, label: "Auto", icon: Car, description: "Vehicle coverage" },
  { id: "home" as const, label: "Home", icon: Home, description: "Property protection" },
  { id: "health" as const, label: "Health", icon: Heart, description: "Medical coverage" },
  { id: "life" as const, label: "Life", icon: Shield, description: "Life insurance" },
  { id: "business" as const, label: "Business", icon: Building, description: "Commercial" },
];

const COVERAGE_LEVELS = [
  {
    id: "basic" as const,
    label: "Basic",
    description: "Essential coverage at lowest cost",
    multiplier: 1,
  },
  {
    id: "standard" as const,
    label: "Standard",
    description: "Balanced coverage and price",
    multiplier: 1.5,
  },
  {
    id: "premium" as const,
    label: "Premium",
    description: "Maximum protection",
    multiplier: 2,
  },
  {
    id: "custom" as const,
    label: "Custom",
    description: "Build your own plan",
    multiplier: 1.75,
  },
];

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

const QuoteForm: React.FC<QuoteFormProps> = ({
  onSubmit,
  onStepChange,
  initialData,
  isSubmitting = false,
  aiSuggestions = true,
  className = "",
}) => {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [formData, setFormData] = React.useState<QuoteFormData>({
    personalInfo: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      ...initialData?.personalInfo,
    },
    insuranceInfo: {
      type: "auto",
      coverageLevel: "standard",
      deductible: 500,
      coverageAmount: 100000,
      startDate: "",
      existingPolicies: false,
      claimsHistory: 0,
      ...initialData?.insuranceInfo,
    },
    preferences: {
      budget: 200,
      prioritize: "coverage",
      digitalDocuments: true,
      paperlessBilling: true,
      ...initialData?.preferences,
    },
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const updatePersonalInfo = (
    field: keyof QuoteFormData["personalInfo"],
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
    if (errors[`personalInfo.${field}`]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[`personalInfo.${field}`];
        return next;
      });
    }
  };

  const updateInsuranceInfo = (
    field: keyof QuoteFormData["insuranceInfo"],
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      insuranceInfo: { ...prev.insuranceInfo, [field]: value },
    }));
  };

  const updatePreferences = (
    field: keyof QuoteFormData["preferences"],
    value: unknown
  ) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      if (!formData.personalInfo.firstName.trim())
        newErrors["personalInfo.firstName"] = "First name is required";
      if (!formData.personalInfo.lastName.trim())
        newErrors["personalInfo.lastName"] = "Last name is required";
      if (!formData.personalInfo.email.trim())
        newErrors["personalInfo.email"] = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.personalInfo.email))
        newErrors["personalInfo.email"] = "Invalid email format";
      if (!formData.personalInfo.phone.trim())
        newErrors["personalInfo.phone"] = "Phone is required";
      if (!formData.personalInfo.dateOfBirth)
        newErrors["personalInfo.dateOfBirth"] = "Date of birth is required";
      if (!formData.personalInfo.address.trim())
        newErrors["personalInfo.address"] = "Address is required";
      if (!formData.personalInfo.city.trim())
        newErrors["personalInfo.city"] = "City is required";
      if (!formData.personalInfo.state)
        newErrors["personalInfo.state"] = "State is required";
      if (!formData.personalInfo.zipCode.trim())
        newErrors["personalInfo.zipCode"] = "ZIP code is required";
    }

    if (step === 2) {
      if (!formData.insuranceInfo.startDate)
        newErrors["insuranceInfo.startDate"] = "Start date is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const next = Math.min(currentStep + 1, STEPS.length);
      setCurrentStep(next);
      onStepChange?.(next);
    }
  };

  const handlePrev = () => {
    const prev = Math.max(currentStep - 1, 1);
    setCurrentStep(prev);
    onStepChange?.(prev);
  };

  const handleSubmit = () => {
    if (validateStep(currentStep)) {
      onSubmit?.(formData);
    }
  };

  const renderInput = (
    label: string,
    field: string,
    value: string,
    onChange: (val: string) => void,
    options?: {
      type?: string;
      placeholder?: string;
      required?: boolean;
      half?: boolean;
    }
  ) => {
    const hasError = errors[field] && touched[field];
    return (
      <div className={options?.half ? "flex-1" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label}
          {options?.required && (
            <span className="text-red-500 ml-0.5">*</span>
          )}
        </label>
        <input
          type={options?.type || "text"}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTouched((prev) => ({ ...prev, [field]: true }));
          }}
          onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
          placeholder={options?.placeholder}
          className={`w-full px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors ${
            hasError
              ? "border-red-300 focus:ring-red-500"
              : "border-gray-200"
          }`}
        />
        {hasError && (
          <p className="mt-1 text-xs text-red-600">{errors[field]}</p>
        )}
      </div>
    );
  };

  const renderPersonalInfoStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <User className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Personal Information
          </h3>
          <p className="text-xs text-gray-500">
            Tell us about yourself to get accurate quotes
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        {renderInput(
          "First Name",
          "personalInfo.firstName",
          formData.personalInfo.firstName,
          (val) => updatePersonalInfo("firstName", val),
          { required: true, half: true }
        )}
        {renderInput(
          "Last Name",
          "personalInfo.lastName",
          formData.personalInfo.lastName,
          (val) => updatePersonalInfo("lastName", val),
          { required: true, half: true }
        )}
      </div>

      <div className="flex gap-4">
        {renderInput(
          "Email",
          "personalInfo.email",
          formData.personalInfo.email,
          (val) => updatePersonalInfo("email", val),
          { type: "email", required: true, half: true }
        )}
        {renderInput(
          "Phone",
          "personalInfo.phone",
          formData.personalInfo.phone,
          (val) => updatePersonalInfo("phone", val),
          { type: "tel", placeholder: "(555) 123-4567", required: true, half: true }
        )}
      </div>

      {renderInput(
        "Date of Birth",
        "personalInfo.dateOfBirth",
        formData.personalInfo.dateOfBirth,
        (val) => updatePersonalInfo("dateOfBirth", val),
        { type: "date", required: true }
      )}

      {renderInput(
        "Street Address",
        "personalInfo.address",
        formData.personalInfo.address,
        (val) => updatePersonalInfo("address", val),
        { placeholder: "123 Main Street", required: true }
      )}

      <div className="flex gap-4">
        {renderInput(
          "City",
          "personalInfo.city",
          formData.personalInfo.city,
          (val) => updatePersonalInfo("city", val),
          { required: true, half: true }
        )}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            State <span className="text-red-500 ml-0.5">*</span>
          </label>
          <div className="relative">
            <select
              value={formData.personalInfo.state}
              onChange={(e) => {
                updatePersonalInfo("state", e.target.value);
                setTouched((p) => ({ ...p, "personalInfo.state": true }));
              }}
              className={`w-full appearance-none px-3 py-2.5 bg-white border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors["personalInfo.state"] && touched["personalInfo.state"]
                  ? "border-red-300"
                  : "border-gray-200"
              }`}
            >
              <option value="">Select State</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
        {renderInput(
          "ZIP Code",
          "personalInfo.zipCode",
          formData.personalInfo.zipCode,
          (val) => updatePersonalInfo("zipCode", val),
          { required: true, half: true }
        )}
      </div>
    </div>
  );

  const renderInsuranceInfoStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <Shield className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Insurance Details
          </h3>
          <p className="text-xs text-gray-500">
            Select your coverage type and options
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Insurance Type <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {INSURANCE_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => updateInsuranceInfo("type", type.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.insuranceInfo.type === type.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    formData.insuranceInfo.type === type.id
                      ? "text-indigo-600"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-semibold ${
                    formData.insuranceInfo.type === type.id
                      ? "text-indigo-700"
                      : "text-gray-700"
                  }`}
                >
                  {type.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{type.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Coverage Level <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {COVERAGE_LEVELS.map((level) => (
            <button
              key={level.id}
              onClick={() => updateInsuranceInfo("coverageLevel", level.id)}
              className={`p-4 rounded-xl border-2 text-left transition-all ${
                formData.insuranceInfo.coverageLevel === level.id
                  ? "border-indigo-500 bg-indigo-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <p
                className={`text-sm font-bold ${
                  formData.insuranceInfo.coverageLevel === level.id
                    ? "text-indigo-700"
                    : "text-gray-900"
                }`}
              >
                {level.label}
              </p>
              <p className="text-xs text-gray-500 mt-1">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Deductible
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={formData.insuranceInfo.deductible}
              onChange={(e) =>
                updateInsuranceInfo("deductible", Number(e.target.value))
              }
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Coverage Amount
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={formData.insuranceInfo.coverageAmount}
              onChange={(e) =>
                updateInsuranceInfo("coverageAmount", Number(e.target.value))
              }
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {renderInput(
        "Coverage Start Date",
        "insuranceInfo.startDate",
        formData.insuranceInfo.startDate,
        (val) => updateInsuranceInfo("startDate", val),
        { type: "date", required: true }
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.insuranceInfo.existingPolicies}
            onChange={(e) =>
              updateInsuranceInfo("existingPolicies", e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-gray-700">
            I have existing insurance policies
          </span>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Claims in Last 5 Years
        </label>
        <select
          value={formData.insuranceInfo.claimsHistory}
          onChange={(e) =>
            updateInsuranceInfo("claimsHistory", Number(e.target.value))
          }
          className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value={0}>None</option>
          <option value={1}>1 claim</option>
          <option value={2}>2 claims</option>
          <option value={3}>3+ claims</option>
        </select>
      </div>
    </div>
  );

  const renderPreferencesStep = () => (
    <div className="space-y-5">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-50 rounded-xl">
          <Zap className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">
            Your Preferences
          </h3>
          <p className="text-xs text-gray-500">
            Customize your quote to match your needs
          </p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Monthly Budget: {formatCurrency(formData.preferences.budget)}
        </label>
        <input
          type="range"
          min="50"
          max="1000"
          step="10"
          value={formData.preferences.budget}
          onChange={(e) =>
            updatePreferences("budget", Number(e.target.value))
          }
          className="w-full accent-indigo-600"
        />
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>$50</span>
          <span>$500</span>
          <span>$1000</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          What matters most to you?
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(
            [
              { id: "price", label: "Best Price", icon: DollarSign },
              { id: "coverage", label: "Best Coverage", icon: Shield },
              { id: "service", label: "Best Service", icon: Heart },
            ] as const
          ).map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => updatePreferences("prioritize", option.id)}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  formData.preferences.prioritize === option.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Icon
                  className={`w-6 h-6 mx-auto mb-2 ${
                    formData.preferences.prioritize === option.id
                      ? "text-indigo-600"
                      : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-sm font-semibold ${
                    formData.preferences.prioritize === option.id
                      ? "text-indigo-700"
                      : "text-gray-700"
                  }`}
                >
                  {option.label}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={formData.preferences.digitalDocuments}
            onChange={(e) =>
              updatePreferences("digitalDocuments", e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Digital Documents
            </p>
            <p className="text-xs text-gray-500">
              Receive all documents digitally
            </p>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
          <input
            type="checkbox"
            checked={formData.preferences.paperlessBilling}
            onChange={(e) =>
              updatePreferences("paperlessBilling", e.target.checked)
            }
            className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div>
            <p className="text-sm font-medium text-gray-700">
              Paperless Billing
            </p>
            <p className="text-xs text-gray-500">
              Go green with electronic billing
            </p>
          </div>
        </label>
      </div>

      {aiSuggestions && (
        <div className="p-4 bg-violet-50 border border-violet-200 rounded-xl">
          <div className="flex items-start gap-3">
            <Bot className="w-5 h-5 text-violet-600 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-violet-900 mb-1">
                AI Suggestion
              </p>
              <p className="text-xs text-gray-600">
                Based on your profile, we recommend the{" "}
                <span className="font-semibold">Standard</span> coverage level
                with a {formatCurrency(500)} deductible. This provides
                excellent protection while keeping premiums affordable.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className={`bg-white rounded-2xl border border-gray-200 overflow-hidden ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            Get Your Quote
          </h2>
          <span className="text-sm text-gray-500">
            Step {currentStep} of {STEPS.length}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;

            return (
              <React.Fragment key={step.id}>
                <div
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-50 text-indigo-700"
                      : isCompleted
                      ? "bg-emerald-50 text-emerald-700"
                      : "text-gray-400"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium hidden sm:inline">
                    {step.label}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      currentStep > step.id ? "bg-emerald-300" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div className="p-6 min-h-[400px]">
        {currentStep === 1 && renderPersonalInfoStep()}
        {currentStep === 2 && renderInsuranceInfoStep()}
        {currentStep === 3 && renderPreferencesStep()}
      </div>

      <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
        <button
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-500 to-indigo-500 text-white rounded-xl text-sm font-bold hover:from-violet-600 hover:to-indigo-600 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating Quotes...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Get Quotes
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuoteForm;
