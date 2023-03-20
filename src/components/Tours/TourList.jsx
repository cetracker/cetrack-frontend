import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from 'react';
import { bikeName } from '../Bikes/helper';
import fetchToursQuery from "./fetchTours";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchToursQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

dayjs.extend(duration)

const TourList = () => {
  const {
    isError,
    isLoading,
    isFetching,
    data: tours,
  } = useQuery(fetchToursQuery())

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title'
      },
      {
        accessorFn: (row) => (parseInt(row.distance) / 100).toLocaleString(undefined, {minimumFractionDigits: 2}),
        header: 'Distance',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 100,
        maxSize: 140,
      },
      {
        accessorFn: (row) => dayjs.duration(row.durationMoving, 'seconds').format('H:mm:ss'),
        header: 'Duration Moving',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 130,
        maxSize: 150,
      },
      {
        accessorFn: (row) => (row.startedAt ? dayjs(row.startedAt).format('YYYY-MM-DD HH:mm') : ''),
        header: 'Started',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 130,
        maxSize: 150,
      },
      {
        accessorFn: (row) => bikeName(row.bike),
        header: 'Bike'
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
        enableBottomToolbar={false}
        mantineTableProps={{
          striped: true,
          highlightOnHover: false,
        }}
        mantineToolbarAlertBannerProps={
        isError
          ? {
              color: 'error',
              children: 'Error loading data',
            }
          : undefined
        }
        state={{
          isLoading,
          showAlertBanner: isError,
          showProgressBars: isFetching,
          // showSkeletons: isFetching,
        }}
        initialState={{ density: 'sm' }}
        enableStickyHeader
        mantineTableContainerProps={{ sx: { maxHeight: '800px' } }}
      />
    </>
  )
}

export default TourList;
