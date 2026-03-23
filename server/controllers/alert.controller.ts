import { Request, Response } from 'express';
import Alert from '../models/Alert';

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const alerts = await Alert.find({ userId }).sort({ createdAt: -1 }).limit(20);
    res.status(200).json(alerts);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;
    const alert = await Alert.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );
    
    if (!alert) {
      return res.status(404).json({ message: 'Alert not found' });
    }
    
    res.status(200).json(alert);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    await Alert.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    
    res.status(200).json({ message: 'All alerts marked as read' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
