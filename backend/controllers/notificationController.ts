import { Request, Response } from 'express';
import mongoose from 'mongoose';
import Notification from '../models/Notification';
import memoryStore from '../utils/memoryStore';

/**
 * @desc    Get user notifications
 * @route   GET /api/notifications
 * @access  Public
 */
export const getNotifications = async (_req: Request, res: Response) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const notifications = await Notification.find().sort({ timestamp: -1 });
      return res.json({ notifications });
    }
    res.json({ notifications: memoryStore.notifications });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Mark notification(s) as read
 * @route   POST /api/notifications/read
 * @access  Public
 */
export const markNotificationRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.body;

    if (mongoose.connection.readyState === 1) {
      if (id) {
        await Notification.updateOne(
          { $or: [{ notifId: id }, { _id: mongoose.Types.ObjectId.isValid(id) ? id : undefined }] },
          { read: true }
        );
      } else {
        await Notification.updateMany({}, { read: true });
      }
      return res.json({ success: true });
    }

    if (id) {
      const notif = memoryStore.notifications.find((n) => n.id === id);
      if (notif) notif.read = true;
    } else {
      memoryStore.notifications.forEach((n) => (n.read = true));
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
