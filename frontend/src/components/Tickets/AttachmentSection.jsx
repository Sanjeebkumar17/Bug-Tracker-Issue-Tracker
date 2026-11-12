import React, { useRef, useState } from 'react';
import { Paperclip, Upload, Trash2, Download, FileText, Loader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AttachmentSection = ({ 
  attachments = [], 
  onUpload, 
  onDelete, 
  canUpload = true 
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await onUpload(file);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const isImage = (contentType, filename) => {
    return contentType?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
  };

  return (
    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Paperclip className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span>Attachments & Screenshots ({attachments.length})</span>
        </div>

        {canUpload && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 rounded-lg border border-indigo-200 dark:border-indigo-800 flex items-center gap-1.5 transition-colors"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span>Attach File / Screenshot</span>
            </button>
          </div>
        )}
      </div>

      {attachments.length === 0 ? (
        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No attachments uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {attachments.map((att) => {
            const isImg = isImage(att.content_type, att.filename);
            const downloadUrl = `/api/v1/attachments/${att.id}/download`;
            const previewUrl = `/uploads/${att.stored_filename}`;
            const canDelete = user?.id === att.uploader_id || user?.role === 'admin';

            return (
              <div
                key={att.id}
                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 dark:border-slate-700/80 bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {isImg ? (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="shrink-0">
                      <img
                        src={previewUrl}
                        alt={att.filename}
                        className="w-10 h-10 object-cover rounded border border-slate-200 dark:border-slate-700 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ) : (
                    <div className="w-10 h-10 rounded bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate" title={att.filename}>
                      {att.filename}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                      {formatFileSize(att.file_size)} • {att.uploader?.full_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                  <a
                    href={downloadUrl}
                    download
                    title="Download"
                    className="p-1 text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>

                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => onDelete(att.id)}
                      title="Delete file"
                      className="p-1 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
