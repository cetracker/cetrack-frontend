import { Alert, Badge, Center, Loader, Title } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { bikeName } from "../Bikes/helper";
import { fetchPartTypeQuery } from "./api/fetchPartTypes";
import PartTypeRelationTable from "./PartTypeRelationTable";

export const loader = (queryClient) =>
  async ({params}) => {
    const query = fetchPartTypeQuery(params.id)
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

const PartType = () => {
  const params = useParams()
  const { isLoading, isError, data: partType, error } = useQuery(fetchPartTypeQuery(params.id))

  return (
    <>
      { isLoading ? (
        <Center>
          <Loader variant="dots"/>
        </Center>
      ) : isError ? (
        <Center>
          <Alert icon={<IconAlertCircle size={16} />} title="Error!" color="red" variant="outline">
            {error.message}
          </Alert>
        </Center>
      ) : (
        <>
          <Title order={3}>{partType.name}</Title>
          <Badge size="lg" radius="xs" variant="outline">
            {partType.bike ? bikeName(partType.bike) : 'Not related to any bike'}
          </Badge>
          <PartTypeRelationTable
            partTypeRelations={partType.partTypeRelations}
          />
        </>
      )
      }
    </>
  )

}

export default PartType;
