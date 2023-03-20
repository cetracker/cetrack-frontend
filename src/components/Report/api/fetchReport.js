import axios from 'axios';

const getReport = async () => {
  const { data } = await axios.get(
    `/parts/report`
  );
  return data;
}

export const fetchReportQuery = () => ({
  queryKey: ['report'],
  queryFn: getReport
})

export default fetchReportQuery;
