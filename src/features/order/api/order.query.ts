import { useQuery } from '@tanstack/react-query';
import { fetchOrder } from './order.api';

export const useFetchOrder = () =>
  useQuery({
    queryKey: ['order'],
    queryFn: fetchOrder,
  });
