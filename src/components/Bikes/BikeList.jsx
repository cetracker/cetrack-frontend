import { useMemo, useState } from "react";
import { ActionIcon } from "@mantine/core";
import { IconSquareRoundedPlusFilled } from "@tabler/icons-react";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import AddBikeDialog from "./AddBikeDialog"
import fetchBikesQuery from "./fetchBikes";
import { addBike } from "./mutateBike";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchBikesQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }


  const BikeList = () => {
    const [createModalOpen, setCreateModalOpen] = useState(false)

    const {
      isError,
      isLoading,
      isFetching,
      data: tours,
    } = useQuery(fetchBikesQuery())

    const queryClient = useQueryClient();

    const addBikeMutation = useMutation({
      queryKey: ['bike'],
      mutationFn: (bike) => addBike(bike),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bikes'] }) }
    })

    const handleAddBike = (bike) => {
      addBikeMutation.mutate(bike)
    }

    const columns = useMemo(
      () => [
        {
          accessorKey: 'manufacturer',
          header: 'Manufacturer'
        },
        {
          accessorKey: 'model',
          header: 'model'
        },
        {
          accessorFn: (row) => (row.boughtAt ? dayjs(row.boughAt).format('YYYY-MM-DD HH:mm') : ''),
          header: 'Purchase Date'
        }
      ],
      []
    )

    return (
      <>
        <AddBikeDialog
          open={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSubmit={handleAddBike}
        />
        <MantineReactTable
          columns={columns}
          data={tours ?? []}
          enablePagination={false}
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

export default BikeList;
