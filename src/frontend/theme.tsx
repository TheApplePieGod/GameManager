import { createMuiTheme, responsiveFontSizes } from "@material-ui/core/styles";
import memoizeOne from "memoize-one";

export const FONT_FAMILY: string = 'Quicksand,sans-serif';
export const PALETTE_GREEN: string = "#599341";
export const PALETTE_WHITE: string = "#f9f9fb";
export const PALETTE_DARK_WHITE: string = "#f6f6f9";
export const PALETTE_LIGHT_BLUE: string = "#90caf9";
export const PALETTE_DARK_BLUE: string = "#1976d2";
export const PALETTE_LIGHT_GREY: string = "#b7b4ae";
export const PALETTE_GREY: string = "#363430";
export const PALETTE_DARK_GREY: string = "#2b2926";
export const PALETTE_BLACK: string = "#252422";
export const PALETTE_ORANGE: string = "#FCA311";
export const PALETTE_RED: string = "#FB3640";
export const PALETTE_YELLOW: string = "#E2D112";

export const createApplicationTheme = memoizeOne(() => {
	let theme = createMuiTheme({
		palette: {
			type: "dark",
			primary: {
				main: PALETTE_GREEN,
			},
			secondary: {
				main: PALETTE_ORANGE,
			},
			error: {
				main: PALETTE_RED,
			},
			text: {
				primary: PALETTE_WHITE,
				secondary: PALETTE_LIGHT_GREY,
			}
		},
		typography: {
			fontFamily: FONT_FAMILY,
		},
		// overrides: {
		// 	MuiPaper: {
		// 		root: {
		// 			backgroundColor: PALETTE_GREY
		// 		}
		// 	},
		// 	MuiCssBaseline: {
		// 		"@global": {
		// 			body: {
		// 				backgroundColor: PALETTE_BLACK
		// 			},
		// 		},
		// 	},
		// }
	});

	theme = responsiveFontSizes(theme);
	return theme;
});