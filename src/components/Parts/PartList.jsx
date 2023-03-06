import { Alert, Center, Loader, Table } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query'
import fetchPartsQuery from "./fetchParts";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchPartsQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }


const PartList = () => {
  const {
    status,
    error,
    data: parts,
  } = useQuery(fetchPartsQuery())
  console.log(parts)

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
              <th>Name</th>
              <th>Purchase Date</th>
              <th>Id</th>
            </tr>
          </thead>
          <tbody>
          { parts.map((part) => (
            <tr key={part.id}>
              <td>{part.name}</td>
              <td>{part.boughtAt}</td>
              <td>{part.id}</td>
            </tr>
          ))}
          </tbody>
        </Table>
      )
      }
    </>
  )
}

export default PartList;
