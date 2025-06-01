import { useColorMode } from '@docusaurus/theme-common';
import { ThemeProvider, createTheme } from '@mui/material/styles';
const muiLightTheme = createTheme({ palette: { mode: 'light' } });
const muiDarkTheme = createTheme({ palette: { mode: 'dark' } });

/**
 * DinosaursのテーマとMUIのテーマカラーを合わせる.
 * @param param
 * @returns 
 */
export default function MuiTheme({children}): JSX.Element {
  const { colorMode } = useColorMode();
  const muiTheme = colorMode === 'dark' ? muiDarkTheme : muiLightTheme;

  return (
    <ThemeProvider theme={muiTheme}>
      {children}
    </ThemeProvider>
  );
};
