import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface GoogleCallbackProps {
  setIsAuthenticated: (value: boolean) => void;
}

const GoogleCallback = ({ setIsAuthenticated }: GoogleCallbackProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("GoogleCallback component mounted");
    console.log("Search params:", Object.fromEntries(searchParams.entries()));
    
    const timeoutId = setTimeout(() => {
      if (!searchParams.get('token')) {
        console.error("Authentication timeout");
        setError("Authentication timed out. Please try again.");
      }
    }, 30000); // 30 second timeout

    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');
    
    if (errorParam) {
      console.error("Authentication error:", errorParam);
      setError(`Authentication failed: ${errorParam}`);
      return;
    }

    if (token) {
      console.log("Token found, storing in localStorage");
      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } else {
      console.error("No token found in URL");
      setError("No authentication token received. Please try again.");
    }

    return () => clearTimeout(timeoutId);
  }, [searchParams, setIsAuthenticated, navigate]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100">
        <div className="text-center">
          <div className="text-red-600 mb-4">{error}</div>
          <button 
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback; 