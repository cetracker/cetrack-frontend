import { AppShell, ColorSchemeProvider, Header, MantineProvider, Navbar } from '@mantine/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import axios from 'axios';
import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './components/AppHeader/AppHeader';
import NavigationContent from './components/NavigationContent/NavigationContent';
import { queryClient } from './main';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.headers.common['Accept'] = 'application/json'
axios.defaults.headers.post['Content-Type'] = 'application/json'

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
  const [colorScheme, setColorScheme] = useState('light');
  const toggleColorScheme = (value) =>
    setColorScheme(value || (colorScheme === 'dark' ? 'light' : 'dark'));

  return (
    <MantineProvider theme={theme} withGlobalStyles withNormalizeCSS>
      <QueryClientProvider client={queryClient}>
      <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} >
          <AppShell
            padding="md"
            navbar={<Navbar width={{ base: 180 }} height={300} p="xs" gap="10"> <NavigationContent/> </Navbar>}
            header={<Header height={60} p="xs"> <AppHeader/> </Header>}
            styles={(theme) => ({
              main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
            })}
          >
            <Outlet/>
          </AppShell>
        </ColorSchemeProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </MantineProvider>
  )
}

export default App
