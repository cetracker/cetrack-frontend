import { ActionIcon, useMantineColorScheme } from '@mantine/core';
import { IconMoon, IconSun } from '@tabler/icons-react';
import React from 'react';

const ColourSchemaControl = () => {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const dark = colorScheme === 'dark';

  return (
    <ActionIcon
      variant="outline"
      color={dark ? 'yellow' : 'blue'}
      onClick={() => toggleColorScheme()}
      title="Toggle color scheme"
    >
      {dark ? (
        <IconSun size={22} stroke={1.5} />
      ) : (
        <IconMoon size={22} stroke={1.5} />
      )}
    </ActionIcon>
  );
}

export default ColourSchemaControl;
