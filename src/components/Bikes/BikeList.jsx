import { Alert, Center, Loader, Table } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import fetchBikesQuery from "./fetchBikes";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchBikesQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }


const BikeList = () => {
  const {
    status,
    error,
    data: bikes,
  } = useQuery(fetchBikesQuery())

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
              <th>Manufacturer</th>
              <th>Model</th>
              <th>Purchase Date</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
          { bikes.map((bike) => (
            <tr key={bike.id}>
              <td>{bike.manufacturer}</td>
              <td>{bike.model}</td>
              <td>{bike.boughtAt}</td>
              <td>{bike.id}</td>
            </tr>
          ))}
          </tbody>
        </Table>
      )
      }
    </>
  )
}

export default BikeList;
