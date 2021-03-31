import React from 'react';
import { createMuiTheme } from '@material-ui/core/styles';
import { ThemeProvider } from '@material-ui/styles';
import teal from '@material-ui/core/colors/teal';
import red from '@material-ui/core/colors/red';
import { RecoilRoot } from 'recoil';
import { BrowserRouter as Router } from 'react-router-dom';
import BaseLayout from './components/BaseLayout';
import './App.scss';

function App() {
  const theme = createMuiTheme({
    palette: {
      // type: 'dark',
      primary: {
        main: teal[500],
      },
      secondary: {
        main: red[500],
        //   main: confObj.current.theme.secondaryColor,
        //   contrastText: confObj.current.theme.contrastText,
      },
    },
    // overrides: {
    //   MuiPaper: {
    //     root: {
    //       backgroundColor: 'rgba(255,255,255,0.95)',
    //     },
    //   },
    // },
  });

  return (
    <div className="chc-app-container">
      <RecoilRoot>
        <ThemeProvider theme={theme}>
          <Router>
            <BaseLayout />
          </Router>
        </ThemeProvider>
      </RecoilRoot>
    </div>
  );
}

export default App;
