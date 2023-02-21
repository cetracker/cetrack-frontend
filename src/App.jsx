import { MantineProvider } from '@mantine/core';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import PartList from './components/PartList/PartList';

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

const queryClient = new QueryClient()

const App = () => {
  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <QueryClientProvider client={queryClient}>
        <PartList />
        <ReactQueryDevtools />
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App
