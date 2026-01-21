import { ThemeProvider } from 'styled-components';

import { NavigationProvider } from 'globals/context/NavigationContext';
import { ProgressBarProvider } from 'globals/context/ProgressBar';
import { AppRouter } from 'containers/AppRouter';
import { base } from 'styles/themes/base';
import { GlobalStyle } from 'styles/global';
import { FontStyles } from 'styles/fonts';

/**
 * Main App part that sets up the application providers
 */
export const App = () => (
  <ThemeProvider theme={base}>
    <GlobalStyle />
    <FontStyles />
    <div className="app-root">
      <NavigationProvider>
        <ProgressBarProvider>
          <AppRouter />
        </ProgressBarProvider>
      </NavigationProvider>
    </div>
  </ThemeProvider>
);
