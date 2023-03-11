import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Loader, NativeSelect } from "@mantine/core";
import { fetchPartTypesQuery } from "./fetchPartTypes";

const PartTypeSelector = () => {
  const [value, setValue] = useState('')
  const { status, data: partTypes } = useQuery(fetchPartTypesQuery())
  return(
    <>
      { status !== 'success' ? (
        <Loader />
      ) : (
        <NativeSelect
          data={ Array.from(partTypes.map(
            (partType) => (
              { value: partType.id,
                label: partType.name
              })
          ))}
          value={value}
          onChange={(event) => setValue(event.currentTarget.value)}/>
      )
      }
    </>
  )
}

export default PartTypeSelector;
