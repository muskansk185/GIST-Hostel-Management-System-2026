import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User';
import SystemSettings from '../models/SystemSettings';

export interface AuthRequest extends Request {
  user?: { userId: string; role: UserRole; department?: string; hostelId?: string; studentIds?: string[] };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret', async (err, decoded) => {
      if (err) {
        console.error('JWT verification error:', err);
        res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
        return;
      }
      const decodedUser = decoded as { userId: string; role: UserRole };
      
      try {
        const dbUser = await User.findById(decodedUser.userId);
        if (!dbUser) {
          console.error('User not found in DB:', decodedUser.userId);
          res.status(401).json({ message: 'Unauthorized: User not found' });
          return;
        }

        req.user = {
          userId: dbUser._id.toString(),
          role: dbUser.role,
          department: dbUser.department,
          hostelId: dbUser.hostelId?.toString(),
          studentIds: dbUser.studentIds?.map(id => id.toString())
        };

        // Check for maintenance mode
        const settings = await SystemSettings.findOne();
        if (settings?.maintenanceMode && req.user.role !== UserRole.SUPER_ADMIN) {
          res.status(503).json({ message: 'System under maintenance' });
          return;
        }

        next();
      } catch (dbError) {
        console.error('DB error during auth:', dbError);
        res.status(500).json({ message: 'Server error during authentication' });
      }
    });
  } else {
    console.warn('Missing or invalid auth header');
    res.status(401).json({ message: 'Unauthorized: Missing token' });
  }
};

export const authorizeRoles = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden: Insufficient permissions' });
      return;
    }
    next();
  };
};
