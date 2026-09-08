import mongoose, { Schema, Document, Model } from 'mongoose';

export interface INotification extends Document {
  notifId: string;
  title: string;
  message: string;
  type: 'order' | 'production' | 'promo' | 'system';
  timestamp: Date;
  read: boolean;
  orderId?: string;
}

const notificationSchema = new Schema<INotification>(
  {
    notifId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['order', 'production', 'promo', 'system'],
      default: 'system',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    read: {
      type: Boolean,
      default: false,
    },
    orderId: {
      type: String,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.notifId || (ret._id ? ret._id.toString() : '');
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Notification: Model<INotification> =
  mongoose.models.Notification ||
  mongoose.model<INotification>('Notification', notificationSchema);
export default Notification;
