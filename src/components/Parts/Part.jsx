import { Alert, Center, Loader, Title } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchPartQuery } from "./fetchParts";
import PartPartTypeRelationTable from "./PartPartTypeRelationTable";

export const loader = (queryClient) =>
  async ({params}) => {
    const query = fetchPartQuery(params.id)
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

const Part = () => {
  const params = useParams()
  // const [partTypeData, setPartTypeData] = useState([])
  const { status, data: part, error } = useQuery(fetchPartQuery(params.id))
  if (status === 'success') {
    console.log(part)
  }

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
        <>
          <Title order={3}>{part.name}</Title>
          <PartPartTypeRelationTable partTypeRelations={part.partTypeRelations} />
        </>
      )
      }
    </>
  )

}

export default Part;
