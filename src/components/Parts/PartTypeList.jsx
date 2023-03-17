import { ActionIcon } from '@mantine/core';
import { IconSquareRoundedPlusFilled } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useState } from 'react';
import { bikeName } from '../Bikes/helper';
import AddPartTypeDialog from './AddPartTypeDialog';
import { fetchPartTypesQuery } from "./api/fetchPartTypes";
import { addPartType } from "./api/mutatePartType";

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

    const handleAddPartType = (partType) => {
      addPartTypeMutation.mutate(partType)
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
          <AddPartTypeDialog
            open={createModalOpen}
            onClose={() => setCreateModalOpen(false)}
            latestBike={
                  (partTypes && partTypes.length > 0) ?
                    partTypes[partTypes.length - 1].bike : {}
                }
            onSubmit={handleAddPartType}
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
          <ActionIcon onClick={() => setCreateModalOpen(true)}>
            <IconSquareRoundedPlusFilled />
          </ActionIcon>
        )}
          showSkeletons={true}
          state={{
            isLoading,
            showAlertBanner: isError,
            showProgressBars: isFetching,
          }}
        />
      </>
    )
  }

export default PartTypeList;
