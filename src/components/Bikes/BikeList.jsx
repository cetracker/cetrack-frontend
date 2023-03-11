import { useMemo } from "react";
import { useQuery } from '@tanstack/react-query';
import { MantineReactTable } from "mantine-react-table";
import dayjs from "dayjs";
import fetchBikesQuery from "./fetchBikes";

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
    const {
      isError,
      isLoading,
      isFetching,
      data: tours,
    } = useQuery(fetchBikesQuery())

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
          accessorFn: (row) => (row.startedAt ? dayjs(row.startedAt).format('YYYY-MM-DD HH:mm') : ''),
          header: 'Purchase Date'
        }
      ],
      []
    )

    return (
      <>
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
