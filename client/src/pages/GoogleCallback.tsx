import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface GoogleCallbackProps {
  setIsAuthenticated: (value: boolean) => void;
}

const GoogleCallback = ({ setIsAuthenticated }: GoogleCallbackProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // Store token in localStorage
      localStorage.setItem('auth_token', token);
      setIsAuthenticated(true);
      navigate('/dashboard');
    } else {
      navigate('/?error=auth_failed');
    }
  }, [searchParams, setIsAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
        <p className="text-gray-600">Completing authentication...</p>
      </div>
    </div>
  );
};

export default GoogleCallback; 