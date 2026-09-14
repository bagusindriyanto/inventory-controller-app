import { useQuery } from '@tanstack/react-query';
import { fetchStock } from './stock.api';

export const useFetchStock = () =>
  useQuery({
    queryKey: ['stock'],
    queryFn: fetchStock,
  });
