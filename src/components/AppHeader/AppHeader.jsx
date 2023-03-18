import { ActionIcon, Container, Flex, Text } from "@mantine/core";
import { createStyles } from '@mantine/styles';
import { IconBrandCoinbase } from "@tabler/icons-react";
import { Link } from "react-router-dom";
import ColourSchemaControl from "./ColourSchemaControl";

const useStyles = createStyles((theme) => ({
  inner: {
    display: 'flex',
    justifyContent: 'space-between',
    height: '100%',
  },
}));



const AppHeader = () => {
  const { classes } = useStyles()

  return (
    <Container size="xl" px="md" className={classes.inner}>
      <Flex justify="flex-start" gap="md">
        <ActionIcon component={Link} to="/">
          <IconBrandCoinbase />
        </ActionIcon>
        <Text>Cycling Equipment Usage Tracker</Text>
      </Flex>
      <Flex justify="flex-end">
        <ColourSchemaControl />
      </Flex>
    </Container>
  )
}

export default AppHeader;
