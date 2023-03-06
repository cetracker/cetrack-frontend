import { Alert, Center, Loader, Table } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query'
import fetchPartTypesQuery from "./fetchPartTypes";


// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchPartTypesQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }


const PartTypeList = () => {
    const {
      status,
      error,
      data: partTypes,
    } = useQuery(fetchPartTypesQuery())

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
                <th>Id</th>
              </tr>
            </thead>
            <tbody>
            { partTypes.map((partType) => (
              <tr key={partType.id}>
                <td>{partType.name}</td>
                <td>{partType.id}</td>
              </tr>
            ))}
            </tbody>
          </Table>
        )
        }
      </>
    )
  }

export default PartTypeList;
