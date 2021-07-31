import React from 'react';
import ReactDom from 'react-dom';
import { CssBaseline, MuiThemeProvider } from "@material-ui/core";
import { Main } from "./components/main";
import { createBrowserHistory } from "history";
import { createApplicationTheme } from "./theme";

ReactDom.render(
    <MuiThemeProvider theme={createApplicationTheme()}>
        <Main />
    </MuiThemeProvider>
  , document.getElementById("root"));