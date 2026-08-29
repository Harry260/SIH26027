import React, { useState } from 'react';
import { X, Plus, AlertCircle, Signal, Gauge, ArrowRight, CheckCircle } from 'lucide-react';
import { IssueSeverity, IssueType } from '../../types';
import { useRailwayStore } from '../../store/useRailwayStore';
import { getDerivedStatus } from '../../utils/status';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { IssueCard } from './IssueCard';

export const ReportPanel: React.FC = () => {
  const selectedBlockId = useRailwayStore((state) => state.selectedBlockId);
  const blocksData = useRailwayStore((state) => state.blocksData);
  const setSelectedBlock = useRailwayStore((state) => state.setSelectedBlock);
  const addBlockIssue = useRailwayStore((state) => state.addBlockIssue);
  const resolveBlockIssue = useRailwayStore((state) => state.resolveBlockIssue);

  // Form State
  const [issueType, setIssueType] = useState<IssueType>('signal_fault');
  const [severity, setSeverity] = useState<IssueSeverity>('medium');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  if (!selectedBlockId || !blocksData) return null;

  const currentFeature = blocksData.features.find(
    (f) => f.properties.block_id === selectedBlockId
  );

  if (!currentFeature) return null;

  const props = currentFeature.properties;
  const derivedStatus = getDerivedStatus(props);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    await addBlockIssue({
      block_id: props.block_id,
      issue_type: issueType,
      severity,
      description: description.trim(),
    });

    setDescription('');
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
              {props.block_id}
            </h2>
            <Badge status={derivedStatus} size="sm" />
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sequence #{props.sequence} · {props.length_m} meters
          </p>
        </div>

        <button
          onClick={() => setSelectedBlock(null)}
          aria-label="Close panel"
          className="p-1.5 rounded-full text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Block Signal & Track Telemetry Card */}
        <div className="p-3.5 rounded-2xl glass-card space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Signal className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
              <span>Signal Interlock</span>
            </span>
            <span className="font-mono font-medium text-ink dark:text-gray-200 flex items-center gap-1">
              <span>{props.start_signal}</span>
              <ArrowRight className="w-3 h-3 text-zinc-400" />
              <span>{props.end_signal}</span>
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-500 dark:text-zinc-400 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-emerald-500" />
              <span>Section Speed / Occupancy</span>
            </span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-ink dark:text-white">
                {props.max_speed_kmh || 130} km/h
              </span>
              <span className="capitalize text-zinc-500 dark:text-zinc-400">({props.occupancy})</span>
            </div>
          </div>

          {props.train_name && (
            <div className="pt-1.5 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-primary dark:text-primary-dark">
              <span className="font-medium">Active Train:</span>
              <span className="font-semibold">
                {props.train_id} - {props.train_name}
              </span>
            </div>
          )}
        </div>

        {/* Section 1: Existing Issues List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-300 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-primary dark:text-primary-dark" />
              <span>Existing Issues ({props.issues.length})</span>
            </h3>
            {props.issues.length > 1 && (
              <span className="text-[11px] text-amber-500 font-medium">Multiple simultaneous</span>
            )}
          </div>

          {props.issues.length === 0 ? (
            <div className="p-4 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center text-xs text-zinc-500 dark:text-zinc-400 glass-card">
              No active issues on this block. Track clear and signaling operational.
            </div>
          ) : (
            <div className="space-y-2">
              {props.issues.map((issue) => (
                <IssueCard
                  key={issue.issue_id}
                  issue={issue}
                  onResolve={(issueId) => resolveBlockIssue(props.block_id, issueId)}
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

            {/* Severity Selector */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as IssueSeverity[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeverity(level)}
                    className={`text-xs py-1.5 rounded-xl border font-medium capitalize transition-all select-none ${
                      severity === level
                        ? level === 'high'
                          ? 'bg-red-500/90 text-white border-red-600 shadow-sm'
                          : level === 'medium'
                          ? 'bg-amber-500/90 text-white border-amber-600 shadow-sm'
                          : 'bg-primary text-white border-primary shadow-sm'
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
              Submit Block Incident
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
