import { useState } from "react";
import { Badge, Button, Flex, Modal, Stack, Title } from "@mantine/core";
import { DatePicker } from '@mantine/dates';
import dayjs from "dayjs";
import PartTypeSelector from "./PartTypeSelector";
import { bikeName } from "../Bikes/helper";

const AddRelationDialog = ({ open, onClose, onSubmit, latestRelation }) => {

    const [values, setValues] = useState({...latestRelation, 'validUntil': null})

    const handleSubmit = () => {
      //put your validation logic here
      onSubmit(values);
      onClose();
    };

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">Add New Relation</Title>
        <form onSubmit={(e) => e.preventDefault()}>
          <Stack
            sx={{
              width: '100%',
              gap: '24px',
            }}
          >
            <PartTypeSelector
              key='ptSelector'
              label='Parttype'
              partType={values.partType}
              onPartTypeChange={(pt) => {
                console.log(`Values Before: ${JSON.stringify(values)}`)
                setValues({ ...values, "partType": JSON.parse(pt) })
                console.log(`Values After: ${JSON.stringify(values)}`)
              }}
            />
            <Badge size="lg" radius="xs" variant="outline">
              { values?.partType?.bike ? bikeName(values.partType.bike) : 'Unknown' }
            </Badge>
            <DatePicker
              key='validFrom'
              label='Valid From'
              withAsterisk
              allowFreeInput
              clearable={false}
              defaultValue={new Date()}
              onChange={(e) => setValues({ ...values, 'validFrom': dayjs(e).startOf('day').format() })}
            />
            <DatePicker
              key='validUntil'
              label='Valid Until'
              placeholder="optional"
              allowFreeInput
              onChange={(e) => e ? setValues({ ...values, 'validUntil': dayjs(e).endOf('day').format() }) : setValues({ ...values, 'validUntil': null } )}
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

  export default AddRelationDialog;
