import axios from 'axios';

const getParts = async () => {
  const { data } = await axios.get(
    `/parts`
  );
  return data;
}


// ⬇️ define your query
const fetchPartsQuery = () => ({
  queryKey: ['parts'],
  queryFn: getParts
})

export default fetchPartsQuery;
