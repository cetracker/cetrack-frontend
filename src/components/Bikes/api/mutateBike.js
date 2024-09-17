import axios from 'axios';

export const addBike = async (bike) => {
  const { data } = await axios.post(
    `/bikes`, bike
  );
  return data;
}

export const putBike = async (id, bike) => {
  const { data } = await axios.put(
    `/bikes/${id}`, bike
  );
  return data;
}

export const removeBike = async (bikeId) => {
  const { data } = await axios.delete(
    `/bikes/${bikeId}`
  );
  return data;
}
