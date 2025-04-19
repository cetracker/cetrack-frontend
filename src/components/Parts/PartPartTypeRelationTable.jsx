import { ActionIcon } from "@mantine/core";
import { IconEdit, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import dayjs from "dayjs";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import { useMemo, useState } from "react";
import { compareDates } from "../../helper/dateCompare";
import { bikeName } from "../Bikes/helper";
import RelationEditDialog from "./RelationEditDialog";

const PartPartTypeRelationTable = ({ partTypeRelations, addRelation, modifyRelations }) => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [relationDialogVariant, setRelationDialogVariant] = useState('add')
  const [relationForModal, setRelationForModal] = useState({})
  const [rowIdCurrentlyModifying, setRowIdCurrentlyModifying] = useState(-1)

  const handleOnSubmitRelation = (values) => {
    if(relationDialogVariant === 'add') {
      addRelation(values)
    } if(relationDialogVariant === 'modify') {
      handleModifyRelation(values)
    }
  }

  const handleRemoveRelation = (rowId) => {
    const reducedRelations = table.getRowModel().rows.filter( (row) =>(
      row.id !== rowId
    )).map((row) => row.original)
    modifyRelations(reducedRelations)
  }

  const handleModifyRelation = (values) => {
    const modifiedRelations = table.getRowModel().rows.map( (row) => (
          row.id !== rowIdCurrentlyModifying ? row.original : (values)
    ))
    modifyRelations(modifiedRelations)
    setRowIdCurrentlyModifying(-1)
  }

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
    renderBottomToolbarCustomActions: () => (
      <ActionIcon onClick={() => {
        setRelationForModal(
          (partTypeRelations  && partTypeRelations.length > 0) ?
            partTypeRelations[partTypeRelations.length - 1]
          : {}
        )
        setRelationDialogVariant('add')
        setCreateModalOpen(true)
      }}>
        <IconSquareRoundedPlusFilled />
      </ActionIcon>
    ),
    displayColumnDefOptions: {
      'mrt-row-actions': {
        Cell: ({ cell, row, table }) => (<>
          <ActionIcon
        onClick={() => {
          setRowIdCurrentlyModifying(row.id)
          setRelationDialogVariant('modify')
          setRelationForModal(row.original)
          setCreateModalOpen(true)
        }}><IconEdit />
      </ActionIcon>
      <ActionIcon
        onClick={() => {
          handleRemoveRelation(row.id)
        }}><IconTrash />
      </ActionIcon>
          </>
        )
      }
    },
    enableSorting: true,
    enablePagination: false,
    enableRowActions: true,
    enableEditing: false,
    renderRowActionMenuItems: ({ row }) => [ ],
  });
    return (
      <>
        <RelationEditDialog
              open={createModalOpen}
              variant={relationDialogVariant}
              onClose={() => {
                setRowIdCurrentlyModifying(-1)
                setRelationForModal((partTypeRelations  && partTypeRelations.length > 0) ?
            partTypeRelations[partTypeRelations.length - 1] : {})
                setCreateModalOpen(false)
              }}
              onSubmit={handleOnSubmitRelation}
              initialRelation={relationForModal}
        />
        <MantineReactTable table={table} />
      </>
    )
}

export default PartPartTypeRelationTable;
