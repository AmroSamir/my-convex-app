import { useState, useEffect } from "react";
import { useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { toast } from "sonner";

export function ActivationPage() {
  const [token, setToken] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [activationStatus, setActivationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [errorMessage, setErrorMessage] = useState<string>('');
  
  const verifyToken = useMutation(api.emailActivation.verifyActivationToken);
  const resendEmail = useAction(api.emailActivation.resendActivationEmail);

  useEffect(() => {
    // Get token from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const tokenParam = urlParams.get('token');
    
    if (tokenParam) {
      setToken(tokenParam);
      handleActivation(tokenParam);
    }
  }, []);

  const handleActivation = async (activationToken: string) => {
    setIsActivating(true);
    try {
      const result = await verifyToken({ token: activationToken });
      if (result.success) {
        setActivationStatus('success');
        toast.success('Account activated successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (error: any) {
      setActivationStatus('error');
      setErrorMessage(error.message || 'Failed to activate account');
      toast.error(error.message || 'Failed to activate account');
    } finally {
      setIsActivating(false);
    }
  };

  const handleResendEmail = async () => {
    if (!token) return;
    
    try {
      // Extract email from token or ask user to provide it
      const email = prompt('Please enter your email address to resend the activation email:');
      if (!email) return;
      
      await resendEmail({ email });
      toast.success('Activation email sent! Please check your inbox.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to resend activation email');
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-exclamation-triangle text-red-600 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invalid Activation Link</h1>
            <p className="text-gray-600 mb-6">
              The activation link is invalid or missing. Please check your email for the correct link.
            </p>
            <a
              href="/"
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
            >
              <i className="fas fa-home mr-2"></i>
              Go to Homepage
            </a>
          </div>
        </div>
      </div>
    );
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

          {activationStatus === 'pending' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {isActivating ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                ) : (
                  <i className="fas fa-envelope-open text-blue-600 text-2xl"></i>
                )}
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isActivating ? 'Activating Account...' : 'Activating Your Account'}
              </h1>
              <p className="text-gray-600">
                {isActivating ? 'Please wait while we activate your account.' : 'Processing your activation request...'}
              </p>
            </>
          )}

          {activationStatus === 'success' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-check-circle text-green-600 text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Account Activated!</h1>
              <p className="text-gray-600 mb-6">
                Your Eye Shots account has been successfully activated. You will be redirected to the login page shortly.
              </p>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-800 text-sm">
                  <i className="fas fa-info-circle mr-2"></i>
                  Redirecting in 3 seconds...
                </p>
              </div>
              <a
                href="/"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
              >
                <i className="fas fa-sign-in-alt mr-2"></i>
                Go to Login
              </a>
            </>
          )}

          {activationStatus === 'error' && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-times-circle text-red-600 text-2xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Activation Failed</h1>
              <p className="text-gray-600 mb-4">
                {errorMessage}
              </p>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <p className="text-red-800 text-sm mb-3">
                  <i className="fas fa-exclamation-triangle mr-2"></i>
                  Common reasons for activation failure:
                </p>
                <ul className="text-red-700 text-xs space-y-1 text-left">
                  <li>• The activation link has expired (24 hours)</li>
                  <li>• The link has already been used</li>
                  <li>• The link is invalid or corrupted</li>
                </ul>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleResendEmail}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 text-white font-semibold rounded-lg hover:shadow-lg transition-all duration-200"
                >
                  <i className="fas fa-paper-plane mr-2"></i>
                  Resend Activation Email
                </button>
                
                <a
                  href="/"
                  className="inline-flex items-center justify-center w-full px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
                >
                  <i className="fas fa-home mr-2"></i>
                  Go to Homepage
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
