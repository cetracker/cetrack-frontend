import { Loader, NativeSelect } from "@mantine/core";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import { fetchPartTypesQuery } from "./fetchPartTypes";

const PartTypeSelector = ({onPartTypeChange, partType}) => {
  const [value, setValue] = useState(JSON.stringify(partType))
  const { status, data: partTypes } = useQuery(fetchPartTypesQuery())
  return(
    <>
      { status !== 'success' ? (
        <Loader />
      ) : (
        <NativeSelect
          data={ Array.from(partTypes.map(
            (partType) => (
              { value: JSON.stringify(partType),
                label: partType.name
              })
          ))}
          value={value}
          onChange={(event) => {
            setValue(event.currentTarget.value)
            onPartTypeChange(event.currentTarget.value)
          }}/>
      )
      }
    </>
  )
}

export default PartTypeSelector;
