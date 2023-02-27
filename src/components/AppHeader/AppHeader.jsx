import { Center, Container, Text } from "@mantine/core";
import { createStyles } from '@mantine/styles';
import ColourSchemaControl from "./ColourSchemaControl";

const useStyles = createStyles((theme) => ({
  inner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
}));



const AppHeader = () => {
  const { classes } = useStyles()

  return (
    <Container size="xl" px="md" className={classes.inner}>
        <Text>Cycling Equipment Usage Tracker</Text>
        <Center>
          <ColourSchemaControl />
        </Center>
    </Container>
  )
}

export default AppHeader;
