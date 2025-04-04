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
  const [showAllMeetings, setShowAllMeetings] = useState(false);

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-blue-100 to-purple-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Your Meeting Stats</h1>
          <button 
            onClick={() => {
              localStorage.removeItem('auth_token');
              window.location.href = '/';
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Sign Out
          </button>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8" ref={statsCardRef}>
          <h2 className="text-2xl font-semibold text-gray-800 mb-6">2025 At A Glance</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6" ref={statsGridRef}>
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center">
              <div className="p-3 bg-blue-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-800">{stats.totalHours}</div>
                <div className="text-sm text-blue-600">Hours Spent</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center">
              <div className="p-3 bg-blue-100 rounded-full mb-4">
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-800">{stats.totalMinutes}</div>
                <div className="text-sm text-blue-600">Extra Minutes</div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-6 flex flex-col items-center">
              <div className="p-3 bg-blue-100 rounded-full mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-800">{stats.totalMeetings}</div>
                <div className="text-sm text-blue-600">Meetings Attended</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Debug section to verify meetings data */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-blue-900">Meeting Details</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAllMeetings(!showAllMeetings)} 
                className="text-sm px-4 py-2 bg-lavender-100 text-indigo-700 rounded-lg hover:bg-lavender-200 transition-all duration-300 ease-in-out"
              >
                {showAllMeetings ? 'Show Less' : 'Show All'}
              </button>
              <button 
                onClick={() => {
                  console.log('Full meetings data:', stats.meetings);
                  // Calculate total duration for verification
                  let totalMin = 0;
                  stats.meetings.forEach((meeting: any) => {
                    if (meeting.start?.dateTime && meeting.end?.dateTime) {
                      const start = new Date(meeting.start.dateTime);
                      const end = new Date(meeting.end.dateTime);
                      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                      totalMin += duration;
                    }
                  });
                  console.log(`Total duration: ${Math.floor(totalMin/60)} hours and ${totalMin%60} minutes (${totalMin} minutes)`);
                }} 
                className="text-sm px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-all duration-300 ease-in-out"
              >
                Log All Data
              </button>
            </div>
          </div>
          
          <div className="overflow-auto max-h-96">
            <div className="grid gap-3">
              {stats.meetings && (showAllMeetings ? stats.meetings : stats.meetings.slice(0, 10)).map((meeting: any, index: number) => {
                if (!meeting.start?.dateTime) return null;
                
                const start = new Date(meeting.start.dateTime);
                const end = new Date(meeting.end.dateTime);
                const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
                
                // Determine card color based on meeting duration
                const getDurationClass = () => {
                  if (duration <= 30) return "bg-green-50 border-l-4 border-green-200";
                  if (duration <= 60) return "bg-blue-50 border-l-4 border-blue-200";
                  return "bg-purple-50 border-l-4 border-purple-200";
                };
                
                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-lg shadow-sm ${getDurationClass()} hover:shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 animate-fadeIn`}
                    style={{animationDelay: `${index * 0.05}s`}}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">
                          {meeting.summary || 'Untitled Meeting'}
                        </h3>
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-1 text-gray-400" />
                          <span>{start.toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {duration} min
                        </span>
                      </div>
                    </div>
                    {meeting.attendees > 1 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        <span>{meeting.attendees} attendees</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            {!showAllMeetings && stats.meetings && stats.meetings.length > 10 && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing 10 of {stats.meetings.length} meetings. Click "Show All" to see all.
              </p>
            )}
          </div>
        </div>
        
        {/* Add a style tag for custom animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn {
            animation: fadeIn 0.5s ease-out forwards;
            opacity: 0;
          }
        `}</style>
        
        <div className="mt-8 text-center text-blue-600">
          <p className="text-sm">Tracking your collaborative journey through 2025</p>
          
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