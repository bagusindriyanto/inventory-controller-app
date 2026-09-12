import { RefreshCwIcon } from 'lucide-react';
import { Button } from './ui/button';
import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function RefreshToggle() {
  const queryClient = useQueryClient();
  const isFetching = useIsFetching();

  return (
    <div className="flex gap-2 items-center">
      {!!isFetching && (
        <p className="text-xs text-white shimmer">Memperbarui Data...</p>
      )}
      <Button
        variant="secondary"
        size="icon-sm"
        onClick={() => queryClient.invalidateQueries()}
        disabled={!!isFetching}
        title="Refresh Data"
      >
        <RefreshCwIcon className={cn({ 'animate-spin': !!isFetching })} />
      </Button>
    </div>
  );
}
