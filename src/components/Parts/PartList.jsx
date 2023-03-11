import { useQuery } from '@tanstack/react-query';
import { MantineReactTable } from "mantine-react-table";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { fetchPartsQuery } from "./fetchParts";

// ⬇️ needs access to queryClient
export const loader = (queryClient) =>
  async () => {
    const query = fetchPartsQuery()
    // ⬇️ return data or fetch it
    return (
      queryClient.getQueryData(query.queryKey) ??
      (await queryClient.fetchQuery(query))
    )
  }

const inUseAs = (relations) => {
  let usage = ''
  relations && relations.forEach(relation => {
    if (!relation.validUntil) {
      console.log( ' N U L L : ' + relation.partType.name)
      usage = relation.partType.name
    } else {
      console.log(relation.validUntil)
    }
  });
  return usage;
}

const PartList = () => {
  const {
    isError,
    isLoading,
    isFetching,
    data: parts,
  } = useQuery(fetchPartsQuery())

  const navigate = useNavigate()

  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name'
      },
      {
        accessorKey: 'boughtAt',
        header: 'Purchase Date'
      },
      {
        accessorFn: (row) => inUseAs(row.partTypeRelations),
        header: 'Currently In Use As'
      }
    ],
    []
  )

  return (
    <>
      <MantineReactTable
        columns={columns}
        data={parts ?? []}
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
        mantineTableBodyRowProps={({ row }) => ({
          onClick: () => { navigate("/parts/"+row.original.id) },
          sx: {
            cursor: 'pointer',
          },
        })}
      />
    </>
  )
}

export default PartList;
