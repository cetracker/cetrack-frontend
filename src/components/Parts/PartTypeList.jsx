import { ActionIcon } from '@mantine/core';
import { IconEdit, IconSquareRoundedPlusFilled, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useState } from 'react';
import { bikeName } from '../Bikes/helper';
import { fetchPartTypesQuery } from "./api/fetchPartTypes";
import { addPartType, deletePartType, putPartType } from "./api/mutatePartType";
import PartTypeEditDialog from './PartTypeEditDialog';

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchPartTypesQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

  const PartTypeList = () => {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [partTypeDialogVariant, setPartTypeDialogVariant] = useState('')
    const [partTypeUnderEdit, setPartTypeUnderEdit] = useState({})

    const {
      isError,
      isLoading,
      isFetching,
      isSuccess,
      data: partTypes,
    } = useQuery(fetchPartTypesQuery())

    const queryClient = useQueryClient();

    const addPartTypeMutation = useMutation({
      queryKey: ['parttype'],
      mutationFn: (partType) => addPartType(partType),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parttypes'] }) }
    })
    const modifyPartTypeMutation = useMutation({
      queryKey: ['parttype'],
      mutationFn: (partType) => putPartType(partType.id, partType),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parttypes'] }) }
    })
    const removePartTypeMutation = useMutation({
      queryKey: ['parttype'],
      mutationFn: (id) => deletePartType(id),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parttypes'] }) }
    })

    const handlePartTypeSubmit = (partType) => {
      (partTypeDialogVariant === 'add') ? (
        addPartTypeMutation.mutate(partType)
      ) : (
        modifyPartTypeMutation.mutate(partType)
      )
        setPartTypeUnderEdit({})
      }

    const handleRemovePartType = (partType) => {
      if (
        !window.confirm(`Are you sure you want to delete Parttype: ${partType.name}(${bikeName(partType.bike)})?`)
      ) {
        return
      }
      removePartTypeMutation.mutate(partType.id)
    }

      const columns = useMemo(
      () => [
        {
          accessorKey: 'name',
          header: 'Part Type'
        },
        {
          accessorFn: (row) => bikeName(row.bike),
          header: 'Bike'
        },
        {
          accessorKey: 'id',
          header: 'Id'
        },
      ],
      []
    )

    return (
      <>
        {isSuccess && (
          <PartTypeEditDialog
            open={createModalOpen}
            onClose={() => {
              setCreateModalOpen(false)
              setPartTypeDialogVariant('add')
              setPartTypeUnderEdit(
                (partTypes && partTypes.length > 0) ?
                    partTypes[partTypes.length - 1] : {})
              }}
            onSubmit={handlePartTypeSubmit}
            variant={partTypeDialogVariant}
            initialPartType={partTypeUnderEdit}
          />
        )}
        <MantineReactTable
          columns={columns}
          data={partTypes ?? []}
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
          renderTopToolbarCustomActions={() => (
            <ActionIcon onClick={() => {
                setCreateModalOpen(true)
                setPartTypeDialogVariant('add')
                setPartTypeUnderEdit(
                (partTypes && partTypes.length > 0) ?
                    partTypes[partTypes.length - 1] : {})
              }
            }>
              <IconSquareRoundedPlusFilled />
            </ActionIcon>
          )}
          showSkeletons={true}
          state={{
            isLoading,
            showAlertBanner: isError,
            showProgressBars: isFetching,
          }}
          enableRowActions
          displayColumnDefOptions={{
              'mrt-row-actions': {
                Cell: ({ row }) => (<>
                  <ActionIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      setPartTypeDialogVariant('modify')
                      setPartTypeUnderEdit(row.original)
                      setCreateModalOpen(true)
                    }}><IconEdit/>
                  </ActionIcon>
                  <ActionIcon
                    onClick={(e) => {
                      e.stopPropagation()
                      handleRemovePartType(row.original)
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

export default PartTypeList;
