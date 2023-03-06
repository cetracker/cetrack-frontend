import { Alert, Center, Loader, Table } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import fetchToursQuery from "./fetchTours";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchToursQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }


const TourList = () => {
  const {
    status,
    error,
    data: tours,
  } = useQuery(fetchToursQuery())

  return (
    <>
      {status === 'loading' ? (
        <Center>
          <Loader variant="dots"/>
        </Center>
      ) : status === 'error' ? (
        <Center>
          <Alert icon={<IconAlertCircle size={16} />} title="Error!" color="red" variant="outline">
            {error.message}
          </Alert>
        </Center>
      ) : (
        <Table striped>
          <thead>
            <tr>
              <th>Title</th>
              <th>Distance</th>
              <th>Moving</th>
              <th>Started</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
          { tours.map((tour) => (
            <tr key={tour.id}>
              <td>{tour.title}</td>
              <td>{tour.distance}</td>
              <td>{tour.durationMoving}</td>
              <td>{tour.startedAt}</td>
              <td>{tour.id}</td>
            </tr>
          ))}
          </tbody>
        </Table>
      )
      }
    </>
  )
}

export default TourList;
