import { FC } from 'react';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login: FC<LoginProps> = ({ setIsAuthenticated }) => {
  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3001/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center text-gray-800 mb-8">
          Welcome to ClockedIn
        </h1>
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 rounded-lg px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <img
              src="https://www.google.com/favicon.ico"
              alt="Google"
              className="w-5 h-5"
            />
            Sign in with Google
          </button>
        </div>
        <p className="mt-6 text-center text-sm text-gray-600">
          Track your meeting history and time spent in meetings
        </p>
      </div>
    </div>
  );
};

export default Login; 