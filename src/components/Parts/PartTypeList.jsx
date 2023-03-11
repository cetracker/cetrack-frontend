import { useQuery } from '@tanstack/react-query';
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from "react";
import { fetchPartTypesQuery } from "./fetchPartTypes";

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

  const bikeName = (bikeObj) => {
    const manufacturer = (bikeObj.manufacturer) ? bikeObj.manufacturer : '-'
    const model = (bikeObj.model) ? bikeObj.model : '-'
    const bike = manufacturer + " " + model
    return bike
  }

  const PartTypeList = () => {
    const {
      isError,
      isLoading,
      isFetching,
      data: tours,
    } = useQuery(fetchPartTypesQuery())

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

export default PartTypeList;
