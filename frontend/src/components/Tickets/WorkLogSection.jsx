import React, { useState } from 'react';
import { Clock, Plus, Loader2 } from 'lucide-react';

export const WorkLogSection = ({
  worklogs = [],
  estimatedHours = null,
  totalLoggedMinutes = 0,
  onLogWork,
  canLog = true
}) => {
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const totalLoggedHours = (totalLoggedMinutes / 60).toFixed(1);
  const percentage = estimatedHours && estimatedHours > 0 
    ? Math.min(100, Math.round((totalLoggedMinutes / (estimatedHours * 60)) * 100))
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalMinutes = (parseInt(hours || 0) * 60) + parseInt(minutes || 0);
    if (totalMinutes <= 0) return;

    setLoading(true);
    try {
      await onLogWork(totalMinutes, description.trim());
      setHours('');
      setMinutes('');
      setDescription('');
      setIsOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 pt-3 border-t border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800 dark:text-slate-200">
          <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Time Tracking & Work Logs</span>
        </div>

        {canLog && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Log Work</span>
          </button>
        )}
      </div>

      {/* Progress & Estimates */}
      <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700/80 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium">
            Logged: <strong className="text-slate-900 dark:text-white">{totalLoggedHours}h</strong> ({totalLoggedMinutes}m)
          </span>
          {estimatedHours ? (
            <span className="text-slate-600 dark:text-slate-400">
              Estimate: <strong className="text-slate-900 dark:text-white">{estimatedHours}h</strong> ({percentage}%)
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">No estimate set</span>
          )}
        </div>

        {estimatedHours && estimatedHours > 0 && (
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${
                percentage > 90 ? 'bg-red-500' : percentage > 70 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        )}
      </div>

      {/* Log Work Form */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-800 p-3.5 rounded-lg border border-emerald-200 dark:border-emerald-800 shadow-sm space-y-3">
          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Log Work Time</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Hours</label>
              <input
                type="number"
                min="0"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder="e.g. 2"
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Minutes</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="e.g. 30"
                className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Work Note / Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What did you work on? (e.g. Refactored Auth middleware)"
              className="w-full px-2.5 py-1.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || (!hours && !minutes)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              <span>Save Work</span>
            </button>
          </div>
        </form>
      )}

      {/* Work Logs History */}
      <div className="space-y-2">
        {worklogs.length === 0 ? (
          <p className="text-xs text-slate-400 dark:text-slate-500 italic">No time logged yet.</p>
        ) : (
          worklogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{log.user?.full_name}</span>
                  <span className="px-1.5 py-0.2 rounded font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px]">
                    {Math.floor(log.time_spent_minutes / 60)}h {log.time_spent_minutes % 60}m
                  </span>
                </div>
                {log.description && (
                  <p className="text-slate-600 dark:text-slate-400 italic text-[11px]">{log.description}</p>
                )}
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500">
                {new Date(log.created_at).toLocaleDateString()}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
