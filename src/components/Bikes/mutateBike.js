import axios from 'axios';

export const addBike = async (bike) => {
  const { data } = await axios.post(
    `/bikes`, bike
  );
  return data;
}
