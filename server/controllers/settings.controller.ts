import { Request, Response } from 'express';
import SystemSettings from '../models/SystemSettings';

export const getSettings = async (req: Request, res: Response) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({ maintenanceMode: false, message: 'System is currently under maintenance. Please try again later.' });
    }
    res.status(200).json(settings);
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateMaintenanceMode = async (req: Request, res: Response) => {
  try {
    const { maintenanceMode, message } = req.body;
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings({
        maintenanceMode: maintenanceMode,
        message: message || 'System is currently under maintenance. Please try again later.'
      });
    } else {
      if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
      if (message !== undefined) settings.message = message;
    }
    
    const updatedSettings = await settings.save();
    
    res.status(200).json({ 
      message: 'Maintenance mode updated', 
      data: updatedSettings 
    });
  } catch (error: any) {
    console.error('Error updating maintenance mode:', error);
    res.status(500).json({ 
      message: 'Failed to update maintenance mode', 
      error: error.message 
    });
  }
};
