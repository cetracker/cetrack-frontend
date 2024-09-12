import { Box, Flex, Stack } from '@mantine/core';
import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from 'react';
import { formatDuration, formatJaskWh } from '../../helper/durationFormatter';
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

  const sumDistance = useMemo(
    () => tours.reduce((acc, curr) => acc + curr.distance, 0),
    [tours]
  )
  const sumAltUp = useMemo(
    () => tours.reduce((acc, curr) => acc + curr.altUp, 0),
    [tours]
  )
  const sumAltDown = useMemo(
    () => tours.reduce((acc, curr) => acc + curr.altDown, 0),
    [tours]
  )
  const sumPower = useMemo(
    () => tours.reduce((acc,curr) => acc + curr.powerTotal, 0),
    [tours]
  )
  const sumMoving = useMemo(
    () => tours.reduce((acc, curr) => acc + curr.durationMoving, 0),
    [tours]
  )

  const columns = useMemo(
    () => [
      {
        accessorKey: 'title',
        header: 'Title'
      },
      {
        accessorKey: 'startYear',
        header: 'Year'
      },
      {
        accessorKey: 'startMonth',
        header: 'Month'
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
        maxSize: 180,
      },
      {
        accessorFn: (row) => (parseInt(Math.round(row.distance/10)) / 100).toLocaleString(undefined, {minimumFractionDigits: 2}),
        header: 'Distance (km)',
        aggregationFn: (columnId, leafRows, childRows) => {
                let sum = leafRows.reduce((acc, curr) => acc + curr.original.distance, 0)
                return (parseInt(Math.round(sum/10)) / 100).toLocaleString(undefined, {minimumFractionDigits: 2})
              },
        AggregatedCell: ({ cell }) => <div>{cell.getValue()}</div>,
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 100,
        maxSize: 140,

        Footer: () => (
          <Flex justify='flex-end'>
            <Stack>
              Total Distance
              <Box>
                { (parseInt(Math.round(sumDistance/10)) / 100).toLocaleString(undefined, {minimumFractionDigits: 1})} km
              </Box>
            </Stack>
          </Flex>
        )
      },
      {
        accessorFn: (row) => formatDuration(row.durationMoving),
        header: 'Duration Moving',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 130,
        maxSize: 150,
        Footer: () => (
          <Flex justify='flex-end'>
            <Stack>
              Total Duration Moving
              <Box>
                { formatDuration(sumMoving) }
              </Box>
            </Stack>
          </Flex>
        )
      },
      {
        accessorKey: 'altUp',
        header: 'Up (m)',
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => <div>{cell.getValue()}</div>,
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 110,
        maxSize: 130,
        Footer: () => (
          <Flex justify='flex-end'>
            <Stack>
              Total Up
              <Box>
                { sumAltUp } m
              </Box>
            </Stack>
          </Flex>
        )
      },
      {
        accessorKey: 'altDown',
        header: 'Down (m)',
        aggregationFn: 'sum',
        AggregatedCell: ({ cell }) => <div>{cell.getValue()}</div>,
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 110,
        maxSize: 130,
        Footer: () => (
          <Flex justify='flex-end'>
            <Stack>
              Total Down
              <Box>
                { sumAltDown } m
              </Box>
            </Stack>
          </Flex>
        )
      },
      {
        accessorFn: (row) => formatJaskWh(row.powerTotal),
        header: 'Power (kWh)',
        mantineTableHeadCellProps: {
          align: 'right',
        },
        mantineTableBodyCellProps: {
          align: 'right',
        },
        size: 110,
        maxSize: 130,
        Footer: () => (
          <Flex justify='flex-end'>
            <Stack>
              Total Power
              <Box>
                <span>{formatJaskWh(sumPower)}kWh - {(parseInt(sumPower/10000)/100).toLocaleString(undefined, {minimumFractionDigits: 1})} MJ</span>
              </Box>
            </Stack>
          </Flex>
        )
      },
      {
        accessorFn: (row) => bikeName(row.bike),
        header: 'Bike',
        filterVariant: 'select'
      }
    ],
    [sumDistance, sumMoving, sumAltUp, sumAltDown, sumPower]
  )

  return (
    <>
      <MantineReactTable
        columns={columns}
        data={tours ?? []}
        enableGrouping
        enablePagination={false}
        enableBottomToolbar={false}
        enableFacetedValues={true}
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
        initialState={{
          density: 'sm',
          sorting: [
            { id: 'Started', asc: true}
          ],
          columnVisibility: {startYear: false, startMonth: false}
        }}
        enableStickyHeader
        mantineTableContainerProps={{ sx: { maxHeight: '800px' } }}
      />
    </>
  )
}

export default TourList;
