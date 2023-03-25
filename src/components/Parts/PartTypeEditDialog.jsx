import { Button, Flex, Modal, Stack, TextInput, Title } from "@mantine/core";
import { useState } from "react";
import BikeSelector from "../Bikes/BikeSelector";

const PartTypeEditDialog = ({ open, onClose, onSubmit, variant, initialPartType }) => {

    const [values, setValues] = useState({})
    const [validationErrorPartTypeName, setValidationErrorPartTypeName] = useState(null)

    let { bike: lastBike } = initialPartType
    const initialValues = variant === 'add' ? { bike: lastBike } : initialPartType

    const handleSubmit = () => {
      const submitValues = { ...initialValues, ...values}
      console.info('SubmitValues', submitValues)
      if (!submitValues?.name || submitValues.name === '') {
        setValidationErrorPartTypeName('Name is mandatory!')
      } else {
        setValidationErrorPartTypeName(null)
        onSubmit(submitValues);
        onClose();
      }
    };

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">{variant === 'new'? "Add New" : "Edit"} Parttype</Title>
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
              defaultValue={(variant === 'modify' && initialValues?.name) ? initialValues.name : null}
              withAsterisk
              error={validationErrorPartTypeName}
              onChange={(event) => setValues({ ...values, 'name': event.currentTarget.value })}
            />
            <BikeSelector
              key='bikeSelector'
              label='Bike'
              bike={initialValues.bike}
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
          <Button color="teal" onClick={handleSubmit} variant="filled">{ variant==='new' ? "Add" : "Save"}</Button>

        </Flex>
      </Modal>
  );

  };

  export default PartTypeEditDialog;
