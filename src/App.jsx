import { AppShell, ColorSchemeProvider, Header, MantineProvider, Navbar } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
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
  // spacing: { xs: '1rem', sm: '1.2rem', md: '1.8rem', lg: '2.2rem', xl: '2.8rem' },
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
    <ColorSchemeProvider colorScheme={colorScheme} toggleColorScheme={toggleColorScheme} >
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={{...theme, colorScheme}} withGlobalStyles withNormalizeCSS>
          <Notifications />
          <AppShell
            padding="md"
            navbar={<Navbar width={{ base: 180 }} height={330} p="xs" gap="10"> <NavigationContent/> </Navbar>}
            header={<Header height={60} p="xs"> <AppHeader/> </Header>}
            styles={(theme) => ({
              main: { backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0] },
            })}
          >
            <Outlet/>
          </AppShell>
        </MantineProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </ColorSchemeProvider>
  )
}

export default App
