import { ActionIcon } from '@mantine/core';
import { IconEdit, IconSquareRoundedPlusFilled, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
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

const inUseAs = (relations) => {
  let usage = ''
  relations && relations.forEach(relation => {
    // when relation is open ended (null),
    // the part is currently in use

    if (!relation.validUntil) {
      usage = relation.partType.name
    } else {
      var from = new Date(relation.validFrom)
      var until = new Date(relation.validUntil)
      var today = new Date()
      if (today >= from && today <= until) {
        usage = relation.partType.name
      }
    }
  });
  return usage;
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
      }
    ],
    []
  )

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
      <MantineReactTable
        columns={columns}
        data={parts ?? []}
        enablePagination={false}
        enableStickyHeader
        mantineTableProps={{
          striped: true
        }}
        mantineToolbarAlertBannerProps={
        isError
          ? {
              color: 'error',
              children: 'Error loading data',
            }
          : undefined
        }
        showSkeletons={true}
        state={{
          isLoading,
          showAlertBanner: isError,
          showProgressBars: isFetching,
        }}
        mantineTableBodyRowProps={({ row }) => ({
          onClick: () => { navigate("/parts/"+row.original.id) },
          sx: {
            cursor: 'pointer',
          },
        })}
        renderTopToolbarCustomActions={() => (
          <ActionIcon onClick={() => setCreateModalOpen(true)}>
            <IconSquareRoundedPlusFilled />
          </ActionIcon>
        )}
        enableRowActions
        displayColumnDefOptions={{
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
          }}
      />
    </>
  )
}

export default PartList;
