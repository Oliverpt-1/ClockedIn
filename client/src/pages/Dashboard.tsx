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

        const response = await fetch('http://localhost:3001/api/meetings', {
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
    if (!statsGridRef.current) return;
    
    try {
      setSharingImage(true);
      
      // Create a white background div for better image capture
      const captureContainer = document.createElement('div');
      captureContainer.style.position = 'fixed';
      captureContainer.style.left = '-9999px';
      captureContainer.style.background = 'white';
      captureContainer.style.padding = '20px';
      captureContainer.style.borderRadius = '12px';
      
      // Clone the stats grid for capture
      const statsClone = statsGridRef.current.cloneNode(true) as HTMLDivElement;
      
      // Add title
      const title = document.createElement('h2');
      title.textContent = 'Your Meeting History 2024';
      title.style.textAlign = 'center';
      title.style.color = '#1e40af';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '16px';
      
      // Add footer
      const footer = document.createElement('p');
      footer.textContent = 'Tracking your collaborative journey through 2024';
      footer.style.textAlign = 'center';
      footer.style.color = '#3b82f6';
      footer.style.fontSize = '14px';
      footer.style.marginTop = '16px';
      
      // Assemble capture container
      captureContainer.appendChild(title);
      captureContainer.appendChild(statsClone);
      captureContainer.appendChild(footer);
      document.body.appendChild(captureContainer);
      
      // Capture the image
      const canvas = await html2canvas(captureContainer, {
        backgroundColor: 'white',
        scale: 2, // Higher quality
      });
      
      // Remove capture container
      document.body.removeChild(captureContainer);
      
      // Convert to image
      const image = canvas.toDataURL('image/png');
      
      // Create a temporary image element to show in modal
      const imgElement = document.createElement('img');
      imgElement.src = image;
      imgElement.style.maxWidth = '100%';
      imgElement.style.borderRadius = '8px';
      imgElement.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
      
      // Create a modal to show the image and instructions
      const modal = document.createElement('div');
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      modal.style.display = 'flex';
      modal.style.flexDirection = 'column';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.padding = '20px';
      modal.style.zIndex = '9999';
      modal.style.overflowY = 'auto';
      
      // Create container for content
      const contentContainer = document.createElement('div');
      contentContainer.style.backgroundColor = 'white';
      contentContainer.style.borderRadius = '12px';
      contentContainer.style.padding = '20px';
      contentContainer.style.maxWidth = '500px';
      contentContainer.style.width = '100%';
      contentContainer.style.textAlign = 'center';
      contentContainer.style.position = 'relative';
      
      // Create close button
      const closeButton = document.createElement('button');
      closeButton.textContent = '×';
      closeButton.style.position = 'absolute';
      closeButton.style.top = '10px';
      closeButton.style.right = '10px';
      closeButton.style.backgroundColor = 'transparent';
      closeButton.style.border = 'none';
      closeButton.style.fontSize = '24px';
      closeButton.style.cursor = 'pointer';
      closeButton.style.color = '#666';
      closeButton.onclick = () => {
        document.body.removeChild(modal);
        setSharingImage(false);
      };
      
      // Create heading
      const heading = document.createElement('h3');
      heading.textContent = 'Your Meeting Stats Image';
      heading.style.marginBottom = '15px';
      heading.style.fontSize = '18px';
      heading.style.fontWeight = 'bold';
      
      // Create instructions
      const instructions = document.createElement('p');
      instructions.innerHTML = '1. Save this image by right-clicking it<br>2. Click "Share on X" below to compose your tweet<br>3. Attach this image to your tweet';
      instructions.style.marginBottom = '15px';
      instructions.style.fontSize = '14px';
      instructions.style.color = '#555';
      instructions.style.textAlign = 'left';
      instructions.style.marginLeft = '30px';
      
      // Create share on X button
      const shareButton = document.createElement('button');
      shareButton.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M18 2H6C3.79086 2 2 3.79086 2 6V18C2 20.2091 3.79086 22 6 22H18C20.2091 22 22 20.2091 22 18V6C22 3.79086 20.2091 2 18 2Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 12L12 16L16 12" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 8V16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg> <span>Share on X</span>';
      shareButton.style.backgroundColor = 'black';
      shareButton.style.color = 'white';
      shareButton.style.border = 'none';
      shareButton.style.padding = '10px 16px';
      shareButton.style.borderRadius = '8px';
      shareButton.style.cursor = 'pointer';
      shareButton.style.marginTop = '15px';
      shareButton.style.display = 'inline-flex';
      shareButton.style.alignItems = 'center';
      shareButton.style.gap = '8px';
      shareButton.onclick = () => {
        // Prepare tweet content without hashtags
        const tweetText = `I've spent ${stats.totalHours} hours and ${stats.totalMinutes} minutes in ${stats.totalMeetings} meetings so far this year! Track your own meeting stats with ClockedIn`;
        const tweetUrl = "https://clockedin.app"; // Replace with your actual URL
        
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(tweetUrl)}`,
          "_blank"
        );
      };
      
      // Assemble modal
      contentContainer.appendChild(closeButton);
      contentContainer.appendChild(heading);
      contentContainer.appendChild(imgElement);
      contentContainer.appendChild(instructions);
      contentContainer.appendChild(shareButton);
      modal.appendChild(contentContainer);
      
      // Add modal to body
      document.body.appendChild(modal);
      
      setSharingImage(false);
    } catch (err) {
      console.error('Error capturing image:', err);
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