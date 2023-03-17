import { Badge, Button, Flex, Modal, Stack, Title } from "@mantine/core";
import { DatePicker } from '@mantine/dates';
import dayjs from "dayjs";
import { useState } from "react";
import { bikeName } from "../Bikes/helper";
import PartTypeSelector from "./PartTypeSelector";

const AddRelationDialog = ({ open, onClose, onSubmit, latestRelation }) => {

    const [values, setValues] = useState({...latestRelation, 'validFrom': dayjs().startOf('day').format(), 'validUntil': null})
    const [validationErrorPartType, setValidationErrorPartType] = useState('')
    const [validationErrorValidFrom, setValidationErrorValidFrom] = useState('')
    const [validationErrorValidUntil, setValidationErrorValidUntil] = useState('')

    const handleSubmit = () => {
      //put your validation logic here
      let hasAnyError = false;
      if (values.validFrom && dayjs(values.validFrom).isValid()) {
        setValidationErrorValidFrom(false)
        if (values.validUntil) {
          if(dayjs(values.validUntil).isValid) {
            setValidationErrorValidUntil(false)
            if(dayjs(values.validFrom).isAfter(values.validUntil)) {
              setValidationErrorValidFrom(true)
              setValidationErrorValidUntil('Valid Until must be after Valid From')
              hasAnyError = true
            }
          } else {
            setValidationErrorValidUntil('invalid date')
            hasAnyError = true
          }
        } else {
          // validUntil is optional
          setValidationErrorValidUntil(false)
        }
      } else {
        setValidationErrorValidFrom('invalid date')
        hasAnyError = true
      }

      if (values.partTypeId) {
        setValidationErrorPartType(false)
      } else {
        setValidationErrorPartType(true)
        hasAnyError = true
      }
      if (!hasAnyError) {
        onSubmit(values)
        onClose();
      }
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
              error={validationErrorPartType}
              onPartTypeChange={(pt) => {
                pt ? setValues({ ...values, "partType": JSON.parse(pt), "partTypeId": JSON.parse(pt).id }) :
                  setValues({...values, "partType": null, "partTypeId": null})
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
              error={validationErrorValidFrom}
              onChange={(e) => setValues({ ...values, 'validFrom': dayjs(e).startOf('day').format() })}
            />
            <DatePicker
              key='validUntil'
              label='Valid Until'
              placeholder="optional"
              allowFreeInput
              error={validationErrorValidUntil}
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
