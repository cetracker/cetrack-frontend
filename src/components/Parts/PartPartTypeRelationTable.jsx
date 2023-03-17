import { ActionIcon } from "@mantine/core";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";
import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useRef, useState } from "react";
import { bikeName } from "../Bikes/helper";
import AddRelationDialog from "./AddRelationDialog";

const modifiedRelation = {
  partTypeId: 'f4e07039-d3cd-4f46-95c5-678f4926c226',
  validFrom: '2023-03-01T22:00:00+01',
  validUntil: null,
  partType: {
    id: 'f4e07039-d3cd-4f46-95c5-678f4926c226',
    name: 'Tretkurbel'
  }
}

const PartPartTypeRelationTable = ({ partTypeRelations, addRelation, modifyRelations }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const tableInstanceRef = useRef(null);

  const handleAddRelation = (values) => {
    addRelation(values)
  };

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
      <>
        <AddRelationDialog
              open={createModalOpen}
              onClose={() => setCreateModalOpen(false)}
              onSubmit={handleAddRelation}
              latestRelation={
                (partTypeRelations  && partTypeRelations.length > 0) ?
                  partTypeRelations[partTypeRelations.length - 1] : {}
              }
        />
        <MantineReactTable
          columns={columns}
          data={partTypeRelations ?? []}
          renderBottomToolbarCustomActions={() => (
            <ActionIcon onClick={() => setCreateModalOpen(true)}>
              <IconSquareRoundedPlusFilled />
            </ActionIcon>
          )}
          enablePagination={false}
          tableInstanceRef={tableInstanceRef}
        />
      </>
    )
}

export default PartPartTypeRelationTable;
