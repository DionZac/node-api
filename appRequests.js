//*******************************************************************************************
// Server request handlers
//   check: http://getfuelux.com/
//*******************************************************************************************
var app         = require('./app.js');
var glib        = require('./glib.js');
var handler     = require('./handler.js');

const { google } = require('googleapis');
const multer	= require("multer");
const path = require('path');
const fs = require('fs');

const GOOGLE_DRIVE_FOLDER_ID = "1X9uQZvGOeUod_bvPS7UuKIYhpnsFThuk";

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const auth = new google.auth.GoogleAuth({
  scopes: SCOPES,
});

const driveService = google.drive({ version: 'v3', auth });

async function uploadToDrive(filePath, filename, parentFolderId) {
  try{
	const fileMetadata = {
    name: filename,
    parents: [parentFolderId], // ID of shared folder
  };

  const media = {
    mimeType: 'image/jpeg', // You can make this dynamic
    body: fs.createReadStream(filePath),
  };

  const response = await driveService.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id, webViewLink, webContentLink',
  });

  }
  catch(e){
	glib.serverlog(`Drive upload error : ${e}`);
  }

  return response.data;
}

// Configure storage for uploaded images
const image_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/images'); // folder to store uploads (make sure it exists)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});

const image_upload = multer({ storage: image_storage });

// Configure storage for uploaded images
const video_storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/videos'); // folder to store uploads (make sure it exists)
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // unique filename
  }
});

const video_upload = multer({ storage: video_storage });

var appReq      = {};
////////////////////////////////////////////////////////////
// API: Register handlers for requests
////////////////////////////////////////////////////////////

const handle_upload = async (req,res, upload, type) => {
  glib.serverlog(`Handling new upload`);
	const uploadedFiles = [];

	try{
		const uploadHandler = upload.array(type, 20);
		uploadHandler(req, res,async (err) => {
			if(err){
        glib.serverlog(`Failed to create temp local files....`);
        glib.serverlog(err);
				return res.status(509).send(`Upload error : ${err.message}`);
			}

			try {
  		    	for (const file of req.files) {
              glib.serverlog(`Uploading file to drive....`);
  		    	  const driveFile = await uploadToDrive(file.path, file.originalname, GOOGLE_DRIVE_FOLDER_ID);
  		    	  uploadedFiles.push(driveFile.webViewLink);
  		    	  fs.unlinkSync(file.path); // Delete local temp file
  		    	}
	    
  		    	res.status(200).send(`Uploaded to Google Drive:\n${uploadedFiles.join('\n')}`);
  		  	} catch (err) {
            glib.serverlog(`Faile to add file in drive....`);
  		    	glib.serverlog(err);
  		    	res.status(508).send('Error uploading to Google Drive.');
  		  	}
		})
	}

	catch(e){
		res.send(`Something went wrong : ${e}`)
	}
}

exports.uploadImages = async (req,res) => {
	handle_upload(req,res,image_upload, 'images');
}

exports.uploadVideos = async (req,res) => {
	handle_upload(req,res,video_upload, 'videos');
}


exports.login = async (req,res) => {
	let users = await db.users.get();

	// delete users[0]['rowid'];
	res.send(users[0]);
}
