import { ActionIcon } from "@mantine/core";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";
import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from "react";

var lastBike = ''
const bikeName = (bikeObj) => {
  const manufacturer = (bikeObj.manufacturer) ? bikeObj.manufacturer : '-'
  const model = (bikeObj.model) ? bikeObj.model : '-'
  const bike = manufacturer + " " + model
  lastBike = bike
  return bike
}

const PartPartTypeRelationTable = ({partTypeRelations}) => {

  const columns = useMemo(
    () => [
        {
          accessorKey: 'partType.name',
          header: 'Part Type'
        },
        {
          accessorFn: (row) => bikeName(row.partType.bike),
          header: "Bike"
        },
        {
          accessorFn: (row) => dayjs(row.validFrom).format('YYYY-MM-DD'),
          header: 'Valid From'
        },
        {
          accessorFn: (row) => (row.validUntil ? dayjs(row.validUntil).format('YYYY-MM-DD HH:mm') : ''),
          header: 'Valid Until'
        }
    ],
    []
  )
    return (
      <MantineReactTable
        columns={columns}
        data={partTypeRelations ?? []}
        renderBottomToolbarCustomActions={() => (
          <ActionIcon onClick={() => console.log("Action!")}>
            <IconSquareRoundedPlusFilled />
          </ActionIcon>
        )}
        enablePagination={false}
      />
    )
}

export default PartPartTypeRelationTable;
