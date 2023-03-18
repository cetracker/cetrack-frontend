import { Button, Code, Group, JsonInput } from '@mantine/core';
import { IconCheck, IconUpload } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import importMyTourBookTours from './mutateTours';

const TourImport = () => {
  const [value, setValue] = useState('')
  const [validationError, setValidationError] = useState('')
  const [validationErrorMessage, setvalidationErrorMessage] = useState('')

  const queryClient = useQueryClient();
  const addPartMutation = useMutation({
    queryKey: ['tours'],
    mutationFn: (tours) => importMyTourBookTours(tours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] })
      setValue('')
    }
  })

  const handleImportTours = () => {
    value &&
      addPartMutation.mutate(JSON.parse(value))
  }
  const handleValidateTours = () => {
    // ToDo add more validations
    // - iterate over tours
    // - check, required
    try {
      JSON.parse(value)
      setvalidationErrorMessage('')
      setValidationError('valid')
    } catch (error) {
      setvalidationErrorMessage(error.message)
      setValidationError('invalid')
    }
  }
  const handleJSONInputChnage = (json) => {
    setValidationError(null)
    setValue(json)
  }

  return (
    <>
      <form onSubmit={(e) => e.preventDefault()}>
        <Group>
          <Button
            leftIcon={<IconCheck size="1rem"/>}
            disabled={value === ''}
            onClick={handleValidateTours}
            color={ (validationError === 'valid') ? "green" : "gray" }
          >
            Validate
          </Button>
          <Button
            leftIcon={<IconUpload size="1rem" />}
            disabled={validationError === 'invalid' || validationError === ''}
            onClick={handleImportTours}
          >
            Upload
          </Button>
        </Group>
        <JsonInput
          label="Your MyTourBook tour details"
          placeholder="Paste your tours exported as JSON from the Derby MTB database into this text field."
          value={value}
          onChange={handleJSONInputChnage}
          validationError="Invalid JSON"
          formatOnBlur
          autosize
          withAsterisk
          minRows={30}
        />
      </form>
      <Code>{validationErrorMessage}</Code>
    </>
  )
}

export default TourImport;
