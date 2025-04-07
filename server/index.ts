import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import 'isomorphic-fetch';
import { JWTPayload } from './types';
import rateLimit from 'express-rate-limit';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Simple rate limiter to prevent abuse
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  message: 'Too many requests, please try again later'
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Middleware setup
app.use(cors({
  origin: ['https://clocked-in.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));
app.use(session({
  secret: JWT_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Store tokens temporarily with expiry information
interface UserTokens {
  [key: string]: any;
}

interface CacheEntry {
  timestamp: number;
  data: any;
}

interface UserCache {
  [userId: string]: {
    meetings?: CacheEntry;
  };
}

let userTokens: UserTokens = {};
let userCache: UserCache = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache

// Clean up expired tokens every hour
const TOKEN_CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour
setInterval(() => {
  const now = Date.now();
  for (const userId in userTokens) {
    if (userTokens[userId].expiry_date && userTokens[userId].expiry_date < now) {
      console.log(`Cleaning up expired token for user: ${userId}`);
      delete userTokens[userId];
      // Also clear their cache
      delete userCache[userId];
    }
  }
  console.log(`Token cleanup complete. Active users: ${Object.keys(userTokens).length}`);
}, TOKEN_CLEANUP_INTERVAL);

// Google OAuth2 setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3001/auth/google/callback'
);

// Middleware to verify JWT token
const verifyToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth check endpoint
app.get('/api/auth/check', verifyToken, (req, res) => {
  res.json({ authenticated: true });
});

// Google authentication routes
app.get('/auth/google', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar.readonly'],
    prompt: 'consent'
  });
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    console.error('No authorization code received from Google');
    return res.redirect(`${FRONTEND_URL}?error=no_code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    const userId = Math.random().toString(36).substring(7); // In production, use proper user IDs
    
    // Store tokens with expiry information for cleanup
    userTokens[userId] = {
      ...tokens,
      created_at: Date.now()
    };
    
    // Create JWT token
    const token = jwt.sign({ userId, authenticated: true }, JWT_SECRET, { expiresIn: '24h' });
    
    // Redirect with token - hardcoded for reliability
    res.redirect(`https://clocked-in.vercel.app/auth/google/callback?token=${token}`);
  } catch (error) {
    console.error('Error during Google authentication:', error);
    // Log specific error details
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.redirect(`https://clocked-in.vercel.app?error=auth_failed&reason=${encodeURIComponent('Failed to exchange authorization code')}`);
  }
});

// Meeting statistics endpoint
app.get('/api/meetings', verifyToken, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    console.log('User ID from token:', userId);
    
    const tokens = userTokens[userId];
    
    if (!tokens) {
      console.log('No tokens found for user ID:', userId);
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if we have cached data for this user
    const cachedData = userCache[userId]?.meetings;
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Returning cached meetings data for user: ${userId}`);
      return res.json(cachedData.data);
    }

    // Google Calendar API call
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from the beginning of 2025 only
    const startDate = new Date('2025-01-01T00:00:00Z');
    const endDate = new Date('2025-12-31T23:59:59Z');
    const now = new Date();
    
    // Use the earlier of now or end of 2025 as the end date
    const timeMax = now < endDate ? now.toISOString() : endDate.toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    // Meeting detection configuration
    const meetingKeywords = [
      'meeting', 'call', 'sync', 'standup', 'interview', 'workshop', 'presentation',
      'review', 'discussion', 'planning', 'check-in', 'checkin', '1:1', 'one-on-one',
      'office hours', 'consultation', 'session'
    ];
    
    const exclusionKeywords = [
      'party', 'fest', 'hotel', 'flight', 'vacation', 'holiday', 'dinner',
      'lunch break', 'coffee break', 'deadline', 'reminder', 'blocked',
      'focus time', 'do not disturb', 'out of office', 'ooo'
    ];

    const meetings = events.filter(event => {
      const eventTitle = (event.summary || '').toLowerCase();
      const eventDescription = (event.description || '').toLowerCase();
      
      // Skip events with exclusion keywords
      if (exclusionKeywords.some(keyword => eventTitle.includes(keyword))) {
        return false;
      }

      // Check for video conferencing links
      const hasVideoLink = event.conferenceData || 
                          eventDescription.includes('zoom.us') ||
                          eventDescription.includes('meet.google.com') ||
                          eventDescription.includes('teams.microsoft.com');

      // Check for meeting keywords in title
      const hasMeetingKeyword = meetingKeywords.some(keyword => eventTitle.includes(keyword));

      // Check for multiple attendees (excluding the organizer)
      const hasMultipleAttendees = event.attendees && event.attendees.length > 1;

      // Check for meeting-like description
      const hasMeetingDescription = eventDescription.includes('agenda') ||
                                   eventDescription.includes('meeting notes') ||
                                   eventDescription.includes('action items');

      // Event must meet at least one of these criteria to be considered a meeting
      return hasVideoLink || 
             (hasMeetingKeyword && hasMultipleAttendees) ||
             (hasMeetingDescription && hasMultipleAttendees);
    });
    
    // Debug logging for meetings
    console.log(`Found ${meetings.length} meetings in 2025 so far (from ${events.length} total events):`);
    meetings.forEach((event, index) => {
      if (event.summary) {
        const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
        const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
        const duration = start && end ? Math.round((end.getTime() - start.getTime()) / (1000 * 60)) : 0;
        
        const meetingType = [];
        if (event.conferenceData) meetingType.push("Video");
        if (event.attendees && event.attendees.length > 1) meetingType.push(`${event.attendees.length} attendees`);
        
        console.log(`[${index + 1}] ${event.summary} - ${start?.toLocaleString()} (${duration} minutes) [${meetingType.join(', ')}]`);
      }
    });

    let totalMinutes = 0;
    const totalMeetings = meetings.length;

    meetings.forEach(event => {
      if (event.start?.dateTime && event.end?.dateTime) {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
        totalMinutes += duration;
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const extraMinutes = Math.round(totalMinutes % 60);

    const responseData = {
      totalMeetings,
      totalHours,
      totalMinutes: extraMinutes,
      meetings: meetings.map(event => ({
        summary: event.summary || 'Untitled Meeting',
        start: event.start,
        end: event.end,
        attendees: event.attendees?.length || 0,
      })),
    };

    // Cache the data
    userCache[userId] = {
      ...userCache[userId],
      meetings: {
        timestamp: Date.now(),
        data: responseData
      }
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Add endpoint to generate and return meeting stats image URL
app.post('/api/meeting-stats-image', verifyToken, async (req, res) => {
  try {
    const userId = (req.user as any).userId;
    const tokens = userTokens[userId];
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }
    
    // Get the base64 image data from the request body
    const { imageData, stats } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // In a real implementation, you would:
    // 1. Upload the image to a cloud storage (AWS S3, Cloudinary, etc.)
    // 2. Return a permanent URL to the image
    
    // For this demo, we'll just return the stats and the base64 data
    // In a real implementation, this would be a URL to the uploaded image
    const imageUrl = imageData;

    res.json({
      imageUrl,
      stats
    });
  } catch (error) {
    console.error('Error processing meeting stats image:', error);
    res.status(500).json({ error: 'Failed to process meeting stats image' });
  }
});

// Change GET to POST for the above endpoint
app.get('/api/meeting-stats-image', verifyToken, async (req, res) => {
  // This is kept for backward compatibility
  try {
    const userId = (req.user as any).userId;
    const tokens = userTokens[userId];
    
    if (!tokens) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Check if we have cached data for this user
    const cachedData = userCache[userId]?.meetings;
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
      console.log(`Returning cached stats data for user: ${userId}`);
      
      const stats = cachedData.data;
      const imageUrl = "https://via.placeholder.com/1200x630/5D87E6/FFFFFF?text=Meeting+Stats:+" + 
                      stats.totalMeetings + "+Meetings,+" + stats.totalHours + "+Hours,+" + stats.totalMinutes + "+Minutes";
                      
      return res.json({
        imageUrl,
        stats
      });
    }

    // Get the user's meeting stats (reusing logic from /api/meetings)
    oauth2Client.setCredentials(tokens);
    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    // Get events from the beginning of 2025 only
    const startDate = new Date('2025-01-01T00:00:00Z');
    const endDate = new Date('2025-12-31T23:59:59Z');
    const now = new Date();
    
    // Use the earlier of now or end of 2025 as the end date
    const timeMax = now < endDate ? now.toISOString() : endDate.toISOString();

    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    const events = response.data.items || [];
    
    // Meeting detection configuration
    const meetingKeywords = [
      'meeting', 'call', 'sync', 'standup', 'interview', 'workshop', 'presentation',
      'review', 'discussion', 'planning', 'check-in', 'checkin', '1:1', 'one-on-one',
      'office hours', 'consultation', 'session'
    ];
    
    const exclusionKeywords = [
      'party', 'fest', 'hotel', 'flight', 'vacation', 'holiday', 'dinner',
      'lunch break', 'coffee break', 'deadline', 'reminder', 'blocked',
      'focus time', 'do not disturb', 'out of office', 'ooo'
    ];

    const meetings = events.filter(event => {
      const eventTitle = (event.summary || '').toLowerCase();
      const eventDescription = (event.description || '').toLowerCase();
      
      // Skip events with exclusion keywords
      if (exclusionKeywords.some(keyword => eventTitle.includes(keyword))) {
        return false;
      }

      // Check for video conferencing links
      const hasVideoLink = event.conferenceData || 
                          eventDescription.includes('zoom.us') ||
                          eventDescription.includes('meet.google.com') ||
                          eventDescription.includes('teams.microsoft.com');

      // Check for meeting keywords in title
      const hasMeetingKeyword = meetingKeywords.some(keyword => eventTitle.includes(keyword));

      // Check for multiple attendees (excluding the organizer)
      const hasMultipleAttendees = event.attendees && event.attendees.length > 1;

      // Check for meeting-like description
      const hasMeetingDescription = eventDescription.includes('agenda') ||
                                   eventDescription.includes('meeting notes') ||
                                   eventDescription.includes('action items');

      // Event must meet at least one of these criteria to be considered a meeting
      return hasVideoLink || 
             (hasMeetingKeyword && hasMultipleAttendees) ||
             (hasMeetingDescription && hasMultipleAttendees);
    });
    
    // Debug logging for meetings
    console.log(`Found ${meetings.length} meetings in 2025 so far (from ${events.length} total events):`);
    meetings.forEach((event, index) => {
      if (event.summary) {
        const start = event.start?.dateTime ? new Date(event.start.dateTime) : null;
        const end = event.end?.dateTime ? new Date(event.end.dateTime) : null;
        const duration = start && end ? Math.round((end.getTime() - start.getTime()) / (1000 * 60)) : 0;
        
        const meetingType = [];
        if (event.conferenceData) meetingType.push("Video");
        if (event.attendees && event.attendees.length > 1) meetingType.push(`${event.attendees.length} attendees`);
        
        console.log(`[${index + 1}] ${event.summary} - ${start?.toLocaleString()} (${duration} minutes) [${meetingType.join(', ')}]`);
      }
    });

    let totalMinutes = 0;
    const totalMeetings = meetings.length;

    meetings.forEach(event => {
      if (event.start?.dateTime && event.end?.dateTime) {
        const start = new Date(event.start.dateTime);
        const end = new Date(event.end.dateTime);
        const duration = (end.getTime() - start.getTime()) / (1000 * 60);
        totalMinutes += duration;
      }
    });

    const totalHours = Math.floor(totalMinutes / 60);
    const extraMinutes = Math.round(totalMinutes % 60);

    // For backward compatibility, return a placeholder image
    const imageUrl = "https://via.placeholder.com/1200x630/5D87E6/FFFFFF?text=Meeting+Stats:+" + 
                      totalMeetings + "+Meetings,+" + totalHours + "+Hours,+" + extraMinutes + "+Minutes";

    const statsData = {
      totalMeetings,
      totalHours,
      totalMinutes: extraMinutes
    };

    res.json({
      imageUrl,
      stats: statsData
    });
  } catch (error) {
    console.error('Error generating meeting stats image:', error);
    res.status(500).json({ error: 'Failed to generate meeting stats image' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Create server with graceful shutdown
const server = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 