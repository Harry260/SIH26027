import React, { useState } from 'react';
import { X, Plus, AlertCircle, Gauge, CheckCircle, Layers, Sparkles } from 'lucide-react';
import { IssueSeverity, IssueType } from '../../types';
import { useRailwayStore } from '../../store/useRailwayStore';
import { getDerivedStatus } from '../../utils/status';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { IssueCard } from './IssueCard';

export const ReportPanel: React.FC = () => {
  const selectedResourceId = useRailwayStore((state) => state.selectedResourceId);
  const resources = useRailwayStore((state) => state.resources);
  const setSelectedResource = useRailwayStore((state) => state.setSelectedResource);
  const addResourceIssue = useRailwayStore((state) => state.addResourceIssue);
  const resolveResourceIssueAction = useRailwayStore((state) => state.resolveResourceIssueAction);

  // Form State - Severity is unselected (null) by default because it is predicted by the backend
  const [issueType, setIssueType] = useState<IssueType>('signal_fault');
  const [overrideSeverity, setOverrideSeverity] = useState<IssueSeverity | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  if (!selectedResourceId || !resources || resources.length === 0) return null;

  const currentResource = resources.find(
    (r) => r.resource.id === selectedResourceId
  );

  if (!currentResource) return null;

  const derivedStatus = getDerivedStatus(currentResource);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    await addResourceIssue(currentResource.resource.id, {
      issue_type: issueType,
      severity: overrideSeverity || undefined,
      description: description.trim(),
      reported_by: 'Chief Section Controller',
    });

    setDescription('');
    setOverrideSeverity(null);
    setIsSubmitting(false);
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  return (
    <div className="fixed top-20 right-4 bottom-20 z-40 w-96 max-w-[calc(100vw-32px)] flex flex-col glass-panel rounded-3xl overflow-hidden transition-all duration-300 animate-slide-in text-ink dark:text-white">
      {/* Panel Header */}
      <div className="px-5 py-4 border-b border-black/5 dark:border-white/10 flex items-center justify-between shrink-0 glass-card">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-ink dark:text-white tracking-tight-title font-sans">
              {currentResource.name}
            </h2>
            <Badge status={derivedStatus} size="sm" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ID: #{currentResource.resource.id} · Kind: {currentResource.resource.kind} · {currentResource.length_m}m
          </p>
        </div>

        <button
          onClick={() => setSelectedResource(null)}
          aria-label="Close panel"
          className="p-1.5 rounded-full text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Resource Telemetry Card */}
        <div className="p-3.5 rounded-2xl glass-card space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
              <span>Track Configuration</span>
            </span>
            <span className="font-mono font-medium text-ink dark:text-gray-200">
              {currentResource.resource.lane_count} Lane(s) · {currentResource.gradient || '1:500'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-500" />
              <span>Speed & Occupancy</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink dark:text-white">
                {currentResource.max_speed_kmh || 130} km/h
              </span>
              <span className="capitalize text-zinc-500 dark:text-zinc-400">({currentResource.occupancy})</span>
            </div>
          </div>

          {(currentResource.train_name || currentResource.active_train) && (
            <div className="pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-primary dark:text-primary-dark">
              <span className="font-medium">Active Train:</span>
              <span className="font-semibold">
                #{currentResource.active_train} - {currentResource.train_name || 'Active'}
              </span>
            </div>
          )}
        </div>

        {/* Section 1: Existing Issues List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
              <span>Existing Issues ({currentResource.issues?.length || 0})</span>
            </h3>
            {currentResource.issues && currentResource.issues.length > 1 && (
              <span className="text-[11px] text-amber-500 font-medium">Multiple simultaneous</span>
            )}
          </div>

          {!currentResource.issues || currentResource.issues.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center text-xs text-zinc-500 dark:text-zinc-400 glass-card">
              No active issues on this resource. Track clear and signaling operational.
            </div>
          ) : (
            <div className="space-y-2">
              {currentResource.issues.map((issue) => (
                <IssueCard
                  key={issue.issue_id}
                  issue={issue}
                  onResolve={(issueId) => resolveResourceIssueAction(currentResource.resource.id, issueId)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Add New Issue Form */}
        <div className="space-y-3 pt-2 border-t border-black/5 dark:border-white/10">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
              <span>Report New Incident</span>
            </h3>
            {formSuccess && (
              <span className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Recorded</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Issue Type Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Incident / Issue Type
              </label>
              <select
                value={issueType}
                onChange={(e) => setIssueType(e.target.value as IssueType)}
                className="w-full text-xs px-3 py-2 rounded-xl glass-input border border-black/10 dark:border-white/10 text-ink dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="obstruction">Obstruction (Track/Overhead)</option>
                <option value="signal_fault">Signal / Telemetry Fault</option>
                <option value="speed_restriction">Speed Restriction (TSR)</option>
                <option value="maintenance">Track Maintenance Block</option>
                <option value="other">Other Operational Issue</option>
              </select>
            </div>

            {/* Severity Selector (Optional Override) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <span>Severity</span>
                  <span className="text-[10px] text-zinc-400 font-normal">(Override)</span>
                </label>
                <span className="text-[10px] text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary dark:text-primary-dark" />
                  <span>{overrideSeverity ? 'Manual override' : 'AI predicted in backend'}</span>
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setOverrideSeverity(null)}
                  className={`text-xs py-1.5 px-1 rounded-xl border font-medium transition-all select-none cursor-pointer truncate ${
                    overrideSeverity === null
                      ? 'bg-primary/20 dark:bg-primary/30 text-primary dark:text-primary-dark border-primary/50 shadow-sm font-semibold ring-1 ring-primary/40'
                      : 'glass-card text-zinc-600 dark:text-zinc-400 hover:bg-white/40'
                  }`}
                >
                  Auto
                </button>
                {(['low', 'medium', 'high'] as IssueSeverity[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setOverrideSeverity(overrideSeverity === level ? null : level)}
                    className={`text-xs py-1.5 rounded-xl border font-medium capitalize transition-all select-none cursor-pointer ${
                      overrideSeverity === level
                        ? level === 'high'
                          ? 'bg-red-500/90 text-white border-red-600 shadow-sm'
                          : level === 'medium'
                          ? 'bg-amber-500/90 text-white border-amber-600 shadow-sm'
                          : 'bg-emerald-500/90 text-white border-emerald-600 shadow-sm'
                        : 'glass-card text-zinc-700 dark:text-zinc-300 hover:bg-white/40'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Description Textarea */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Incident Description & Details
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe track condition, signal indication, or required speed caution..."
                rows={3}
                required
                className="w-full text-xs p-2.5 rounded-2xl glass-input border border-black/10 dark:border-white/10 text-ink dark:text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={isSubmitting}
              disabled={!description.trim()}
              className="w-full font-semibold shadow-md"
            >
              Submit Resource Incident
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
