import { MantineProvider, Text } from '@mantine/core';

const App = () => {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <Text>Great things to come.</Text>
    </MantineProvider>
  )
}

export default App
