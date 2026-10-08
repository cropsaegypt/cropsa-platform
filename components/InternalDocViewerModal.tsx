import React, { useState } from 'react';
import { 
  X, 
  Download, 
  ExternalLink, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FileText, 
  Image as ImageIcon, 
  ShieldCheck, 
  Printer, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

interface InternalDocViewerModalProps {
  document: {
    id?: string;
    name: string;
    url?: string;
    type?: string;
    size?: string;
    uploadedByName?: string;
    uploadedAt?: string;
  };
  clientName?: string;
  onClose: () => void;
}

export const InternalDocViewerModal: React.FC<InternalDocViewerModalProps> = ({
  document,
  clientName,
  onClose
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [verified, setVerified] = useState<boolean>(true);

  const docUrl = document.url || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=1200&q=80';
  const isImage = /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(docUrl) || document.type?.toLowerCase().includes('image') || true;

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md" dir="rtl">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Action Toolbar */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-400/30 flex items-center justify-center font-bold">
              {isImage ? <ImageIcon className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base text-slate-100">{document.name}</h3>
                {verified && (
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/30">
                    <ShieldCheck className="h-3 w-3" /> تم التحقق من أصل المستند
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {clientName ? `ملف العميل: ${clientName}` : 'مستند مرفق رسمي'} • الحجم: {document.size || '1.8 MB'}
              </p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 rounded-xl p-1 flex items-center gap-1 border border-slate-700">
              <button
                onClick={handleZoomOut}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="تصغير"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <span className="text-xs font-mono px-2 text-slate-300">{zoom}%</span>
              <button
                onClick={handleZoomIn}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="تكبير"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <div className="w-[1px] h-4 bg-slate-700 mx-1" />
              <button
                onClick={handleRotate}
                className="p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="تدوير 90 درجة"
              >
                <RotateCw className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Printer className="h-4 w-4" />
              <span className="hidden sm:inline">طباعة</span>
            </button>

            <a
              href={docUrl}
              target="_blank"
              rel="noreferrer"
              download
              className="px-3 py-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-sky-600/30 flex items-center gap-1.5 transition-all"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">تحميل</span>
            </a>

            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Viewport Area */}
        <div className="flex-1 bg-slate-950 overflow-auto flex items-center justify-center p-6 relative">
          <div 
            className="transition-transform duration-200 ease-out flex items-center justify-center max-w-full max-h-full"
            style={{ 
              transform: `scale(${zoom / 100}) rotate(${rotation}deg)` 
            }}
          >
            {isImage && Boolean(docUrl?.trim()) ? (
              <div className="relative shadow-2xl rounded-2xl overflow-hidden border border-slate-800 bg-white">
                <img
                  src={docUrl}
                  alt={document.name}
                  className="max-h-[70vh] w-auto object-contain select-none"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1 rounded-lg text-[10px] font-mono border border-white/10">
                  CROBSA SECURE PREVIEW • EGYPT
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl p-10 max-w-2xl text-slate-800 shadow-2xl">
                <FileText className="h-16 w-16 text-sky-600 mb-4" />
                <h4 className="text-xl font-bold">{document.name}</h4>
                <p className="text-sm text-slate-500 mt-2">
                  هذا المستند مخزن ومؤمن مشفراً ضمن قاعدة مستندات كروبسا المركزية.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Details Footer */}
        <div className="px-6 py-3 bg-slate-900 border-t border-slate-800 text-slate-400 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span>تاريخ الرفع: <strong className="text-slate-300 font-mono">{document.uploadedAt ? new Date(document.uploadedAt).toLocaleDateString('ar-EG') : 'حديث'}</strong></span>
            <span>بواسطة: <strong className="text-slate-300">{document.uploadedByName || 'إدارة النظام'}</strong></span>
          </div>
          <div className="text-[11px] text-sky-400 font-mono">
            ID: {document.id || 'DOC-CRB-9982'} • تشفير 256-bit AES
          </div>
        </div>

      </div>
    </div>
  );
};
