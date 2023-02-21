import { Badge, Code, Flex, MantineProvider, Text } from '@mantine/core';
import ElementBox from './components/ElementBox/ElementBox';

const theme = {
  // Override any other properties from default theme
  colorScheme: 'light',
  fontFamily: 'Open Sans, sans serif',
  spacing: { xs: 15, sm: 20, md: 25, lg: 30, xl: 40 },
  headings: {
    fontFamily: 'Roboto, sans-serif',
    sizes: {
      h1: { fontSize: 30 },
    },
  },
}

const App = () => {
  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <Flex mih={30} justify="center" align="center" bg="gray.2" gap="md" >
        <Text>Great things to come.</Text>
        <Badge size='md'>Badge</Badge>
      </Flex>
      <Code>
        Code snippet
      </Code>
      <ElementBox />
    </MantineProvider>
  )
}

export default App
