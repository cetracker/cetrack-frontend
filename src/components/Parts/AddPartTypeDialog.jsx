import { Button, Flex, Modal, Stack, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import BikeSelector from "../Bikes/BikeSelector";

const AddPartTypeDialog = ({ open, onClose, onSubmit, latestBike }) => {

    const [values, setValues] = useState({ "bike": latestBike })

    const handleSubmit = () => {
      //put your validation logic here
      onSubmit(values)
      onClose();
    };

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">Add New Parttype</Title>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              gap: '24px',
            }}
          >
            <TextInput
              key="name"
              label="Name"
              placeholder="The part type's name"
              withAsterisk
              onChange={(event) => setValues({ ...values, 'name': event.currentTarget.value })}
            />
            <BikeSelector
              key='bikeSelector'
              label='Bike'
              bike={values.bike}
              onBikeChange={(bike) => {
                bike ? setValues({ ...values, "bike": JSON.parse(bike) }) :
                  setValues({ ...values, "bike": null })
              }}

            />
          </Stack>
        </form>

        <Flex
          sx={{
            padding: '20px',
            width: '100%',
            justifyContent: 'flex-end',
            gap: '16px',
          }}
        >

          <Button onClick={onClose} variant="subtle"> Cancel </Button>
          <Button color="teal" onClick={handleSubmit} variant="filled"> Add </Button>
        </Flex>
      </Modal>
  );

  };

  export default AddPartTypeDialog;
