// Modules to control application life and create native browser window
import { app, BrowserWindow, Menu, Tray, ipcMain, session, dialog } from 'electron';
import * as path from 'path';
import * as url from 'url';
import * as os from 'os';
import * as fs from 'fs';
import * as tar from "tar";
import * as tmp from "tmp-promise";

const isPackaged = require('electron-is-packaged').isPackaged;

app.commandLine.appendSwitch('ignore-certificate-errors');
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

let tempZippedFile = undefined;
ipcMain.handle('prepareUploadFile', async (event, isFolder) => {
	const files = await dialog.showOpenDialog(mainWindow, {
		properties: [isFolder ? "openDirectory" : "openFile"],
		defaultPath: ""
	});
	if (files.filePaths.length > 0) {
		try {
			if (tempZippedFile) {
				tempZippedFile.removeCallback();
				tempZippedFile = undefined;
			}

			event.sender.send('zippingFile');

			const srcPath = files.filePaths[0];
			let srcPathSplit = srcPath.split('\\');
			const fileName = srcPathSplit.pop();
			const tmpFile = tmp.fileSync({ keep: false });
			tempZippedFile = tmpFile;
			const tmpFileName = tmpFile.name;
			await tar.c({
				options: { preservePaths: false },
				gzip: true,
				file: tmpFileName,
				cwd: srcPathSplit.join("\\")
			}, [fileName]);

			const fileStats = fs.statSync(tmpFileName);
			const fileSize = fileStats.size; // bytes

			return { success: true, size: fileSize };
		} catch {}
	}

	return { success: false, size: 0 };
});

ipcMain.handle('uploadFile', async (event) => {
	if (tempZippedFile) {
		const tmpFileName = tempZippedFile.name; 

		const readStream = fs.createReadStream(tmpFileName, { encoding: "hex" });

		readStream.on('data', (data) => {
			event.sender.send('fileDataReceive', data);
		});
		readStream.on('error', (e) => {
			tempZippedFile.removeCallback();
			tempZippedFile = undefined;
			event.sender.send('fileDataFinished', { success: false });
		});
		readStream.on('end', () => {
			tempZippedFile.removeCallback();
			tempZippedFile = undefined;
			event.sender.send('fileDataFinished', { success: true });
		});
		readStream.on('open', () => {
			event.sender.send('fileDataStarted');
		})

		return;
	}
	event.sender.send('fileDataCancelled');
});