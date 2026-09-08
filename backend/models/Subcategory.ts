import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ISubcategory extends Document {
  name: string;
  category: mongoose.Types.ObjectId;
  slug: string;
  description: string;
  image: string;
  status: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const subcategorySchema = new Schema<ISubcategory>(
  {
    name: {
      type: String,
      required: [true, 'Subcategory name is required'],
      trim: true,
      minlength: [2, 'Subcategory name must be at least 2 characters'],
      maxlength: [50, 'Subcategory name cannot exceed 50 characters'],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Parent Category is required'],
      index: true,
    },
    slug: {
      type: String,
      required: [true, 'Subcategory slug is required'],
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
    },
    image: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret._id ? ret._id.toString() : '';
        delete ret.__v;
        return ret;
      },
    },
  }
);

// Ensure unique slug per parent category
subcategorySchema.index({ category: 1, slug: 1 }, { unique: true });
subcategorySchema.index({ name: 'text', description: 'text' });

export const Subcategory: Model<ISubcategory> =
  mongoose.models.Subcategory || mongoose.model<ISubcategory>('Subcategory', subcategorySchema);
export default Subcategory;
