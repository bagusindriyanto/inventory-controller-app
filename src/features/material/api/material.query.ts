import { useQuery } from '@tanstack/react-query';
import { fetchMaterial } from './material.api';

export const useFetchMaterial = () =>
  useQuery({
    queryKey: ['material'],
    queryFn: fetchMaterial,
  });
