import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

interface ActivationRequiredProps {
  user: any;
}

export function ActivationRequired({ user }: ActivationRequiredProps) {
  const [isResending, setIsResending] = useState(false);
  const resendEmail = useAction(api.emailActivation.resendActivationEmail);
  const needsActivation = useQuery(api.emailActivation.needsActivation);

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    try {
      await resendEmail({ email: user.email });
      toast.success('Activation email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend activation email');
    } finally {
      setIsResending(false);
    }
  };

  // If user doesn't need activation, don't show this component
  if (needsActivation === false) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Logo */}
          <div className="w-16 h-16 rounded-2xl mx-auto mb-6 overflow-hidden">
            <img 
              src="https://convex-cloud.s3.amazonaws.com/kg2ccwaff8zwk08gtth13ax0k57hc2ya" 
              alt="Eye Shots Logo" 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-envelope text-orange-600 text-2xl"></i>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Activation Required</h1>
          <p className="text-gray-600 mb-6">
            Welcome to Eye Shots! To complete your registration and access your premium platform experience, 
            please check your email and click the activation link we sent to:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="font-medium text-gray-900">{user?.email}</p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm mb-3">
              <i className="fas fa-info-circle mr-2"></i>
              Didn't receive the email?
            </p>
            <ul className="text-blue-700 text-xs space-y-1 text-left">
              <li>• Check your spam/junk folder</li>
              <li>• Make sure {user?.email} is correct</li>
              <li>• The email may take a few minutes to arrive</li>
            </ul>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleResendEmail}
              disabled={isResending}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white inline-block mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane mr-2"></i>
                  Resend Activation Email
                </>
              )}
            </button>

            <div className="text-center">
              <p className="text-xs text-gray-500">
                Need help? Contact support at{' '}
                <a href="mailto:support@eyeshots.co" className="text-purple-600 hover:underline">
                  support@eyeshots.co
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
