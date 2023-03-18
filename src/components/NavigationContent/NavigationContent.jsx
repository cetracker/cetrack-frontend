import { Box, NavLink } from '@mantine/core';
import { IconAB2, IconBike, IconMap, IconSettingsFilled, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';

const NavigationContent = () => {
  const [active, setActive] = useState('')
  return (
    <Box sx={{ width: 150 }}>
      <NavLink
        label="Parts"
        component={Link} to="/parts"
        icon={<IconSettingsFilled />}
        onClick={() => setActive('parts')}
        active={'parts' === active}
        color="teal"
        variant='filled'
      />
      <NavLink
        label="Part Types"
        component={Link} to="/partTypes"
        onClick={() => setActive('parttypes')}
        icon={<IconAB2 />}
        active={'parttypes' === active}
        color="teal"
        variant='filled'
      />
      <NavLink
        label="Bikes"
        component={Link} to="/bikes"
        icon={<IconBike />}
        onClick={() => setActive('bikes')}
        active={'bikes' === active}
        color="teal"
        variant='filled'
      />
      <NavLink
        label="Tours"
        component={Link} to="/tours"
        icon={<IconMap />}
        onClick={() => setActive('tours')}
        active={'tours' === active}
        color="teal"
        variant='filled'/>
      <NavLink
        label="Import Tours"
        component={Link} to="/tourImport"
        icon={<IconUpload />}
        onClick={() => setActive('tourimport')}
        active={'tourimport' === active}
        color="teal"
        variant='filled'
      />
    </Box>
  );
}

export default NavigationContent;
