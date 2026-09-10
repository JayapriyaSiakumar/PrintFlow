import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IProductColor {
  name: string;
  hex: string;
  bgClass: string;
}

export interface IProductDetails {
  material: string;
  weight: string;
  fit: string;
  care: string;
  origin: string;
}

export interface IProduct extends Document {
  productId: string;
  name: string;
  category: mongoose.Types.ObjectId | any;
  price: number;
  stock: number;
  spec: string;
  description: string;
  sizes: string[];
  colors: IProductColor[];
  image: string;
  imagePublicId?: string;
  mockupImages?: { side?: string; url: string; publicId?: string }[];
  tag?: string;
  rating: number;
  reviewsCount: number;
  featured: boolean;
  details?: IProductDetails;
  createdAt: Date;
  updatedAt: Date;
}

const productColorSchema = new Schema<IProductColor>(
  {
    name: { type: String, required: true },
    hex: { type: String, required: true },
    bgClass: { type: String, default: 'bg-neutral-800' },
  },
  { _id: false }
);

const productDetailsSchema = new Schema<IProductDetails>(
  {
    material: { type: String, default: '100% Combed Cotton' },
    weight: { type: String, default: '240 GSM Heavyweight' },
    fit: { type: String, default: 'Regular Fit' },
    care: { type: String, default: 'Machine wash cold with like colors' },
    origin: { type: String, default: 'PrintFlow Hub #1' },
  },
  { _id: false }
);

const productSchema = new Schema<IProduct>(
  {
    productId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Please add a product name'],
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Please select a category'],
      index: true,
    },
    price: {
      type: Number,
      required: [true, 'Please specify price'],
      min: 0,
    },
    stock: {
      type: Number,
      default: 50,
      min: 0,
    },
    spec: {
      type: String,
      default: 'Premium Quality Blank',
    },
    description: {
      type: String,
      default: '',
    },
    sizes: {
      type: [String],
      default: ['S', 'M', 'L', 'XL', '2XL'],
    },
    colors: {
      type: [productColorSchema],
      default: [
        { name: 'Pure White', hex: '#ffffff', bgClass: 'bg-white' },
        { name: 'Onyx Black', hex: '#111111', bgClass: 'bg-neutral-900' },
      ],
    },
    image: {
      type: String,
      required: [true, 'Product image is required'],
    },
    imagePublicId: {
      type: String,
      default: '',
    },
    mockupImages: {
      type: [{ side: String, url: String, publicId: String }],
      default: [],
    },
    tag: {
      type: String,
      default: 'New',
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    reviewsCount: {
      type: Number,
      default: 1,
    },
    featured: {
      type: Boolean,
      default: false,
    },
    details: {
      type: productDetailsSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret: Record<string, any>) {
        ret.id = ret.productId || (ret._id ? ret._id.toString() : '');
        // Provide categoryName convenience field
        if (ret.category && typeof ret.category === 'object') {
          ret.categoryName = ret.category.name || '';
        }
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

export const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>('Product', productSchema);
export default Product;
