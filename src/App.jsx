import { AppShell, Header, MantineProvider, Navbar } from '@mantine/core';
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
        <AppShell
          padding="md"
          navbar={<Navbar width={{ base: 300 }} height={500} p="xs">{/* Navbar content */}</Navbar>}
          header={<Header height={60} p="xs">{/* Header content */}</Header>}
          styles={(theme) => ({
            main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
          })}
        >
          <PartList />
        </AppShell>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App
