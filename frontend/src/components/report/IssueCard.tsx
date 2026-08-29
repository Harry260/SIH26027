import React from 'react';
import { Clock, User, Check, AlertTriangle, Flame, ShieldAlert } from 'lucide-react';
import { BlockIssue } from '../../types';
import { formatIssueTypeName, formatTimestamp, getSeverityBadgeColor } from '../../utils/formatters';
import { Button } from '../common/Button';

interface IssueCardProps {
  issue: BlockIssue;
  onResolve: (issueId: string) => void;
}

export const IssueCard: React.FC<IssueCardProps> = ({ issue, onResolve }) => {
  const badgeStyle = getSeverityBadgeColor(issue.severity);

  const getSeverityIcon = () => {
    switch (issue.severity) {
      case 'high':
        return <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />;
      case 'medium':
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
      case 'low':
        return <ShieldAlert className="w-3.5 h-3.5 text-blue-500 shrink-0" />;
    }
  };

  return (
    <div className="p-3.5 rounded-2xl glass-card transition-all space-y-2.5 text-ink dark:text-white">
      {/* Top: Issue Type & Severity */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium text-xs text-ink dark:text-gray-100">
          {getSeverityIcon()}
          <span>{formatIssueTypeName(issue.issue_type)}</span>
        </div>
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border backdrop-blur-md ${badgeStyle.bg} ${badgeStyle.text} ${badgeStyle.border}`}
        >
          {issue.severity} priority
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-normal">
        {issue.description}
      </p>

      {/* Metadata & Resolve Action */}
      <div className="flex items-center justify-between pt-1.5 border-t border-black/5 dark:border-white/10 text-[11px] text-zinc-500 dark:text-zinc-400">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1">
            <User className="w-3 h-3 text-zinc-400" />
            <span>{issue.reported_by}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{formatTimestamp(issue.timestamp)}</span>
          </span>
        </div>

        <Button
          variant="pearl"
          size="sm"
          onClick={() => onResolve(issue.issue_id)}
          className="text-xs px-2.5 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/30 gap-1 font-medium bg-emerald-500/10 dark:bg-emerald-500/15"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Resolve</span>
        </Button>
      </div>
    </div>
  );
};
