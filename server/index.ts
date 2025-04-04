import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { google } from 'googleapis';
import session from 'express-session';
import jwt from 'jsonwebtoken';
import 'isomorphic-fetch';
import { JWTPayload } from './types';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware setup
app.use(cors({
  origin: ['https://clocked-in.vercel.app', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
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

// Store tokens temporarily (in production, use a proper database)
interface UserTokens {
  [key: string]: any;
}
let userTokens: UserTokens = {};

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
    userTokens[userId] = tokens;
    
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
    console.log('Available token user IDs:', Object.keys(userTokens));
    
    const tokens = userTokens[userId];
    
    if (!tokens) {
      console.log('No tokens found for user ID:', userId);
      return res.status(401).json({ error: 'Not authenticated' });
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
    
    // Filter for actual meetings
    const meetings = events.filter(event => {
      // Check for video conferencing data
      const hasConferenceLink = !!event.conferenceData || 
        (event.description && 
          (event.description?.includes('zoom.') || 
           event.description?.includes('meet.google') || 
           event.description?.includes('teams.microsoft')));
      
      // Check for attendees (more than just the organizer)
      const hasMultipleAttendees = event.attendees && event.attendees.length > 1;
      
      // Check event title for meeting keywords
      const isMeetingByName = event.summary && 
        (/meeting|call|sync|standup|catch[ -]up|1:1|1on1|review|discussion/i).test(event.summary);
      
      // Exclude personal events
      const isPersonal = event.summary && 
        (/vacation|holiday|day off|leave|break|lunch|personal/i).test(event.summary);
      
      return (hasConferenceLink || hasMultipleAttendees || isMeetingByName) && !isPersonal;
    });
    
    // Debug logging for meetings
    console.log(`Found ${meetings.length} meetings in 2025 so far (filtered from ${events.length} total events):`);
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

    res.json({
      totalMeetings,
      totalHours,
      totalMinutes: extraMinutes,
      meetings: meetings.map(event => ({
        summary: event.summary || 'Untitled Meeting',
        start: event.start,
        end: event.end,
        attendees: event.attendees?.length || 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 