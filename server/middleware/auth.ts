import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../firebase';

// Extend the Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// Authentication middleware
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      console.log('No authorization header');
      return res.status(401).json({ 
        message: 'Unauthorized: No token provided',
        error: 'No token provided'
      });
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      console.log('Invalid authorization header format');
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid token format',
        error: 'Invalid token format'
      });
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1].trim();
    
    if (!token) {
      console.log('No token found in header');
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid token format',
        error: 'No token found'
      });
    }

    console.log('Verifying token:', token.substring(0, 20) + '...');
    
    // Verify the token
    try {
      const decodedToken = await verifyToken(token);
      console.log('Token verified successfully:', {
        uid: decodedToken.uid,
        email: decodedToken.email
      });
      
      // Set the user in the request object
      req.user = decodedToken;
      req.token = token;
      
      next();
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ 
        message: 'Unauthorized: Invalid token',
        error: error instanceof Error ? error.message : 'Token verification failed'
      });
    }
  } catch (error) {
    console.error('Error in authentication middleware:', error);
    return res.status(500).json({ 
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};
