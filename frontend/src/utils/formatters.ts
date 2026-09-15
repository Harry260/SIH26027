import { IssueSeverity, IssueType, Time } from '../types';

export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch {
    return isoString;
  }
}

/**
 * Formats relative Time (minutes from midnight 0-1440) as HH:MM AM/PM
 */
export function formatTime(minutes: Time): string {
  const normalized = Math.max(0, minutes % 1440);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  const displayMins = mins.toString().padStart(2, '0');
  return `${displayHours}:${displayMins} ${period}`;
}

/**
 * Formats relative Time in 24h format HH:MM
 */
export function formatTime24h(minutes: Time): string {
  const normalized = Math.max(0, minutes % 1440);
  const hours = Math.floor(normalized / 60).toString().padStart(2, '0');
  const mins = (normalized % 60).toString().padStart(2, '0');
  return `${hours}:${mins}`;
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
