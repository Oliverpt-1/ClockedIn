import { FC } from 'react';

interface LoginProps {
  setIsAuthenticated: (value: boolean) => void;
}

const Login: FC<LoginProps> = ({ setIsAuthenticated }) => {
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
      <div className="absolute top-40 right-20 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-20 left-1/2 w-64 h-64 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      
      {/* Hero content */}
      <div className="mb-10 text-center z-10">
        <h1 className="text-5xl font-bold text-blue-900 mb-4 tracking-tight">
          ClockedIn
        </h1>
        <p className="text-xl text-blue-700 max-w-xl">
          Discover how much time you're spending in meetings in 2025
        </p>
      </div>
      
      {/* Main card */}
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full relative z-10 backdrop-filter backdrop-blur-lg bg-opacity-80 border border-white border-opacity-20">
        <div className="flex justify-center mb-8">
          <div className="p-3 bg-blue-50 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
          Get Your Meeting Stats
        </h2>
        
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-8">
            <div className="flex-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-600">1</div>
              <span>Sign in</span>
            </div>
            <div className="h-px w-4 bg-gray-200"></div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">2</div>
              <span>View stats</span>
            </div>
            <div className="h-px w-4 bg-gray-200"></div>
            <div className="flex-1 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">3</div>
              <span>Share</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-6 py-3 text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign in with Google
          </button>
          
          <p className="text-center text-xs text-gray-500 mt-8">
            We only access your calendar to calculate meeting statistics.
            <br />Your data is never stored or shared.
          </p>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-100">
          <div className="flex gap-4 justify-center">
            <div className="text-center">
              <div className="text-blue-600 font-bold">Track</div>
              <div className="text-xs text-gray-500">Your meetings</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-bold">Analyze</div>
              <div className="text-xs text-gray-500">Your time</div>
            </div>
            <div className="text-center">
              <div className="text-blue-600 font-bold">Share</div>
              <div className="text-xs text-gray-500">Your stats</div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="mt-12 text-center text-gray-500 text-sm z-10">
        ClockedIn • Plan your 2025 meetings better
      </div>
      
      {/* Add animation keyframes */}
      <style>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default Login; 