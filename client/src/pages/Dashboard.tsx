import { useState, useEffect, useRef } from 'react';
import { Clock, Users, Twitter, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import html2canvas from 'html2canvas';

interface MeetingStats {
  totalMeetings: number;
  totalHours: number;
  totalMinutes: number;
  meetings: any[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<MeetingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sharingImage, setSharingImage] = useState(false);
  const statsCardRef = useRef<HTMLDivElement>(null);
  const statsGridRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meetings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('auth_token');
            navigate('/');
            return;
          }
          throw new Error('Failed to fetch meeting data');
        }

        const data = await response.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching meeting stats:', error);
        setError('Failed to load meeting statistics. Please try again.');
        if ((error as Error).message === 'Not authenticated') {
          navigate('/');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-blue-800">Loading your meeting statistics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  // Function to capture stats as image and share
  const captureAndShare = async () => {
    try {
      setSharingImage(true);
      
      // Get the image URL from the server
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/meeting-stats-image`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to generate stats image');
      }

      const data = await response.json();
      
      // Prepare tweet content
      const tweetText = `I've spent ${data.stats.totalHours} hours and ${data.stats.totalMinutes} minutes in ${data.stats.totalMeetings} meetings so far this year! Track your own meeting stats with ClockedIn`;
      
      // Open Twitter Web Intent with the image URL
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(data.imageUrl)}`,
        "_blank"
      );
      
      setSharingImage(false);
    } catch (err) {
      console.error('Error sharing stats:', err);
      setSharingImage(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 flex items-center justify-center p-6 relative overflow-hidden">
      <div ref={statsCardRef} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-2xl w-full relative z-10">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-semibold text-blue-800">
            Your Meeting History 2024
          </h1>
          <button
            onClick={() => {
              localStorage.removeItem('auth_token');
              navigate('/');
            }}
            className="px-4 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div ref={statsGridRef} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="bg-blue-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-700" />
            </div>
            <h2 className="text-2xl font-bold text-blue-900">{stats.totalMeetings}</h2>
            <p className="text-blue-600">Total Meetings</p>
          </div>
          
          <div className="bg-purple-50 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="bg-purple-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-purple-700" />
            </div>
            <h2 className="text-2xl font-bold text-purple-900">{stats.totalHours}</h2>
            <p className="text-purple-600">Hours Spent</p>
          </div>
          
          <div className="bg-pink-50 rounded-xl p-6 text-center transform hover:scale-105 transition-transform">
            <div className="bg-pink-200 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-pink-700" />
            </div>
            <h2 className="text-2xl font-bold text-pink-900">{stats.totalMinutes}</h2>
            <p className="text-pink-600">Extra Minutes</p>
          </div>
        </div>
        
        <div className="mt-8 text-center text-blue-600">
          <p className="text-sm">Tracking your collaborative journey through 2024</p>
          
          <div className="mt-6 flex justify-center">
            <button 
              onClick={captureAndShare}
              disabled={sharingImage}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-70"
            >
              {sharingImage ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Share2 size={18} />
                  <span>Share on X</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 