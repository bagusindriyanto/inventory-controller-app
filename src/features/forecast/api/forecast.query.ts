import { useQuery } from '@tanstack/react-query';
import { fetchForecast } from './forecast.api';

export const useFetchForecast = () =>
  useQuery({
    queryKey: ['forecast'],
    queryFn: fetchForecast,
  });
