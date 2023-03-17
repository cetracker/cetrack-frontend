import { ActionIcon } from '@mantine/core';
import { IconSquareRoundedPlusFilled } from '@tabler/icons-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from "dayjs";
import { MantineReactTable } from "mantine-react-table";
import { useMemo, useState } from 'react';
import { useNavigate } from "react-router-dom";
import AddPartDialog from './AddPartDialog';
import { fetchPartsQuery } from "./api/fetchParts";
import { addPart } from "./api/mutatePart";

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
    // when relation is open ended (null),
    // the part is currently in use
    if (!relation.validUntil) {
      usage = relation.partType.name
    }
  });
  return usage;
}

const PartList = () => {
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const {
    isError,
    isLoading,
    isFetching,
    data: parts,
  } = useQuery(fetchPartsQuery())

  const navigate = useNavigate()
  const queryClient = useQueryClient();

  const addPartMutation = useMutation({
    queryKey: ['part'],
    mutationFn: (part) => addPart(part),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['parts'] }) }
  })

  const handleAddPart = (part) => {
    addPartMutation.mutate(part)
  }


  const columns = useMemo(
    () => [
      {
        accessorKey: 'name',
        header: 'Name'
      },
      {
        accessorFn: (row) => (row.boughtAt ? dayjs(row.boughAt).format('YYYY-MM-DD HH:mm') : ''),
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
      <AddPartDialog
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleAddPart}
      />
      <MantineReactTable
        columns={columns}
        data={parts ?? []}
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
        renderTopToolbarCustomActions={() => (
          <ActionIcon onClick={() => setCreateModalOpen(true)}>
            <IconSquareRoundedPlusFilled />
          </ActionIcon>
        )}
      />
    </>
  )
}

export default PartList;
