import axios from 'axios';

const getPartTypes = async () => {
  const { data } = await axios.get(
    `/partTypes`
  );
  return data;
}


// ⬇️ define your query
const fetchPartTypesQuery = () => ({
  queryKey: ['parttypes'],
  queryFn: getPartTypes
})

export default fetchPartTypesQuery;
