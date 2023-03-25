import axios from 'axios';

export const putPart = async (id, part) => {
  const { data } = await axios.put(
    `/parts/${id}`, part
  );
  return data;
}

export const addPart = async (part) => {
  const { data } = await axios.post(
    `/parts`, part
  );
  return data;
}

export const removePart = async (partId) => {
  const { data } = await axios.delete(
    `/parts/${partId}`
  );
  return data;
}

export const relatePart = async (id, relation) => {
  const { data } = await axios.post(
    `/parts/${id}/action/relate`, relation
  );
  return data;
}
