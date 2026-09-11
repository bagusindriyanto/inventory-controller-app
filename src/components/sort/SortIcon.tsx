import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

export type SortDirection = 'asc' | 'desc' | null;

export default function SortIcon({ direction }: { direction: SortDirection }) {
  if (direction === 'asc') return <ArrowUp size={12} className="inline ml-1" />;
  if (direction === 'desc')
    return <ArrowDown size={12} className="inline ml-1" />;
  return <ArrowUpDown size={12} className="inline ml-1 opacity-30" />;
}
