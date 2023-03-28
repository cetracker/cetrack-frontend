import { Badge, Button, Flex, Modal, Popover, Stack, Text, Title } from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';
import { useDisclosure } from '@mantine/hooks';
import dayjs from "dayjs";
import { useState } from "react";
import { bikeName } from "../Bikes/helper";
import PartTypeSelector from "./PartTypeSelector";

const RelationEditDialog = ({ open, onClose, onSubmit, initialRelation, variant }) => {

    const [values, setValues] = useState({})
    const [validationErrorPartType, setValidationErrorPartType] = useState('')
    const [validationErrorValidFrom, setValidationErrorValidFrom] = useState('')
    const [validationErrorValidUntil, setValidationErrorValidUntil] = useState('')
    const [popOpened, { close: popClose, open: popOpen }] = useDisclosure(false);

    const title = variant=== 'add'? "Add New Relation" : "Modify Relation"
    const initialValues = variant === 'add' ?
                            { ...initialRelation, 'validFrom': dayjs().format(), 'validUntil': null}
                            : initialRelation

    const handleSubmit = () => {
      const submitValues = { ...initialValues, ...values}
      //put your validation logic here
      let hasAnyError = false;
      if (submitValues.validFrom && dayjs(submitValues.validFrom).isValid()) {
        setValidationErrorValidFrom(false)
        if (submitValues.validUntil) {
          if(dayjs(submitValues.validUntil).isValid) {
            setValidationErrorValidUntil(false)
            if(dayjs(submitValues.validFrom).isAfter(submitValues.validUntil)) {
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

      if (submitValues.partTypeId) {
        setValidationErrorPartType(false)
      } else {
        setValidationErrorPartType(true)
        hasAnyError = true
      }
      if (!hasAnyError) {
        onSubmit(submitValues)
        onClose();
      }
    };

    return(
      <Modal opened={open} withCloseButton={false} onClose={onClose}>
        <Title ta="center">{title}</Title>
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
              partType={initialValues.partType}
              error={validationErrorPartType}
              onPartTypeChange={(pt) => {
                pt ? setValues({ ...values, "partType": JSON.parse(pt), "partTypeId": JSON.parse(pt).id }) :
                  setValues({...values, "partType": null, "partTypeId": null})
              }}
            />
            <Badge size="lg" radius="xs" variant="outline">
              { values?.partType?.bike ?
                  bikeName(values.partType.bike)
                : initialValues?.partType?.bike ?
                  bikeName(initialValues?.partType?.bike)
                : 'Unknown' }
            </Badge>
            <DatePickerInput
              key='validFrom'
              label='Valid From'
              withAsterisk
              clearable={false}
              defaultValue={ (initialValues?.validFrom)? new Date(initialValues.validFrom) : null }
              error={validationErrorValidFrom}
              popoverProps={{ withinPortal: true }}
              onChange={(e) => setValues({ ...values, 'validFrom': dayjs(e).startOf('day').format() })}
            />
            <DatePickerInput
              key='validUntil'
              label='Valid Until'
              placeholder="optional"
              clearable={true}
              defaultValue={ (initialValues?.validUntil)? new Date(initialValues.validUntil) : null }
              error={validationErrorValidUntil}
              popoverProps={{ withinPortal: true }}
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
          {variant === 'add' ? (
          <Popover width={300} position="bottom" withArrow shadow="md" opened={popOpened}>
            <Popover.Target>
              <Button
                color="teal"
                onClick={handleSubmit}
                variant="filled"
                onMouseEnter={popOpen} onMouseLeave={popClose}
              >
                Add
              </Button>
            </Popover.Target>
            <Popover.Dropdown sx={{ pointerEvents: 'none' }}>
              <Text size="sm">
                Currently active relation of a different part with this part type will be terminated automatically
                at Midnight on the day before "Valid From" above.
              </Text>
            </Popover.Dropdown>
          </Popover>
          ) : variant === 'modify' ? (
            <Button
                color="teal"
                onClick={handleSubmit}
                variant="filled"
              > Save </Button>
          ) : <></>
          }
        </Flex>
      </Modal>
  );

  };

  export default RelationEditDialog;