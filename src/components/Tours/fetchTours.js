import axios from 'axios';

const getTours = async () => {
  const { data } = await axios.get(
    `/tours`
  );
  return data;
}


// ⬇️ define your query
const fetchToursQuery = () => ({
  queryKey: ['tours'],
  queryFn: getTours,
  useErrorBoundary: true,
})

export default fetchToursQuery;
