import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICustomDesign extends Document {
  designId: string;
  userId: string;
  name: string;
  productId: string;
  productName: string;
  productImage: string;
  selectedColorHex: string;
  selectedSize?: string;
  designText?: string;
  designTextColor?: string;
  designFont?: string;
  graphicUrl?: string;
  placement: 'front' | 'back' | 'chest' | 'sleeve';
  previewDataUrl?: string;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  sides?: any;
  designConfig?: any;
  createdAt: Date;
  updatedAt: Date;
}

const customDesignSchema = new Schema<ICustomDesign>(
  {
    designId: {
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
    name: {
      type: String,
      required: [true, 'Please provide a design name'],
      trim: true,
      default: 'Untitled Custom Creation',
    },
    productId: {
      type: String,
      required: true,
    },
    productName: {
      type: String,
      required: true,
    },
    productImage: {
      type: String,
      required: true,
    },
    selectedColorHex: {
      type: String,
      default: '#ffffff',
    },
    designText: {
      type: String,
      default: '',
    },
    designTextColor: {
      type: String,
      default: '#ffffff',
    },
    designFont: {
      type: String,
      default: 'Montserrat',
    },
    graphicUrl: {
      type: String,
      default: '',
    },
    placement: {
      type: String,
      enum: ['front', 'back', 'chest', 'sleeve'],
      default: 'front',
    },
    previewDataUrl: {
      type: String,
      default: '',
    },
    previewFrontUrl: {
      type: String,
      default: '',
    },
    previewBackUrl: {
      type: String,
      default: '',
    },
    selectedSize: {
      type: String,
      default: 'M',
    },
    sides: {
      type: Schema.Types.Mixed,
      default: () => ({ front: { elements: [] }, back: { elements: [] } }),
    },
    designConfig: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.designId || (ret._id ? ret._id.toString() : '');
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const CustomDesign: Model<ICustomDesign> =
  mongoose.models.CustomDesign ||
  mongoose.model<ICustomDesign>('CustomDesign', customDesignSchema);
export default CustomDesign;
