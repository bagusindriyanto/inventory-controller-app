import { ArrowDownIcon, ArrowUpIcon, ArrowUpDownIcon } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export default function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc')
    return <ArrowUpIcon size={12} className="inline ml-1" />;
  if (direction === 'desc')
    return <ArrowDownIcon size={12} className="inline ml-1" />;
  return <ArrowUpDownIcon size={12} className="inline ml-1 opacity-30" />;
}
