import { Button, Flex, Modal, Stack, TextInput, Title } from "@mantine/core";
import { DateInput } from '@mantine/dates';
import dayjs from "dayjs";
import { useState } from "react";

const AddBikeDialog = ({ open, onClose, onSubmit, initialBike, variant }) => {

    const [values, setValues] = useState({})
    const [validationErrorManufacturer, setValidationErrorManufacturer] = useState(null)
    const [validationErrorModel, setValidationErrorModel] = useState(null)

    console.debug('IBike',initialBike)
    console.debug('Variant', variant)

    const handleSubmit = () => {
      let hasAnyErrors = false;
      const submitValues = { ...initialBike, ...values }
      console.debug('SubmitValues', submitValues)
      if (!submitValues.manufacturer || submitValues.manufacturer === '') {
        setValidationErrorManufacturer('Manufacturer is mandatory!')
        hasAnyErrors = true
      }
      if (!submitValues.model || submitValues.model === '') {
        setValidationErrorModel('Model name is mandatory!')
        hasAnyErrors = true
      }
      if(hasAnyErrors) {
        return;
      }
      onSubmit(submitValues);
      setValidationErrorManufacturer(null)
      setValidationErrorModel(null)
      onClose();
    };

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">{variant === 'new'? "Add New" : "Edit"} Bike</Title>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              gap: '24px',
            }}
          >
            <TextInput
              key="manufacturer"
              label="Manufacturer"
              placeholder="The bikes manufacturer"
              defaultValue={(variant === 'modify' && initialBike?.manufacturer) ? initialBike.manufacturer : null}
              withAsterisk
              error={validationErrorManufacturer}
              onChange={(event) => setValues({ ...values, 'manufacturer': event.currentTarget.value})}
            />
            <TextInput
              key="model"
              label="Model"
              placeholder="The bike's model"
              defaultValue={(variant === 'modify' && initialBike?.model) ? initialBike.model : null}
              withAsterisk
              error={validationErrorModel}
              onChange={(event) => setValues({ ...values, 'model': event.currentTarget.value})}
            />
            <DateInput
              key='boughtAt'
              label='Purchase Date'
              placeholder="optional"
              defaultValue={ (initialBike?.boughtAt)? new Date(initialBike.boughtAt) : null }
              popoverProps={{ withinPortal: true }}
              onChange={(e) => e ? setValues({ ...values, 'boughtAt': dayjs(e).startOf('day').format() }) : setValues({ ...values, 'boughtAt': null } )}
            />
            <DateInput
              key='retiredAt'
              label='Retired'
              placeholder="optional - not implemented yet"
              defaultValue={ (initialBike?.retiredAt)? new Date(initialBike.retiredAt) : null }
              disabled={true}
              popoverProps={{ withinPortal: true }}
              onChange={(e) => e ? setValues({ ...values, 'retiredAt': dayjs(e).endOf('day').format() }) : setValues({ ...values, 'retiredAt': null } )}
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

  export default AddBikeDialog;
