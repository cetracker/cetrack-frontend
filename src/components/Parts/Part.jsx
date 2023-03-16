import { Alert, Center, Loader, Title } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { fetchPartQuery } from "./fetchParts";
import { putPart, relatePart } from "./mutatePart";
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
  const { isLoading, isError, data: part, error } = useQuery(fetchPartQuery(params.id))

  const queryClient = useQueryClient();

  const mutatePart = useMutation({
    queryKey: ['part'],
    mutationFn: (muatedPart) => putPart(part.id, muatedPart),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['posts', 'detail', part.id] }) }
  })

  const addRelation = useMutation({
    queryKey: ['part', 'relation'],
    mutationFn: (relation) => relatePart(part.id, relation),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['posts', 'detail', part.id] }) }
  })

  const addPartPartTypeRelation = (relation) => {
    addRelation.mutate({ ...relation, 'partId': part.id })
  }

  const modifyPartPartTypeRelation = (relation) => {
    let completedRelation = { ...relation, 'partId': part.id }
    let mutatedPart = { ...part, 'partTypeRelations': [...part.partTypeRelations, completedRelation] }
    // console.info(`M-PART: ${JSON.stringify(mutatedPart, null, 2)}`)
    mutatePart.mutate(mutatedPart)
  }

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
          <Title order={3}>{part.name}</Title>
          <PartPartTypeRelationTable
            partTypeRelations={part.partTypeRelations}
            addRelation={addPartPartTypeRelation}
            modifyRelations={modifyPartPartTypeRelation}
          />
        </>
      )
      }
    </>
  )

}

export default Part;
