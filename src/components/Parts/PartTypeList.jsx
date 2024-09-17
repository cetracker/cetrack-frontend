import { ActionIcon, Checkbox } from '@mantine/core';
import { IconEdit, IconSquareRoundedPlusFilled, IconTrash } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import { bikeName } from '../Bikes/helper';
import PartTypeEditDialog from './PartTypeEditDialog';
import { fetchPartTypesQuery } from "./api/fetchPartTypes";
import { addPartType, deletePartType, putPartType } from "./api/mutatePartType";

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

  const currentlyUsedPart = (relations) => {
    let usage = ''
    // check if a /valid/ relation is defined first
    if(!validateRelations(relations)) return usage;

    relations && relations.forEach(relation => {
      // when relation is open ended (null),
      // the part is currently in use
      if (!relation.validUntil) {
        usage = relation.part.name
      } else {
        var from = new Date(relation.validFrom)
        var until = new Date(relation.validUntil)
        var today = new Date()
        if (today >= from && today <= until) {
          usage = relation.part.name
        }
      }
    });
    return usage;
  }

  // ToDo relation list need to be sorted
  const validateRelations = (relations) => {
    var lastRelation = null
    var isValid = false
    relations && relations.forEach( relation => {
      if (!relation.validUntil) {
        if(!lastRelation) {
          lastRelation = relation
          isValid = true
        } else {
          // more than one open ended relations discovered!
          isValid = false
          // return false; // not working
        }
      } else {
        const from = new Date(relation.validFrom)
        if(lastRelation) {
          const lastUntil = new Date(lastRelation.validUntil)
          if(from > lastUntil) {
            isValid = true
          } else {
            // valid range is overlapping?
            isValid = false
          }
        }
      }
    });
    return isValid;
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

    const navigate = useNavigate()
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
          header: 'Part Type',
          id: 'name'
        },
        {
          accessorKey: 'mandatory',
          header: 'Mandatory',
          Cell: ({cell, row}) => {
            const noPartAssigned = row.getValue('Currently Used Part') === '' && cell.getValue('mandatory')
            return (
            <Checkbox
              checked={row.getValue('mandatory')}
              error={noPartAssigned ? 'Currently no part assigned!' : ''}
              color={noPartAssigned ? 'red' : 'teal'}
              readOnly={true}

              style={{
                color: noPartAssigned? 'red' : undefined
              }}
            />
          )}
        },
        {
          accessorFn: (row) => bikeName(row.bike),
          header: 'Bike'
        },
        {
          accessorFn: (row) => currentlyUsedPart(row.partTypeRelations),
          header: 'Currently Used Part'
        }
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
          enableMultiSort
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
            sorting: [
              { id: 'Bike', asc: true},
              { id: 'name', asc: true}
            ]
          }}
          mantineTableBodyRowProps={({ row }) => ({
            onClick: () => { navigate("/parttypes/"+row.original.id) },
            sx: {
              cursor: 'pointer',
            },
          })}
          initialState={{
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
