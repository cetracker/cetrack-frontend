import { Loader, NativeSelect } from "@mantine/core";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import { bikeName } from "../Bikes/helper";
import { fetchPartTypesQuery } from "./api/fetchPartTypes";

const PartTypeSelector = ({onPartTypeChange, partType, error}) => {
  const [value, setValue] = useState(JSON.stringify(partType))
  const { status, data: partTypes } = useQuery(fetchPartTypesQuery())
  return(
    <>
      { status !== 'success' ? (
        <Loader />
      ) : (
        <NativeSelect
          data={ [{ value: '', label: "Please select!"}]
          .concat(Array.from(partTypes.map((partType) => {
            const pt = {...partType, 'partTypeRelations': []}
            return { value: JSON.stringify(pt),
              label: `${partType.name}  (${bikeName(partType.bike)})`
            }
          }
          ))) }
          value={value}
          error={error}
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
