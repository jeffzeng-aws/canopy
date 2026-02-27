import type { IssueType, Priority } from '@canopy/shared';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export const issueTypeConfig: Record<string, { color: string; icon: string; label: string }> = {
  Epic: { color: '#9B59B6', icon: '⚡', label: 'Epic' },
  Story: { color: '#40916C', icon: '📖', label: 'Story' },
  Bug: { color: '#BC6C25', icon: '🐛', label: 'Bug' },
  Task: { color: '#2196F3', icon: '☑️', label: 'Task' },
  'Sub-task': { color: '#8896A6', icon: '📋', label: 'Sub-task' },
};

export const priorityConfig: Record<string, { color: string; icon: string; label: string }> = {
  Highest: { color: '#BC6C25', icon: '⬆⬆', label: 'Highest' },
  High: { color: '#E9C46A', icon: '⬆', label: 'High' },
  Medium: { color: '#40916C', icon: '➡', label: 'Medium' },
  Low: { color: '#2196F3', icon: '⬇', label: 'Low' },
  Lowest: { color: '#8896A6', icon: '⬇⬇', label: 'Lowest' },
};

export const statusConfig: Record<string, { color: string; bg: string; label: string; category: string }> = {
  todo: { color: '#8896A6', bg: '#f0ede8', label: 'To Do', category: 'todo' },
  'in_progress': { color: '#2196F3', bg: '#e3f2fd', label: 'In Progress', category: 'in_progress' },
  'in_review': { color: '#E9C46A', bg: '#fef9e7', label: 'In Review', category: 'in_progress' },
  done: { color: '#40916C', bg: '#e8f5e9', label: 'Done', category: 'done' },
};

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function generateColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = ['#1B4332', '#2D6A4F', '#40916C', '#52796F', '#D4A373', '#BC6C25', '#9B59B6', '#2196F3'];
  return colors[Math.abs(hash) % colors.length];
}
