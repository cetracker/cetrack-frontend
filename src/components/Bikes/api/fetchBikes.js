import axios from 'axios';

export const getBikes = async () => {
  const { data } = await axios.get(
    `/bikes`
  );
  return data;
}


// ⬇️ define your query
export const fetchBikesQuery = () => ({
  queryKey: ['bikes'],
  queryFn: getBikes
})

export default fetchBikesQuery;
