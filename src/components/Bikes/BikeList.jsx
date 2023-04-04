import { ActionIcon } from "@mantine/core";
import { IconEdit, IconSquareRoundedPlusFilled, IconTrash } from "@tabler/icons-react";
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useState } from "react";
import { showUserError } from "../../helper/errorNotification";
import AddBikeDialog from "./AddBikeDialog";
import fetchBikesQuery from "./api/fetchBikes";
import { addBike, putBike, removeBike } from "./api/mutateBike";
import { bikeName } from "./helper";

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
    const [bikeDialogVariant, setBikeDialogVariant] = useState('')
    const [bikeUnderEdit, setBikeUnderEdit] = useState({})

    const {
      isError,
      isLoading,
      isFetching,
      data: bikes,
    } = useQuery(fetchBikesQuery())

    const queryClient = useQueryClient();

    const addBikeMutation = useMutation({
      queryKey: ['bike'],
      mutationFn: (bike) => addBike(bike),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bikes'] }) }
    })
    const modifyBikeMutation = useMutation({
      queryKey: ['bike'],
      mutationFn: (bike) => putBike(bike.id, bike),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bikes'] }) }
    })
    const removeBikeMutation = useMutation({
      queryKey: ['bike'],
      mutationFn: (bikeId) => removeBike(bikeId),
      onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['bikes'] }) },
      onError: (error) => {
        const errorResponse = error.response.data
        showUserError(errorResponse.status, errorResponse.code, errorResponse.message)
      }

    })

    const handleBikeSubmit = (bike) => {
      (bikeDialogVariant === 'add') ? (
        addBikeMutation.mutate(bike)
      ) : (
        modifyBikeMutation.mutate(bike)
      )
      setBikeUnderEdit({})
    }

    const handleRemoveBike = (bike) => {
      if ( !window.confirm(`Are you sure you want to delete Bike (${bikeName(bike)})?`)) {
        return
      }
      removeBikeMutation.mutate(bike.id)
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
          accessorFn: (row) => (row.boughtAt ? dayjs(row.boughtAt).format('YYYY-MM-DD') : ''),
          header: 'Purchase Date'
        }
      ],
      []
    )

    return (
      <>
        <AddBikeDialog
          open={createModalOpen}
          onClose={() => {
            setCreateModalOpen(false)
            setBikeUnderEdit({})
          }}
          variant={bikeDialogVariant}
          onSubmit={handleBikeSubmit}
          initialBike={bikeUnderEdit}
        />
        <MantineReactTable
          columns={columns}
          data={bikes ?? []}
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
            <ActionIcon onClick={() => {
                setCreateModalOpen(true)
                setBikeDialogVariant('add')
              }}
            >
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
                    setBikeDialogVariant('modify')
                    setBikeUnderEdit(row.original)
                    setCreateModalOpen(true)
                  }}><IconEdit />
                </ActionIcon>
                <ActionIcon
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveBike(row.original)
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

export default BikeList;
