import axios from 'axios';

const getParts = async () => {
  const { data } = await axios.get(
    `/parts`
  );
  return data;
}


// ⬇️ define your query
export const fetchPartsQuery = () => ({
  queryKey: ['parts'],
  queryFn: getParts
})

const getPart = async (id) => {
  const { data } = await axios.get(
    `/parts/${id}`
  );
  return data;
}


// ⬇️ define your query
export const fetchPartQuery = (id) => ({
  queryKey: ['part', 'detail', id],
  queryFn: () => getPart(id)
})
