import { Table } from "@mantine/core";
import { DatePicker } from "@mantine/dates";
import PartTypeSelector from "./PartTypeSelector";

var lastBike = ''
const bikeName = (bikeObj) => {
  const manufacturer = (bikeObj.manufacturer) ? bikeObj.manufacturer : '-'
  const model = (bikeObj.model) ? bikeObj.model : '-'
  const bike = manufacturer + " " + model
  lastBike = bike
  return bike
}

const PartPartTypeRelationTable = ({partTypeRelations}) => {
    return (
    <>
      {partTypeRelations.length === 0 ? (
        <></>
      ) : (
        <>
          <Table striped>
            <thead>
              <tr>
                <th>Parttype Name</th>
                <th>Bike</th>
                <th>valid from</th>
                <th>valid until</th>
              </tr>
            </thead>
            <tbody>
            { partTypeRelations.map( (relation) =>
              <tr key={relation.partType.id} >
                <td>{relation.partType.name}</td>
                <td>{bikeName(relation.partType.bike)}</td>
                <td>{relation.validFrom}</td>
                <td>{relation.validUntil}</td>
              </tr>
            )}
              <tr>
                <td><PartTypeSelector /></td>
                <td>{lastBike}</td>
                <td><DatePicker /></td>
                <td><DatePicker /></td>
              </tr>
            </tbody>
          </Table>
        </>
      )
      }
    </>
    )
}

export default PartPartTypeRelationTable;
