import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface RecommendationsDashboardProps {
  user: any;
}

export function RecommendationsDashboard({ user }: RecommendationsDashboardProps) {
  const recommendations = useQuery(api.onboarding.getRecommendations);

  if (!recommendations) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your personalized recommendations...</p>
        </div>
      </div>
    );
  }

  const { recommendations: services, customStrategy } = recommendations;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 rounded-2xl p-8 text-white mb-8">
          <h1 className="text-3xl font-bold mb-4">
            Your Personalized Marketing Strategy
          </h1>
          <p className="text-lg opacity-90">
            Based on your business profile and goals, here are our tailored recommendations
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Strategy Overview */}
          <div className="lg:col-span-2 space-y-6">
            {/* Custom Strategy */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
                Strategic Overview
              </h2>
              <p className="text-gray-700 mb-6">{customStrategy.overview}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Key Recommendations</h3>
                  <ul className="space-y-2">
                    {customStrategy.keyRecommendations.map((rec: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <i className="fas fa-check-circle text-green-500 mt-1"></i>
                        <span className="text-gray-700 text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Expected Outcomes</h3>
                  <ul className="space-y-2">
                    {customStrategy.expectedOutcomes.map((outcome: string, index: number) => (
                      <li key={index} className="flex items-start space-x-2">
                        <i className="fas fa-arrow-up text-blue-500 mt-1"></i>
                        <span className="text-gray-700 text-sm">{outcome}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Recommended Services */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                <i className="fas fa-star text-purple-500 mr-2"></i>
                Recommended Services
              </h2>
              
              <div className="space-y-4">
                {services.map((service: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${
                          service.priority === 'high' ? 'bg-red-500' :
                          service.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`}></div>
                        <h3 className="font-semibold text-gray-900">{service.serviceName}</h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          service.priority === 'high' ? 'bg-red-100 text-red-800' :
                          service.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {service.priority} priority
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm mb-3">{service.reasoning}</p>
                    
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>
                        <i className="fas fa-dollar-sign mr-1"></i>
                        {service.estimatedCost}
                      </span>
                      <span>
                        <i className="fas fa-clock mr-1"></i>
                        {service.timeline}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Next Steps Sidebar */}
          <div className="space-y-6">
            {/* Next Steps */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-route text-blue-500 mr-2"></i>
                Next Steps
              </h3>
              <div className="space-y-3">
                {customStrategy.nextSteps.map((step: string, index: number) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </div>
                    <span className="text-gray-700 text-sm">{step}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-handshake text-purple-500 mr-2"></i>
                Ready to Get Started?
              </h3>
              <p className="text-gray-700 text-sm mb-4">
                Our team is ready to help you implement this strategy and achieve your marketing goals.
              </p>
              <div className="space-y-3">
                <button className="w-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white py-3 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-200">
                  Schedule Strategy Call
                </button>
                <button className="w-full bg-white text-purple-600 py-3 px-4 rounded-lg font-semibold border border-purple-200 hover:bg-purple-50 transition-colors">
                  Download Strategy PDF
                </button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <i className="fas fa-chart-bar text-green-500 mr-2"></i>
                Your Profile
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Services Recommended:</span>
                  <span className="font-semibold">{services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">High Priority:</span>
                  <span className="font-semibold text-red-600">
                    {services.filter((s: any) => s.priority === 'high').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Strategy Generated:</span>
                  <span className="font-semibold text-green-600">
                    {new Date(recommendations.generatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
