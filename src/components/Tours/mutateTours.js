import axios from 'axios';

const importMyTourBookTours = async (tours) => {
  const { data } = await axios.post(
    `/tours/import`, tours
  );
  return data;
}

export default importMyTourBookTours;
