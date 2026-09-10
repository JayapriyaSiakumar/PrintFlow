import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IOrderItem {
  id: string;
  productId: string;
  product: any;
  size: string;
  color: any;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  customDesign?: {
    text?: string;
    textColor?: string;
    fontFamily?: string;
    placement?: string;
    graphicUrl?: string;
    graphicPublicId?: string;
    previewDataUrl?: string;
    previewDataUrlPublicId?: string;
    previewFrontUrl?: string;
    previewFrontPublicId?: string;
    previewBackUrl?: string;
    previewBackPublicId?: string;
  };
}

export interface IShippingAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IOrderTimeline {
  status: string;
  label: string;
  timestamp: Date;
  description: string;
}

export interface IOrder extends Document {
  orderId: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: IOrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  shippingAddress: IShippingAddress;
  status: 'pending' | 'processing' | 'printing' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';
  trackingNumber: string;
  timeline: IOrderTimeline[];
  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    id: { type: String, required: true },
    productId: { type: String, required: true },
    product: { type: Schema.Types.Mixed, required: true },
    size: { type: String, required: true },
    color: { type: Schema.Types.Mixed, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true },
    totalPrice: { type: Number, required: true },
    customDesign: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, default: 'United States' },
  },
  { _id: false }
);

const timelineSchema = new Schema<IOrderTimeline>(
  {
    status: { type: String, required: true },
    label: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    description: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new Schema<IOrder>(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userId: {
      type: String,
      required: true,
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    customerEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: [(val: any[]) => val.length > 0, 'Must have at least one order item'],
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'printing', 'quality_check', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    timeline: {
      type: [timelineSchema],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.orderId || (ret._id ? ret._id.toString() : '');
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>('Order', orderSchema);
export default Order;
