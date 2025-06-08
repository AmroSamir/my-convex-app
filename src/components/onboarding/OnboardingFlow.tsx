import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";

interface OnboardingFlowProps {
  user: any;
  onComplete?: () => void;
}

export function OnboardingFlow({ user, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  
  const onboardingStatus = useQuery(api.onboarding.getOnboardingStatus);
  const startOnboarding = useMutation(api.onboarding.startOnboarding);
  const updateOnboardingStep = useMutation(api.onboarding.updateOnboardingStep);

  useEffect(() => {
    if (onboardingStatus) {
      setCurrentStep(onboardingStatus.currentStep);
    } else if (user?.profile?.role === "client") {
      // Start onboarding for new clients
      startOnboarding();
    }
  }, [onboardingStatus, user, startOnboarding]);

  const handleStepComplete = async (stepData: any) => {
    try {
      const dataToSave = JSON.stringify(stepData);
      await updateOnboardingStep({
        step: currentStep + 1,
        data: dataToSave,
      });
      
      if (currentStep < 6) {
        setCurrentStep(currentStep + 1);
        setFormData({ ...formData, ...stepData });
      } else {
        // Onboarding complete
        toast.success("Onboarding completed! Your personalized recommendations are ready.");
        onComplete?.();
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save progress");
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome onNext={handleStepComplete} />;
      case 2:
        return <Step2BusinessProfile onNext={handleStepComplete} onBack={() => setCurrentStep(1)} />;
      case 3:
        return <Step3MarketingState onNext={handleStepComplete} onBack={() => setCurrentStep(2)} />;
      case 4:
        return <Step4Goals onNext={handleStepComplete} onBack={() => setCurrentStep(3)} />;
      case 5:
        return <Step5ServicePreferences onNext={handleStepComplete} onBack={() => setCurrentStep(4)} />;
      case 6:
        return <Step6FinalSetup onNext={handleStepComplete} onBack={() => setCurrentStep(5)} />;
      default:
        return <Step1Welcome onNext={handleStepComplete} />;
    }
  };

  if (!user?.profile || user.profile.role !== "client") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of 6</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / 6) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}

// Step 1: Welcome & Account Setup
function Step1Welcome({ onNext }: { onNext: (data: any) => void }) {
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [address, setAddress] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast.error("Please enter your company name");
      return;
    }
    
    onNext({
      companyName: companyName.trim(),
      contactInfo: { phone, website, address }
    });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-rocket text-white text-2xl"></i>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome! Let's Build Your Custom Marketing Strategy
        </h1>
        <p className="text-gray-600 text-lg">
          This quick 5-minute setup will help us recommend the perfect services for your business.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Company Name *
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your company name"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="(555) 123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://yourwebsite.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Business Address
          </label>
          <textarea
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Enter your business address"
            rows={3}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
        >
          Get Started
        </button>
      </form>
    </div>
  );
}

// Step 2: Enhanced Business Profile
function Step2BusinessProfile({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [businessType, setBusinessType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [otherBusinessType, setOtherBusinessType] = useState("");

  const businessTypes = [
    {
      id: "small_business",
      title: "Small Business",
      description: "Local services, retail, restaurants",
      icon: "fa-store",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      id: "ecommerce",
      title: "eCommerce Store",
      description: "Online retail, marketplace sellers",
      icon: "fa-shopping-cart",
      gradient: "from-green-500 to-green-600"
    },
    {
      id: "saas",
      title: "SaaS/Software Company",
      description: "B2B software, tech platforms",
      icon: "fa-laptop-code",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      id: "mobile_app",
      title: "Mobile App",
      description: "iOS/Android applications, games",
      icon: "fa-mobile-alt",
      gradient: "from-pink-500 to-pink-600"
    },
    {
      id: "fintech",
      title: "Fintech",
      description: "Financial services, banking, payments",
      icon: "fa-credit-card",
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      id: "startup",
      title: "Startup",
      description: "Early-stage, seeking growth",
      icon: "fa-rocket",
      gradient: "from-red-500 to-red-600"
    },
    {
      id: "other",
      title: "Other",
      description: "Tell us about your unique business",
      icon: "fa-ellipsis-h",
      gradient: "from-gray-500 to-gray-600"
    }
  ];

  const companySizes = [
    {
      id: "solo",
      title: "Solo entrepreneur",
      description: "Just me",
      icon: "fa-user"
    },
    {
      id: "small_team",
      title: "Small team",
      description: "2-10 people",
      icon: "fa-users"
    },
    {
      id: "growing",
      title: "Growing business",
      description: "11-50 people",
      icon: "fa-chart-line"
    },
    {
      id: "established",
      title: "Established company",
      description: "51-200 people",
      icon: "fa-building"
    },
    {
      id: "enterprise",
      title: "Large enterprise",
      description: "200+ people",
      icon: "fa-city"
    }
  ];

  const businessAges = [
    {
      id: "just_starting",
      title: "Just starting",
      description: "0-6 months",
      icon: "fa-seedling"
    },
    {
      id: "early_stage",
      title: "Early stage",
      description: "6 months - 2 years",
      icon: "fa-leaf"
    },
    {
      id: "established",
      title: "Established",
      description: "2-5 years",
      icon: "fa-tree"
    },
    {
      id: "mature",
      title: "Mature business",
      description: "5+ years",
      icon: "fa-mountain"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessType || !companySize || !yearsInBusiness) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (businessType === "other" && !otherBusinessType.trim()) {
      toast.error("Please describe your business type");
      return;
    }
    
    onNext({ 
      businessType, 
      companySize, 
      yearsInBusiness,
      otherBusinessType: businessType === "other" ? otherBusinessType : null
    });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-building text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Tell Us About Your Business</h2>
        <p className="text-gray-600">Help us understand your business so we can create the perfect strategy</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Business Type Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            What best describes your business? *
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {businessTypes.map((type) => (
              <div key={type.id}>
                <input
                  type="radio"
                  id={type.id}
                  name="businessType"
                  value={type.id}
                  checked={businessType === type.id}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="sr-only"
                />
                <label
                  htmlFor={type.id}
                  className={`block p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md ${
                    businessType === type.id
                      ? 'border-purple-500 bg-purple-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`w-10 h-10 bg-gradient-to-r ${type.gradient} rounded-lg flex items-center justify-center flex-shrink-0`}>
                      <i className={`fas ${type.icon} text-white text-sm`}></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-gray-900">{type.title}</h3>
                      <p className="text-xs text-gray-600 mt-1">{type.description}</p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>

          {/* Other business type input */}
          {businessType === "other" && (
            <div className="mt-4">
              <input
                type="text"
                value={otherBusinessType}
                onChange={(e) => setOtherBusinessType(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Please describe your business type"
                required
              />
            </div>
          )}
        </div>

        {/* Company Size Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            How many employees do you have? *
          </label>
          <div className="space-y-3">
            {companySizes.map((size) => (
              <div key={size.id}>
                <input
                  type="radio"
                  id={size.id}
                  name="companySize"
                  value={size.id}
                  checked={companySize === size.id}
                  onChange={(e) => setCompanySize(e.target.value)}
                  className="sr-only"
                />
                <label
                  htmlFor={size.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    companySize === size.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className={`fas ${size.icon} text-gray-600 text-sm`}></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{size.title}</h3>
                      <p className="text-xs text-gray-600">{size.description}</p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Years in Business Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">
            How long have you been in business? *
          </label>
          <div className="space-y-3">
            {businessAges.map((age) => (
              <div key={age.id}>
                <input
                  type="radio"
                  id={age.id}
                  name="yearsInBusiness"
                  value={age.id}
                  checked={yearsInBusiness === age.id}
                  onChange={(e) => setYearsInBusiness(e.target.value)}
                  className="sr-only"
                />
                <label
                  htmlFor={age.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all duration-200 ${
                    yearsInBusiness === age.id
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <i className={`fas ${age.icon} text-gray-600 text-sm`}></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900">{age.title}</h3>
                      <p className="text-xs text-gray-600">{age.description}</p>
                    </div>
                  </div>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 3: Current Marketing State
function Step3MarketingState({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [currentActivities, setCurrentActivities] = useState<string[]>([]);
  const [marketingTeam, setMarketingTeam] = useState("");
  const [monthlyBudget, setMonthlyBudget] = useState("");
  const [otherActivity, setOtherActivity] = useState("");

  const marketingActivities = [
    "Social media posting",
    "Email marketing", 
    "Google/Facebook ads",
    "SEO optimization",
    "Content creation (blogs, videos)",
    "Influencer partnerships",
    "None of the above",
    "Other"
  ];

  const teamOptions = [
    { id: "no_team", title: "No marketing team", description: "No dedicated marketing resources", icon: "fa-user-slash" },
    { id: "part_time", title: "Part-time marketing person", description: "Someone who handles marketing part-time", icon: "fa-user-clock" },
    { id: "dedicated_manager", title: "Dedicated marketing manager", description: "Full-time marketing professional", icon: "fa-user-tie" },
    { id: "full_team", title: "Full marketing team", description: "Multiple marketing specialists", icon: "fa-users" },
    { id: "handle_myself", title: "I handle marketing myself", description: "Owner/founder manages marketing", icon: "fa-user" }
  ];

  const budgetRanges = [
    "Under $1,000",
    "$1,000 - $5,000", 
    "$5,000 - $10,000",
    "$10,000 - $25,000",
    "$25,000+",
    "Need help determining budget"
  ];

  const toggleActivity = (activity: string) => {
    setCurrentActivities(prev => 
      prev.includes(activity) 
        ? prev.filter(a => a !== activity)
        : [...prev, activity]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentActivities.length === 0 || !marketingTeam || !monthlyBudget) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (currentActivities.includes("Other") && !otherActivity.trim()) {
      toast.error("Please describe your other marketing activity");
      return;
    }
    
    onNext({ 
      currentActivities, 
      marketingTeam, 
      monthlyBudget,
      otherActivity: currentActivities.includes("Other") ? otherActivity : null
    });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-chart-line text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Current Marketing State</h2>
        <p className="text-gray-600">Tell us about your existing marketing efforts and capabilities</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Which marketing activities are you currently doing? * (Select all that apply)
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {marketingActivities.map(activity => (
              <label key={activity} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentActivities.includes(activity)}
                  onChange={() => toggleActivity(activity)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{activity}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Marketing Budget *
          </label>
          <select
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select budget range</option>
            {budgetRanges.map(budget => (
              <option key={budget} value={budget}>{budget}</option>
            ))}
          </select>
        </div>





        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 4: Goals & Objectives
function Step4Goals({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [primaryGoals, setPrimaryGoals] = useState<string[]>([]);
  const [targetAudience, setTargetAudience] = useState("");
  const [timeline, setTimeline] = useState("");
  const [successMetrics, setSuccessMetrics] = useState<string[]>([]);

  const goals = [
    "Increase online visibility", "Generate more leads", "Boost brand awareness",
    "Improve customer retention", "Drive website traffic", "Increase sales",
    "Build thought leadership", "Expand market reach"
  ];

  const timelines = [
    "Immediate (1-3 months)", "Short-term (3-6 months)", 
    "Medium-term (6-12 months)", "Long-term (12+ months)"
  ];

  const metrics = [
    "Website traffic", "Lead generation", "Sales revenue", "Brand awareness",
    "Social media engagement", "Email subscribers", "Customer acquisition cost",
    "Return on investment (ROI)"
  ];

  const toggleGoal = (goal: string) => {
    setPrimaryGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const toggleMetric = (metric: string) => {
    setSuccessMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (primaryGoals.length === 0 || !targetAudience || !timeline) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    onNext({ primaryGoals, targetAudience, timeline, successMetrics });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-orange-600 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-target text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Goals & Objectives</h2>
        <p className="text-gray-600">What do you want to achieve with your marketing?</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Primary Marketing Goals * (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {goals.map(goal => (
              <label key={goal} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={primaryGoals.includes(goal)}
                  onChange={() => toggleGoal(goal)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{goal}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Target Audience Description *
          </label>
          <textarea
            value={targetAudience}
            onChange={(e) => setTargetAudience(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Describe your ideal customers (age, interests, location, etc.)"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Timeline for Results *
          </label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select timeline</option>
            {timelines.map(time => (
              <option key={time} value={time}>{time}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Success Metrics (Select all that apply)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {metrics.map(metric => (
              <label key={metric} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={successMetrics.includes(metric)}
                  onChange={() => toggleMetric(metric)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{metric}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 5: Service Preferences
function Step5ServicePreferences({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [interestedServices, setInterestedServices] = useState<string[]>([]);
  const [communicationPreference, setCommunicationPreference] = useState("");
  const [meetingFrequency, setMeetingFrequency] = useState("");
  const [reportingPreference, setReportingPreference] = useState("");

  const services = [
    "Search Engine Optimization (SEO)", "Pay-Per-Click Advertising (PPC)",
    "Social Media Marketing", "Content Marketing", "Email Marketing",
    "Website Design/Development", "Brand Strategy", "Analytics & Reporting"
  ];

  const communicationOptions = [
    "Email", "Phone calls", "Video meetings", "In-person meetings", "Project management tools"
  ];

  const meetingOptions = [
    "Weekly", "Bi-weekly", "Monthly", "Quarterly", "As needed"
  ];

  const reportingOptions = [
    "Weekly reports", "Monthly reports", "Quarterly reports", "Real-time dashboard", "Custom schedule"
  ];

  const toggleService = (service: string) => {
    setInterestedServices(prev => 
      prev.includes(service) 
        ? prev.filter(s => s !== service)
        : [...prev, service]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!communicationPreference || !meetingFrequency || !reportingPreference) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    onNext({ interestedServices, communicationPreference, meetingFrequency, reportingPreference });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-cogs text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Preferences</h2>
        <p className="text-gray-600">Let us know how you prefer to work with us</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Interested Services (Select all that apply)
          </label>
          <div className="grid grid-cols-1 gap-3">
            {services.map(service => (
              <label key={service} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={interestedServices.includes(service)}
                  onChange={() => toggleService(service)}
                  className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-sm text-gray-700">{service}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Communication Method *
          </label>
          <select
            value={communicationPreference}
            onChange={(e) => setCommunicationPreference(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select communication preference</option>
            {communicationOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Meeting Frequency *
          </label>
          <select
            value={meetingFrequency}
            onChange={(e) => setMeetingFrequency(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select meeting frequency</option>
            {meetingOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reporting Preference *
          </label>
          <select
            value={reportingPreference}
            onChange={(e) => setReportingPreference(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            required
          >
            <option value="">Select reporting preference</option>
            {reportingOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

// Step 6: Final Setup
function Step6FinalSetup({ onNext, onBack }: { onNext: (data: any) => void; onBack: () => void }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [preferredStartDate, setPreferredStartDate] = useState("");
  const [additionalNotes, setAdditionalNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast.error("Please agree to the terms and conditions");
      return;
    }
    
    onNext({ agreedToTerms, marketingConsent, preferredStartDate, additionalNotes });
  };

  return (
    <div>
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <i className="fas fa-check text-white text-2xl"></i>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Final Setup</h2>
        <p className="text-gray-600">Just a few more details to complete your onboarding</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preferred Start Date
          </label>
          <input
            type="date"
            value={preferredStartDate}
            onChange={(e) => setPreferredStartDate(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes or Questions
          </label>
          <textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Any additional information you'd like us to know..."
            rows={4}
          />
        </div>

        <div className="space-y-4">
          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              required
            />
            <span className="text-sm text-gray-700">
              I agree to the <a href="#" className="text-purple-600 hover:underline">Terms and Conditions</a> and 
              <a href="#" className="text-purple-600 hover:underline ml-1">Privacy Policy</a> *
            </span>
          </label>

          <label className="flex items-start space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={marketingConsent}
              onChange={(e) => setMarketingConsent(e.target.checked)}
              className="mt-1 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-700">
              I consent to receive marketing communications and updates about services
            </span>
          </label>
        </div>

        <div className="flex space-x-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-200"
          >
            Complete Onboarding
          </button>
        </div>
      </form>
    </div>
  );
}
