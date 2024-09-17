import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from "react";

const PartTypeRelationTable = ({ partTypeRelations, addRelation, modifyRelations }) => {

  const columns = useMemo(
    () => [
        {
          accessorKey: 'part.name',
          header: 'Part'
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
        enablePagination={false}
        enableEditing={false}
        initialState={{
          density: 'sm',
          sorting: [
            { id: 'Valid From', asc: true }
          ],
        }}
      />
    )
}

export default PartTypeRelationTable;
