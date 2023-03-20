import { Box, Button, Code, Collapse, Group, JsonInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconArrowBadgeRight, IconArrowBadgeUp, IconCheck, IconUpload } from '@tabler/icons-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import BikeSelector from '../Bikes/BikeSelector';
import importMyTourBookTours from './mutateTours';

const sqlExportQuery=`SELECT TOURID AS MTTOURID, STARTYEAR, STARTMONTH, STARTDAY, TOURTITLE AS TITLE, TOURSTARTTIME AS startedAt, TOURDISTANCE AS distance,
  TOURDEVICETIME_ELAPSED AS timeElapsedDevice, TOURCOMPUTEDTIME_MOVING AS durationMoving , TOURDEVICETIME_RECORDED AS timeRecordedDevice
  FROM "USER".TOURDATA
  WHERE STARTYEAR=2022 AND TOURPERSON_PERSONID=0 AND TOURTYPE_TYPEID=0;`

const TourImport = () => {
  const [value, setValue] = useState('')
  const [bikeId, setBikeId] = useState(null)
  const [validationError, setValidationError] = useState('')
  const [validationErrorMessage, setvalidationErrorMessage] = useState('')
  const [opened, { toggle }] = useDisclosure(false);

  const queryClient = useQueryClient();
  const addToursMutation = useMutation({
    queryKey: ['tours'],
    mutationFn: (tours) => importMyTourBookTours(tours),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tours'] })
      setValue('')
    }
  })

  const handleImportTours = () => {
    if (value) {
      let tours = JSON.parse(value)
      if (bikeId) {
        tours = tours.map( (tour) => ({ ...tour, 'bikeId': bikeId }))
      }
      console.log(tours)
      addToursMutation.mutate(tours)
    }
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

  const handleBikeChange = (bike) => {
    bike? setBikeId(JSON.parse(bike).id) : setBikeId(null)
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
        <BikeSelector onBikeChange={handleBikeChange} />
        <JsonInput
          label="Your MyTourBook tour details"
          placeholder="Paste your tours exported as JSON from the Derby MTB database into this text field."
          value={value}
          onChange={handleJSONInputChnage}
          validationError="Invalid JSON"
          formatOnBlur
          autosize
          withAsterisk
          minRows={15}
        />
      </form>
      <Code>{validationErrorMessage}</Code>
      <Box>
      <Button
        onClick={toggle}
        color="teal"
        variant={ opened ? "default" : "light"}
        rightIcon={ !opened ? <IconArrowBadgeRight size={"1rem"} /> : <IconArrowBadgeUp size={"1rem"}/>}
      >
        {!opened && 'Display '}Export Instructions
      </Button>
      <Collapse in={opened}>
        <div>
          A proven method for extracting the tour data from the MyTourBook database is to use the DBeaver (https://dbeaver.io/) database tool.
        </div>
        <div>
          To be on the save side, make a complete copy of the Derby database folder. (On a Linux machine probably to be found at:<Code>~/.mytourbook/derby-database</Code>)
        </div>
        <div>
          Setup a new Derby Embedded DB Connection and direct it via path to the copy of the database folder. No user or password is needed.
          A more detailed setup instruction, including screenshots, can be found on the cetracker GH page (soon).
        </div>
        <div>
          Execute the SQL query below. Make adjustments to the <Code>WHERE</Code> clause to fit your DB.
        </div>
        <div>
          Right click on the query result table and <Code>Export</Code> the result in JSON Format.
        </div>
      </Collapse>
      </Box>
      <div>
        <Code block>{sqlExportQuery}</Code>
      </div>
    </>
  )
}

export default TourImport;
