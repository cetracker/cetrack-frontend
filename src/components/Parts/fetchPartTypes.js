import axios from 'axios';

/*
 * Fetch all PartTypes
 */
const getPartTypes = async () => {
  const { data } = await axios.get(
    `/partTypes`
  );
  return data;
}

export const fetchPartTypesQuery = () => ({
  queryKey: ['parttypes'],
  queryFn: getPartTypes
})


/*
 * Fetch specific PartType (by it's id)
 */
const getPartType = async (id) => {
  const { data } = await axios.get(
    `/partTypes/${id}`
  );
  return data;
}

export const fetchPartQuery = (id) => ({
  queryKey: ['parttype', 'detail', id],
  queryFn: () => getPartType(id)
})
