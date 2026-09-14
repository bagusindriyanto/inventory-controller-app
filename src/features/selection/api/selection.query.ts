import { useQuery } from '@tanstack/react-query';
import { fetchSelection } from './selection.api';

export const useFetchSelection = () =>
  useQuery({
    queryKey: ['selection'],
    queryFn: fetchSelection,
  });
