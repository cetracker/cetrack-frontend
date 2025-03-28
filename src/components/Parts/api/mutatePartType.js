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

  export const deletePartType = async (id) => {
  const { data } = await axios.delete(
    `/partTypes/${id}`
  );
  return data;
}
