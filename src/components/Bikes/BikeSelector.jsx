import { Loader, NativeSelect } from "@mantine/core";
import { useQuery } from '@tanstack/react-query';
import { useState } from "react";
import fetchBikesQuery from "./fetchBikes";
import { bikeName } from "./helper";

const BikeSelector = ({onBikeChange, bike, error}) => {
  const [value, setValue] = useState(JSON.stringify(bike))
  const { status, data: bikes } = useQuery(fetchBikesQuery())
  return(
    <>
      { status !== 'success' ? (
        <Loader />
      ) : (
        <NativeSelect
          data={ [{ value: '', label: "Please select!"}]
          .concat(Array.from(bikes.map((bike) => (
            { value: JSON.stringify(bike),
              label: bikeName(bike)
            })
          ))) }
          value={value}
          error={error}
          onChange={(event) => {
            setValue(event.currentTarget.value)
            onBikeChange(event.currentTarget.value)
          }}/>
      )
      }
    </>
  )
}

export default BikeSelector;
