import { IssueSeverity, IssueType } from '../types';

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

export function formatIssueTypeName(type: IssueType | string): string {
  switch (type) {
    case 'obstruction':
      return 'Track Obstruction';
    case 'signal_fault':
      return 'Signal & Interlock Fault';
    case 'speed_restriction':
      return 'Speed Restriction (TSR)';
    case 'maintenance':
      return 'Track Maintenance Block';
    case 'other':
      return 'Operational Incident';
    default:
      return type;
  }
}

export function getSeverityBadgeColor(severity: IssueSeverity): { bg: string; text: string; border: string } {
  switch (severity) {
    case 'high':
      return {
        bg: 'bg-red-500/15 dark:bg-red-500/25',
        text: 'text-red-600 dark:text-red-400',
        border: 'border-red-500/30',
      };
    case 'medium':
      return {
        bg: 'bg-amber-500/15 dark:bg-amber-500/25',
        text: 'text-amber-600 dark:text-amber-400',
        border: 'border-amber-500/30',
      };
    case 'low':
      return {
        bg: 'bg-blue-500/15 dark:bg-blue-500/25',
        text: 'text-blue-600 dark:text-blue-400',
        border: 'border-blue-500/30',
      };
  }
}

