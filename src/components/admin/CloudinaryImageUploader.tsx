import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface CloudinaryImageUploaderProps {
  label: string;
  value: string;
  publicId?: string;
  onChange: (url: string, publicId?: string) => void;
  uploadEndpoint: string;
  helperText?: string;
  required?: boolean;
}

export const CloudinaryImageUploader: React.FC<CloudinaryImageUploaderProps> = ({
  label,
  value,
  publicId,
  onChange,
  uploadEndpoint,
  helperText = 'PNG, JPG, WEBP, or SVG up to 15MB',
  required = false,
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isDirectUrlMode, setIsDirectUrlMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('File size exceeds the 15MB limit');
      return;
    }

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }

      onChange(data.url, data.publicId);
    } catch (err: any) {
      console.error('Upload to Cloudinary error:', err);
      setError(err.message || 'Failed to upload image to Cloudinary');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleRemove = () => {
    onChange('', '');
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[#1a1c1c]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <button
          type="button"
          onClick={() => setIsDirectUrlMode(!isDirectUrlMode)}
          className="text-[11px] font-medium text-[#6b38d4] hover:text-[#582db5] transition-colors"
        >
          {isDirectUrlMode ? 'Switch to Upload' : 'Paste Direct URL'}
        </button>
      </div>

      {isDirectUrlMode ? (
        <div className="space-y-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="https://images.unsplash.com/... or https://res.cloudinary.com/..."
            className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-xl text-xs text-[#1a1c1c] focus:border-[#6b38d4] focus:outline-none"
          />
          <p className="text-[10px] text-[#727785]">Paste external image URL or direct link</p>
        </div>
      ) : (
        <div>
          {value ? (
            <div className="relative group border border-[#e2e2e2] bg-[#fcfcfd] rounded-2xl p-2.5 flex items-center gap-3">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-white border border-gray-100 flex-shrink-0 shadow-xs">
                <img
                  src={value}
                  alt={label}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 min-w-0 pr-6">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600" />
                  <span>Cloud Stored</span>
                </div>
                <p className="text-[11px] text-[#727785] truncate mt-0.5" title={value}>
                  {value}
                </p>
                {publicId && (
                  <p className="text-[10px] text-gray-400 truncate">
                    ID: {publicId}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#6b38d4] bg-[#6b38d4]/5'
                  : 'border-[#e2e2e2] bg-[#fbfbfb] hover:bg-[#f6f6f6] hover:border-gray-300'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFile(e.target.files[0]);
                  }
                }}
              />

              {isUploading ? (
                <div className="py-2 flex flex-col items-center justify-center gap-1.5 text-[#6b38d4]">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-bold">Uploading to Cloudinary...</span>
                </div>
              ) : (
                <div className="py-1 flex flex-col items-center justify-center gap-1">
                  <div className="w-8 h-8 rounded-full bg-white shadow-xs border border-gray-100 flex items-center justify-center text-[#6b38d4]">
                    <UploadCloud className="w-4 h-4" />
                  </div>
                  <div className="text-xs font-medium text-[#1a1c1c]">
                    <span className="font-bold text-[#6b38d4]">Click to upload</span> or drag and drop
                  </div>
                  <p className="text-[10px] text-[#727785]">{helperText}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1 text-[11px] text-red-600">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};
