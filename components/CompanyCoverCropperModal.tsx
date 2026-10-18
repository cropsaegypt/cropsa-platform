import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Check, 
  Sliders, 
  RotateCcw, 
  ZoomIn, 
  MoveVertical, 
  MoveHorizontal, 
  Move,
  Building2,
  Eye,
  Hand
} from 'lucide-react';

export interface CompanyCoverCropperModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  coverImageUrl?: string;
  initialPosition?: string;
  currentPosition?: string;
  companyName: string;
  companyLogo?: string;
  onSave: (position: string) => void;
}

export const CompanyCoverCropperModal: React.FC<CompanyCoverCropperModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  coverImageUrl,
  initialPosition,
  currentPosition,
  companyName,
  companyLogo,
  onSave
}) => {
  const effectiveImageUrl = (coverImageUrl || imageUrl || '').trim() || 
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1600&auto=format&fit=crop&q=80';

  const rawPosition = currentPosition || initialPosition || '50% 50%';

  // Parse initial position e.g. "center 30%" or "50% 50%"
  const parseInitial = useCallback(() => {
    let v = 50;
    let h = 50;
    if (rawPosition) {
      if (rawPosition.includes('top')) v = 0;
      else if (rawPosition.includes('bottom')) v = 100;
      else if (rawPosition.includes('center')) v = 50;

      const matches = rawPosition.match(/(\d+)%/g);
      if (matches && matches.length >= 2) {
        h = parseInt(matches[0], 10);
        v = parseInt(matches[1], 10);
      } else if (matches && matches.length === 1) {
        v = parseInt(matches[0], 10);
      }
    }
    return { h, v };
  }, [rawPosition]);

  const [verticalPos, setVerticalPos] = useState<number>(50);
  const [horizontalPos, setHorizontalPos] = useState<number>(50);
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // References for drag math
  const containerRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef<{ clientX: number; clientY: number; startH: number; startV: number }>({
    clientX: 0,
    clientY: 0,
    startH: 50,
    startV: 50
  });

  // Sync state whenever modal opens or initial position changes
  useEffect(() => {
    if (isOpen) {
      const parsed = parseInitial();
      setVerticalPos(parsed.v);
      setHorizontalPos(parsed.h);
      setZoomLevel(100);
      setIsDragging(false);
    }
  }, [isOpen, parseInitial]);

  // Global mouseup listener for clean drag termination
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [isDragging]);

  if (!isOpen) return null;

  const currentPositionStyle = `${horizontalPos}% ${verticalPos}%`;

  // Start dragging (Mouse)
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    dragStartRef.current = {
      clientX: e.clientX,
      clientY: e.clientY,
      startH: horizontalPos,
      startV: verticalPos
    };
  };

  // Move dragging (Mouse)
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = e.clientX - dragStartRef.current.clientX;
    const deltaY = e.clientY - dragStartRef.current.clientY;

    // Pulling down (positive deltaY) reveals top of image -> lower vertical percentage
    const deltaPercentV = (deltaY / rect.height) * 100;
    // Pulling right (positive deltaX) reveals left of image -> lower horizontal percentage
    const deltaPercentH = (deltaX / rect.width) * 100;

    const newV = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startV - deltaPercentV)));
    const newH = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startH - deltaPercentH)));

    setVerticalPos(newV);
    setHorizontalPos(newH);
  };

  // Start dragging (Touch for mobile/tablets)
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartRef.current = {
        clientX: touch.clientX,
        clientY: touch.clientY,
        startH: horizontalPos,
        startV: verticalPos
      };
    }
  };

  // Move dragging (Touch)
  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const rect = containerRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const deltaX = touch.clientX - dragStartRef.current.clientX;
    const deltaY = touch.clientY - dragStartRef.current.clientY;

    const deltaPercentV = (deltaY / rect.height) * 100;
    const deltaPercentH = (deltaX / rect.width) * 100;

    const newV = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startV - deltaPercentV)));
    const newH = Math.max(0, Math.min(100, Math.round(dragStartRef.current.startH - deltaPercentH)));

    setVerticalPos(newV);
    setHorizontalPos(newH);
  };

  const handleApplyPreset = (v: number) => {
    setVerticalPos(v);
  };

  const handleReset = () => {
    setVerticalPos(50);
    setHorizontalPos(50);
    setZoomLevel(100);
  };

  const handleConfirmSave = () => {
    const formatted = `${horizontalPos}% ${verticalPos}%`;
    onSave(formatted);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 my-4 flex flex-col select-none">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-crobsa-950 to-slate-900 text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-sky-400 border border-white/10">
              <Sliders className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-black text-sm text-white">تحديد وضبط موضع غلاف الشركة (سحب مباشر)</h3>
              <p className="text-[11px] text-slate-300 mt-0.5">اسحب الصورة بالماوس مباشرة أو استخدم أدوات الضبط الدقيقة بالأسفل</p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">
          
          {/* Live Preview Box with Direct Drag & Drop */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-crobsa-700" />
                <span>المعاينة الحية (اسحب الصورة بالفأرة بحرية):</span>
              </span>
              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-bold">
                الموضع: {currentPositionStyle}
              </span>
            </div>

            {/* Banner Container with Interactive Drag */}
            <div 
              ref={containerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              className={`relative h-48 sm:h-56 w-full overflow-hidden rounded-2xl bg-slate-900 border-2 shadow-md transition-shadow select-none ${
                isDragging 
                  ? 'cursor-grabbing border-sky-500 shadow-sky-500/20 ring-4 ring-sky-500/20' 
                  : 'cursor-grab border-slate-300 hover:border-sky-400'
              }`}
              title="اضغط مع السحب لتحريك صورة الغلاف بحرية"
            >
              <img
                src={effectiveImageUrl}
                alt="Cover Preview"
                draggable={false}
                className="w-full h-full object-cover pointer-events-none select-none transition-none"
                style={{
                  objectPosition: currentPositionStyle,
                  transform: `scale(${zoomLevel / 100})`,
                  transformOrigin: currentPositionStyle
                }}
              />

              {/* Natural soft gradient at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/85 via-black/40 to-transparent pointer-events-none" />

              {/* Drag Hint Pill */}
              <div className="absolute top-3 left-3 z-10 pointer-events-none">
                <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg backdrop-blur-md transition-all ${
                  isDragging 
                    ? 'bg-sky-600/90 text-white ring-2 ring-white/50 animate-pulse' 
                    : 'bg-black/60 text-white/95 border border-white/20'
                }`}>
                  <Hand className="h-3.5 w-3.5 text-sky-400" />
                  <span>{isDragging ? 'جاري تحريك الكافر...' : 'اسحب الصورة بالماوس للتحريك المباشر'}</span>
                </span>
              </div>

              {/* Simulated Company Info overlay */}
              <div className="absolute bottom-3 inset-x-4 flex items-end justify-between gap-3 pointer-events-none">
                <div className="flex items-end gap-3">
                  <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-white p-1.5 border-2 border-white shadow-lg flex items-center justify-center shrink-0">
                    {companyLogo ? (
                      <img src={companyLogo} alt="Logo" className="h-full w-full object-contain" />
                    ) : (
                      <Building2 className="h-6 w-6 text-slate-400" />
                    )}
                  </div>
                  <div className="text-white pb-0.5">
                    <div className="font-black text-sm drop-shadow">{companyName || 'اسم شركة التقسيط'}</div>
                    <div className="text-[10px] text-sky-200 drop-shadow">غلاف البورتال الرسمي</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Preset Buttons */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">الضبط الرأسي السريع:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset(0)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  verticalPos === 0
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                أعلى الصورة (Top)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(50)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  verticalPos === 50
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                وسط الصورة (Center)
              </button>

              <button
                type="button"
                onClick={() => handleApplyPreset(100)}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  verticalPos === 100
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                أسفل الصورة (Bottom)
              </button>
            </div>
          </div>

          {/* Fine Tuning Sliders */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
            {/* Vertical Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MoveVertical className="h-4 w-4 text-sky-600" />
                  <span>التحريك الرأسي الدقيق (Vertical Focal Point)</span>
                </span>
                <span className="font-mono text-sky-700">{verticalPos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={verticalPos}
                onChange={(e) => setVerticalPos(Number(e.target.value))}
                className="w-full accent-sky-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0% (القمة)</span>
                <span>50% (الوسط)</span>
                <span>100% (القاعدة)</span>
              </div>
            </div>

            {/* Horizontal Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <MoveHorizontal className="h-4 w-4 text-purple-600" />
                  <span>التحريك الأفقي (Horizontal Focal Point)</span>
                </span>
                <span className="font-mono text-purple-700">{horizontalPos}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={horizontalPos}
                onChange={(e) => setHorizontalPos(Number(e.target.value))}
                className="w-full accent-purple-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-0.5">
                <span>0% (أقصى اليمين)</span>
                <span>50% (المنتصف)</span>
                <span>100% (أقصى اليسار)</span>
              </div>
            </div>

            {/* Zoom Slider */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                <span className="flex items-center gap-1.5">
                  <ZoomIn className="h-4 w-4 text-emerald-600" />
                  <span>نسبة التكبير (Zoom Level)</span>
                </span>
                <span className="font-mono text-emerald-700">{zoomLevel}%</span>
              </div>
              <input
                type="range"
                min="100"
                max="160"
                step="5"
                value={zoomLevel}
                onChange={(e) => setZoomLevel(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>إعادة ضبط افتراضي</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
            >
              إلغاء
            </button>
            <button
              type="button"
              onClick={handleConfirmSave}
              className="px-6 py-2 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-xl shadow-md flex items-center gap-1.5 transition-all"
            >
              <Check className="h-4 w-4" />
              <span>حفظ وتطبيق موضع الغلاف</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
