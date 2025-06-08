import { Authenticated, Unauthenticated } from "convex/react";
import { SignInForm } from "./SignInForm";
import { Dashboard } from "./components/Dashboard";
import { ActivationPage } from "./components/ActivationPage";
import { ActivationRequired } from "./components/ActivationRequired";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Toaster } from "sonner";
import { useEffect } from "react";

function App() {
  const user = useQuery(api.users.getCurrentUser);
  const createClientProfile = useMutation(api.users.createClientProfile);
  const needsActivation = useQuery(api.emailActivation.needsActivation);

  // Check if this is an activation page
  const urlParams = new URLSearchParams(window.location.search);
  const hasToken = urlParams.has('token');
  const isActivationPage = window.location.pathname === '/activate' || hasToken;

  // Auto-create client profile for new users
  useEffect(() => {
    if (user && !user.profile) {
      createClientProfile().catch(console.error);
    }
  }, [user, createClientProfile]);

  // Handle activation page
  if (isActivationPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toaster position="top-right" />
        <ActivationPage />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      <Authenticated>
        {user === undefined || needsActivation === undefined ? (
          // Loading state
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <div className="text-gray-500">Loading...</div>
            </div>
          </div>
        ) : needsActivation ? (
          // Show activation required screen
          <ActivationRequired user={user} />
        ) : (
          // Show dashboard for activated users
          <Dashboard />
        )}
      </Authenticated>

      <Unauthenticated>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
          <div className="max-w-md w-full mx-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 overflow-hidden">
                <img 
                  src="https://convex-cloud.s3.amazonaws.com/kg2ccwaff8zwk08gtth13ax0k57hc2ya" 
                  alt="Eye Shots Logo" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent mb-2">
                Eye Shots
              </h1>
              <p className="text-gray-600">
                Welcome to your luxury platform experience
              </p>
            </div>
            <SignInForm />
          </div>
        </div>
      </Unauthenticated>
    </div>
  );
}

export default App;
