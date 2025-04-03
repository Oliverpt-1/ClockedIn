declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        authenticated: boolean;
      }
    }
  }
}

export interface JWTPayload {
  userId: string;
  authenticated: boolean;
}

export interface MicrosoftEvent {
  subject: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
} 