import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from 'react';
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
