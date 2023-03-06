import { Button, Flex } from '@mantine/core';
import { Link } from 'react-router-dom';

const NavigationContent = () => {
  return (
    <Flex direction="column" gap="xs" align="center" justify="flex-start">
      <Button component={Link} to="/parts">
        Parts
      </Button>
      <Button component={Link} to="/partTypes">
        Part Types
      </Button>
      <Button component={Link} to="/bikes">
        Bikes
      </Button>
      <Button component={Link} to="/tours">
        Tours
      </Button>
    </Flex>
  );
}

export default NavigationContent;
