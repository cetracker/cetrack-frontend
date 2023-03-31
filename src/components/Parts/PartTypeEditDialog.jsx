import { Button, Checkbox, Flex, Modal, Stack, TextInput, Title } from "@mantine/core";
import { useEffect, useState } from "react";
import BikeSelector from "../Bikes/BikeSelector";

const PartTypeEditDialog = ({ open, onClose, onSubmit, variant, initialPartType }) => {

  const [values, setValues] = useState(variant === 'add' ? { bike: initialPartType.bike, mandatory: false } : initialPartType)
  const [validationErrorPartTypeName, setValidationErrorPartTypeName] = useState(null)

  useEffect(() => {
    setValues(variant === 'add' ? { bike: initialPartType.bike, mandatory: false } : initialPartType)
  }, [initialPartType, variant])


    // let { bike: lastBike } = initialPartType
    // const initialValues = variant === 'add' ? { bike: lastBike } : initialPartType

  const handleSubmit = () => {
/*       const submitValues = { ...initialValues, ...values}
      console.info('SubmitValues', submitValues)
      if (!submitValues?.name || submitValues.name === '') {
        setValidationErrorPartTypeName('Name is mandatory!')
      } else {
        setValidationErrorPartTypeName(null)
        onSubmit(submitValues);
        onClose();
      }

      */
    if(!values?.name || values.name === '') {
      setValidationErrorPartTypeName('Name is mandatory!')
    } else {
      setValidationErrorPartTypeName(null);
      onSubmit(values);
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
              value={(variant === 'modify' && values?.name) ? values.name : null}
              withAsterisk
              error={validationErrorPartTypeName}
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
            <Checkbox
              label='Is Mandatory'
              checked={ values?.mandatory ? values.mandatory : false }
              onChange={(event) => setValues({ ...values, 'mandatory': event.currentTarget.checked})}
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
