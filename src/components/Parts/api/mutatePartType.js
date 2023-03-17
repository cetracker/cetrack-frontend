import axios from 'axios';

export const putPartType = async (id, partType) => {
  const { data } = await axios.put(
    `/partTypes/${id}`, partType
  );
  return data;
}

export const addPartType = async (partType) => {
  const { data } = await axios.post(
    `/partTypes`, partType
  );
  return data;
}
