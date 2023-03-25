import axios from 'axios';

export const putPartType = async (id, partType) => {
  console.log('ID:', id)
  console.log('PT:', partType)
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
  console.log('ID:', id)
  const { data } = await axios.delete(
    `/partTypes/${id}`
  );
  return data;
}
