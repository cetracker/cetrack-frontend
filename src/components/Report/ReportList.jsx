import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from 'react';
import { formatDuration } from '../../helper/durationFormatter';
import fetchReportQuery from "./api/fetchReport";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchReportQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

dayjs.extend(duration)

const ReportList = () => {
  const {
    isError,
    isLoading,
    isFetching,
    data: report,
  } = useQuery(fetchReportQuery())

  const columns = useMemo(
    () => [
      {
        accessorKey: 'part',
        header: 'Part'
      },
      {
        accessorFn: (row) => (parseInt(row.distance) / 1000).toLocaleString(undefined, {minimumFractionDigits: 3}),
        header: 'Distance (km)',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 100,
        maxSize: 140,
        sortingFn: (rowA, rowB, columnId) => rowA.original.distance < rowB.original.distance ? 1 : -1,
      },
      {
        accessorFn: (row) => row.durationMoving? formatDuration(row.durationMoving): '',
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
        accessorKey: 'altUp',
        header: 'Uphill',
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
        accessorKey: 'altDown',
        header: 'Downhill',
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
        accessorFn: (row) => (parseInt(row.totalPower) / 1000).toLocaleString(undefined, {minimumFractionDigits: 3}),
        header: 'Sum Power (kW)',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 130,
        maxSize: 150,
      },
    ],
    []
  )

  return (
    <>
      <MantineReactTable
        columns={columns}
        data={report ?? []}
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

export default ReportList;
