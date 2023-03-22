import { Button, Flex, Modal, Stack, TextInput, Title } from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import dayjs from "dayjs";
import { useState } from "react";

const AddBikeDialog = ({ open, onClose, onSubmit }) => {

    const [values, setValues] = useState({})

    const handleSubmit = () => {
      //put your validation logic here
      onSubmit(values);
      onClose();
    };

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">Add New Part</Title>
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
              withAsterisk
              onChange={(event) => setValues({ ...values, 'manufacturer': event.currentTarget.value})}
            />
            <TextInput
              key="model"
              label="Model"
              placeholder="The bike's model"
              withAsterisk
              onChange={(event) => setValues({ ...values, 'model': event.currentTarget.value})}
            />
            <DatePickerInput
              key='boughtAt'
              label='Purchase Date'
              placeholder="optional"
              allowFreeInput
              popoverProps={{ withinPortal: true }}
              onChange={(e) => e ? setValues({ ...values, 'boughtAt': dayjs(e).startOf('day').format() }) : setValues({ ...values, 'boughtAt': null } )}
            />
            <DatePickerInput
              key='retiredAt'
              label='Retired'
              allowFreeInput
              placeholder="optional - not implemented yet"
              popoverProps={{ withinPortal: true }}
              // onChange={(e) => e ? setValues({ ...values, 'retiredAt': dayjs(e).endOf('day').format() }) : setValues({ ...values, 'retiredAt': null } )}
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

  export default AddBikeDialog;
