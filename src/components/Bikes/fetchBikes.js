import axios from 'axios';

const getBikes = async () => {
  const { data } = await axios.get(
    `/bikes`
  );
  return data;
}


// ⬇️ define your query
const fetchBikesQuery = () => ({
  queryKey: ['bikes'],
  queryFn: getBikes
})

export default fetchBikesQuery;
