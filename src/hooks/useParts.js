/* obsolete after adding react-router - deprecated */

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const fetchParts = async () => {
  const { data } = await axios.get(
    `/api/parts/`
  );
  return data;
}


export default function useParts() {
  return useQuery({
    queryKey: ['parts'],
    queryFn: fetchParts
  })
}
