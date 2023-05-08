import { Button, Flex, Modal, Stack, TextInput, Title } from "@mantine/core";
import { DateInput } from '@mantine/dates';
import dayjs from "dayjs";
import { useState } from "react";

const PartEditDialog = ({ open, onClose, onSubmit, variant, initialPart }) => {

    const [values, setValues] = useState({})
    const [validationErrorPartName, setValidationErrorPartName] = useState(null)

  // ToDo only enable saving if any onChange was triggered

    const handleSubmit = () => {
      const modifiedValues = { ...initialPart, ...values}
      if (!modifiedValues?.name || modifiedValues.name === '') {
        setValidationErrorPartName('Name is mandatory!')
      } else {
        onSubmit((variant === 'new') ? values : { ...initialPart, ...values});
        onClose();
      }
    };

    console.debug('Variant', variant)
    console.debug('initialPart', initialPart)
    console.debug('name', (variant === 'modify' && initialPart?.name) ? initialPart.name : null)

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">{variant === 'new'? "Add New" : "Edit"} Part</Title>
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
              placeholder="The part's name"
              defaultValue={(variant === 'modify' && initialPart?.name) ? initialPart.name : null}
              withAsterisk
              error={validationErrorPartName}
              onChange={(event) => setValues({ ...values, 'name': event.currentTarget.value})}
            />
            <DateInput
              key='boughtAt'
              label='Purchase Date'
              placeholder="optional"
              defaultValue={ (initialPart?.boughtAt)? new Date(initialPart.boughtAt) : null }
              clearable={true}
              popoverProps={{ withinPortal: true }}
              onChange={(e) => e ? setValues({ ...values, 'boughtAt': dayjs(e).startOf('day').format() }) : setValues({ ...values, 'boughtAt': null } )}
            />
            <DateInput
              key='retiredAt'
              label='Retired'
              placeholder="optional"
              defaultValue={ (initialPart?.retiredAt)? new Date(initialPart.retiredAt) : null }
              clearable={true}
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

  export default PartEditDialog;
