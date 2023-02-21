import { Alert, Center, Loader, Table } from "@mantine/core";
import { IconAlertCircle } from '@tabler/icons-react';
import useParts from "../../hooks/useParts";


const PartList = () => {
  const {
    status,
    error,
    data: parts,
  } = useParts()
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
              <th>Id</th>
              <th>Name</th>
            </tr>
          </thead>
          <tbody>
          { parts.parts.map((part) => (
            <tr key={part.id}>
              <td>{part.id}</td>
              <td>{part.name}</td>
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
