import { createTheme, type ThemeOptions } from '@mui/material/styles'

const shared: ThemeOptions = {
  typography: {
    fontFamily: '"Open Sans", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Roboto", sans-serif' },
    h2: { fontFamily: '"Roboto", sans-serif' },
    h3: { fontFamily: '"Roboto", sans-serif' },
    h4: { fontFamily: '"Roboto", sans-serif' },
    h5: { fontFamily: '"Roboto", sans-serif' },
    h6: { fontFamily: '"Roboto", sans-serif' },
  },
  shape: { borderRadius: 6 },
  components: {
    MuiTableCell: {
      styleOverrides: {
        root: { paddingTop: 6, paddingBottom: 6 },
        head: { fontWeight: 600 },
      },
    },
    MuiButton: { defaultProps: { disableElevation: true } },
  },
}

export const lightTheme = createTheme({
  ...shared,
  palette: {
    mode: 'light',
    primary: { main: '#00897B' },
    secondary: { main: '#455A64' },
    background: { default: '#fafafa' },
  },
})

export const darkTheme = createTheme({
  ...shared,
  palette: {
    mode: 'dark',
    primary: { main: '#4DB6AC' },
    secondary: { main: '#90A4AE' },
  },
})
