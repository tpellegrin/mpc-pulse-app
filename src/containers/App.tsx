import { ThemeProvider } from 'styled-components';

import { useDisableSelectionHardening } from 'hooks/useDisableSelectionHardening';
import { NavigationProvider } from 'globals/context/NavigationContext';
import { ProgressBarProvider } from 'globals/context/ProgressBar';
import { AppRouter } from 'containers/AppRouter';
import { base } from 'styles/themes/base';
import { GlobalStyle } from 'styles/global';
import { FontStyles } from 'styles/fonts';
import { PagePaddingStyles } from 'styles/PagePadding';
import { AnimationSeenProvider } from 'globals/context/AnimationSeen';

/**
 * Main App part that sets up the application providers
 */
export const App = () => {
  useDisableSelectionHardening();

  return (
    <ThemeProvider theme={base}>
      <GlobalStyle />
      <FontStyles />
      <PagePaddingStyles />
      <div className="app-root">
        <NavigationProvider>
          <ProgressBarProvider>
            <AnimationSeenProvider>
              <AppRouter />
            </AnimationSeenProvider>
          </ProgressBarProvider>
        </NavigationProvider>
      </div>
    </ThemeProvider>
  );
};
