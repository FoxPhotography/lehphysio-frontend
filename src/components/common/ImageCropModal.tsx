import React, { useEffect, useState } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { Check, Loader2, RotateCcw, X } from 'lucide-react';
import { getCroppedImageFile } from '../../utils/cropImage';

const ASPECTS = [
  { label: '1:1', value: 1 },
  { label: '5:4', value: 5 / 4 },
  { label: '4:5', value: 4 / 5 },
  { label: '16:9', value: 16 / 9 },
  { label: '9:16', value: 9 / 16 },
] as const;

interface ImageCropModalProps {
  imageSrc: string | null;
  fileName?: string;
  onCancel: () => void;
  onComplete: (file: File) => void | Promise<void>;
  onError?: (message: string) => void;
}

export const ImageCropModal: React.FC<ImageCropModalProps> = ({
  imageSrc,
  fileName,
  onCancel,
  onComplete,
  onError,
}) => {
  const [aspect, setAspect] = useState(1);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!imageSrc) return;
    setAspect(1);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }, [imageSrc]);

  if (!imageSrc) return null;

  const handleConfirm = async () => {
    if (!croppedAreaPixels || isSaving) return;
    setIsSaving(true);
    try {
      const file = await getCroppedImageFile(imageSrc, croppedAreaPixels, fileName);
      await onComplete(file);
    } catch (error) {
      console.error('Error cropping image:', error);
      onError?.('حصلت مشكلة أثناء تجهيز الصورة.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/85 p-4">
      <div className="glass-card w-full max-w-2xl overflow-hidden border border-white/10 bg-zinc-950">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4">
          <div>
            <h2 className="text-base font-black text-white">ظبط شكل الصورة</h2>
            <p className="mt-1 text-2xs font-bold text-zinc-500">اختار النسبة واسحب الصورة للمكان المناسب</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/8 hover:text-white"
            aria-label="إغلاق"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative h-[min(62vh,520px)] min-h-[280px] bg-black">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            objectFit="contain"
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
          />
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {ASPECTS.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => {
                  setAspect(option.value);
                  setCrop({ x: 0, y: 0 });
                }}
                className={`rounded-xl border px-4 py-2 text-xs font-black transition-colors ${
                  aspect === option.value
                    ? 'border-brand-orange bg-brand-orange/15 text-brand-orange'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <label className="flex items-center gap-3 text-2xs font-bold text-zinc-400">
            <RotateCcw className="h-4 w-4 shrink-0 text-brand-orange" />
            <span className="shrink-0">تكبير</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="w-full accent-orange-500"
            />
          </label>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-zinc-800 px-4 py-2.5 text-xs font-bold text-zinc-300 transition-colors hover:bg-white/5"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={!croppedAreaPixels || isSaving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-orange to-brand-amber px-5 py-2.5 text-xs font-black text-black transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              <span>{isSaving ? 'بنجهز…' : 'اعتماد الصورة'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
