import { ActionIcon } from "@mantine/core";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import { useMemo, useState } from "react";
import { compareDates } from "../../helper/dateCompare";
import { relatePart } from "./api/mutatePart";
import RelationEditDialog from "./RelationEditDialog";

const PartTypeRelationTable = ({ partTypeRelations }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [relationForModal, setRelationForModal] = useState({})
  const [parttypeId, setParttypeId] = useState('')

  const queryClient = useQueryClient();

  const addRelation = useMutation({
    queryKey: ['part', 'relation'],
    mutationFn: (relation) => relatePart(relation.part.id, relation),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parttype', 'detail', parttypeId] }) }
  })

  const addPartPartTypeRelation = (relation) => {
    setParttypeId(relation.partTypeId)
    addRelation.mutate(relation)
  }

  const columns = useMemo(
    () => [
        {
          accessorKey: 'part.name',
          header: 'Part'
        },
        {
          accessorFn: (row) => dayjs(row.validFrom).format('YYYY-MM-DD'),
          sortingFn: 'datetime',
          header: 'Valid From'
        },
        {
          accessorFn: (row) => (row.validUntil ? dayjs(row.validUntil).format('YYYY-MM-DD HH:mm') : ''),
          sortingFn: 'dateSorting',
          header: 'Valid Until'
        }
    ],
    []
  )

  const table = useMantineReactTable({
    columns,
    data: partTypeRelations ?? [],
    sortingFns: {
        dateSorting: (rowA, rowB, columnId) => compareDates(rowA.getValue(columnId), rowB.getValue(columnId))
    },
    initialState: {
      density: 'sm',
      sorting: [
        { id: 'Valid From', asc: true }
      ],
    },
    displayColumnDefOptions: {
      'mrt-row-actions': {
        Cell: ({ cell, row, table }) => (
          <ActionIcon
            onClick={() => {
              setRelationForModal(row.original)
              setCreateModalOpen(true)
            }}><IconSquareRoundedPlusFilled />
          </ActionIcon>
        )
      }
    },
    enablePagination: false,
    enableRowActions: true,
    enableEditing: false,
    renderRowActionMenuItems: ({ row }) => [ ],
  });
    return (
      <>
        <RelationEditDialog
          open={createModalOpen}
          variant={'add'}
          onClose={() => {
            setRelationForModal((partTypeRelations && partTypeRelations.length > 0) ?
                    partTypeRelations[partTypeRelations.length - 1] : {})
            setCreateModalOpen(false)
          }}
          onSubmit={addPartPartTypeRelation}
          initialRelation={relationForModal}
        />
        <MantineReactTable table={table} />
      </>
    )
}

export default PartTypeRelationTable;
