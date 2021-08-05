// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, Tray, ipcMain, session } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as os from 'os';

const isPackaged = require('electron-is-packaged').isPackaged;

app.commandLine.appendSwitch('remote-debugging-port', '9999');
app.setAppUserModelId(process.execPath);

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;
let tray;
let isQuiting = false;

const reactDevToolsPath = path.join(os.homedir(), // verify this path
  "\\AppData\\Local\\Google\\Chrome\\User Data\\Profile 1\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi\\4.10.1_0"
);

async function createWindow () {
	// Create the browser window.
	if (process.env.NODE_ENV !== 'development' || app.isPackaged || isPackaged) {
		Menu.setApplicationMenu(null);
	} else {
		//await session.defaultSession.loadExtension(reactDevToolsPath);
	}
	mainWindow = new BrowserWindow({
		width: 1920,
		height: 1080,
		icon: path.resolve(__dirname, './favicon.ico'),
		webPreferences: {
			//sandbox: true,
			nodeIntegration: true,
			contextIsolation: false,
			backgroundThrottling: false
		}
	});


	// Open the DevTools.
	//mainWindow.webContents.openDevTools()

	// Emitted when the window is closed.
	mainWindow.on('closed', function(e) {
		mainWindow = null;
	})

	if (process.env.NODE_ENV === 'development' && !app.isPackaged && !isPackaged) {
		mainWindow.loadURL(`http://localhost:4000`);
	} else {
		mainWindow.loadURL(
			`file:\\\\${__dirname}\\index.html`
		);
	}
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  	app.quit()
} else {
	app.on('second-instance', (event, commandLine, workingDirectory) => {
		// Someone tried to run a second instance, we should focus our window.
		if (mainWindow) {
		if (mainWindow.isMinimized()) mainWindow.restore()
		if (!mainWindow.isVisible()) mainWindow.show()
			mainWindow.focus()
		}
	})

	app.on('ready', createWindow)
}
//app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
	// On macOS it is common for applications and their menu bar
	// to stay active until the user quits explicitly with Cmd + Q
	if (process.platform !== 'darwin') app.quit()
})

app.on('activate', function () {
	// On macOS it's common to re-create a window in the app when the
	// dock icon is clicked and there are no other windows open.
	if (mainWindow === null) createWindow()
})

// begin app code
// -----------------------------------------------------

ipcMain.handle('testFunction', async (event, param) => {
	return "test data";
});