import { ActionIcon } from '@mantine/core';
import { IconEdit, IconSquareRoundedPlusFilled, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import { MantineReactTable, useMantineReactTable } from "mantine-react-table";
import { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { bikeName } from '../Bikes/helper';
import PartEditDialog from './PartEditDialog';
import { fetchPartsQuery } from "./api/fetchParts";
import { addPart, putPart, removePart } from "./api/mutatePart";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchPartsQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

const currentRelation = (relations) => {

  let currentRelation = null
  // when relation is open ended (null),
  // the part is currently in use, it should be the
  // most recent relation too

  relations && relations.forEach(relation => {
    if (!relation.validUntil) {
      currentRelation = relation
      return
    } else {
      var from = new Date(relation.validFrom)
      var until = new Date(relation.validUntil)
      var today = new Date()
      if (today >= from && today <= until) {
        currentRelation = relation
      }
    }
  });
  return currentRelation
}

const inUseAs = (relations) => {
  let relation = currentRelation(relations)
  return relation ? relation.partType.name : ''
}

const mostRecentRelation = (relations) => {

  let mostRecentRelation = null
  let mostRecentFrom = new Date('1970-01-01')
  // when relation is open ended (null),
  // the part is currently in use, it should be the
  // most recent relation too

  relations && relations.forEach(relation => {
    if (!relation.validUntil) {
      mostRecentRelation = relation
      return
    } else {
      var from = new Date(relation.validFrom)

      if (from > mostRecentFrom) {
        mostRecentRelation = relation
        mostRecentFrom = from
      }
    }
  });
  return mostRecentRelation
}

const lastUsedOn = (relations) => {
  let relation = mostRecentRelation(relations)
  return relation ? bikeName(relation.partType.bike) : ''
}

const PartList = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [partDialogVariant, setPartDialogVariant] = useState('add')
  const [partUnderEdit, setPartUnderEdit] = useState({})
  const {
    isError,
    isLoading,
    isFetching,
    data: parts,
  } = useQuery(fetchPartsQuery())

  const navigate = useNavigate()
  const queryClient = useQueryClient();

  const addPartMutation = useMutation({
    queryKey: ['part'],
    mutationFn: (part) => addPart(part),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parts'] }) }
  })
  const modifyPartMutation = useMutation({
    queryKey: ['part'],
    mutationFn: (part) => putPart(part.id, part),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parts'] }) }
    // ToDo close dialog on success
    // ToDo handle onError?
  })
  const removePartMutation = useMutation({
    queryKey: ['part'],
    mutationFn: (partId) => removePart(partId),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parts'] }) }
  })

  const handlePartSubmit = (part) => {
    (partDialogVariant === 'add') ? (
      addPartMutation.mutate(part)
    ) : (
      modifyPartMutation.mutate(part)
    )
    setPartDialogVariant('add')
    setPartUnderEdit({})
  }

  const handleRemovePart = (part) => {
    if ( !window.confirm(`Are you sure you want to delete Part(${part.name})?`)) {
      return
    }
    removePartMutation.mutate(part.id)
  }


  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name'
      },
      {
        accessorFn: (row) => (row.boughtAt ? dayjs(row.boughtAt).format('YYYY-MM-DD') : ''),
        header: 'Purchase Date'
      },
      {
        accessorFn: (row) => (row.retiredAt ? dayjs(row.retiredAt).format('YYYY-MM-DD') : ''),
        header: 'Retired Date'
      },
      {
        accessorFn: (row) => inUseAs(row.partTypeRelations),
        header: 'Currently In Use As'
      },
      {
        accessorFn: (row) => lastUsedOn(row.partTypeRelations),
        header: 'Last Used @'
      },
    ],
    []
  )

  const table = useMantineReactTable({
    columns,
    data: parts ?? [],
    enableGrouping: true,
    enablePagination: false,
    enableStickyHeader: true,
    mantineTableProps: { striped: true },
    mantineToolbarAlertBannerProps: isError
      ? {
          color: 'error',
          children: 'Error loading data',
        }
      : undefined,
    showSkeletons: true,
    state: {
      isLoading,
      showAlertBanner: isError,
      showProgressBars: isFetching,
    },
    mantineTableBodyRowProps: ({ row }) => ({
      onClick: () => { navigate("/parts/"+row.original.id) },
      sx: {
        cursor: 'pointer',
      },
    }),
    renderTopToolbarCustomActions: () => (
      <ActionIcon onClick={() => setCreateModalOpen(true)}>
        <IconSquareRoundedPlusFilled />
      </ActionIcon>
    ),
    enableRowActions: true,
    displayColumnDefOptions: {
        'mrt-row-actions': {
          Cell: ({ row }) => (<>
            <ActionIcon
          onClick={(e) => {
            e.stopPropagation()
            setPartDialogVariant('modify')
            setPartUnderEdit(row.original)
            setCreateModalOpen(true)
          }}><IconEdit />
        </ActionIcon>
        <ActionIcon
          onClick={(e) => {
            e.stopPropagation()
            handleRemovePart(row.original)
          }}><IconTrash />
        </ActionIcon>
            </>
          )
        }
      }

  })

  return (
    <>
      <PartEditDialog
        open={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false)
          setPartDialogVariant('add')
          setPartUnderEdit({})
        }}
        onSubmit={handlePartSubmit}
        variant={partDialogVariant}
        initialPart={partUnderEdit}
      />
      <MantineReactTable table={table} />
    </>
  )
}

export default PartList;
