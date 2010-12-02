/**
 * This class provides access to the device camera.
 * @constructor
 */
function Camera() {
	this.success_callback = null;
	this.error_callback = null;
}

Camera.DisplayType = {
		DATA_URL: 0,
		DATA_URI: 1
};
/**
 * We use the Platform Services 2.0 API here. So we must include a portion of the
 * PS 2.0 source code (camera API).
 * @param {Function} successCallback
 * @param {Function} errorCallback
 * @param {Object} options
 */
Camera.prototype.getPicture = function(successCallback, errorCallback, options){
	try {
		if (!this.serviceObj) {
			this.serviceObj = com.nokia.device.load("", "com.nokia.device.camera", "");
		}
		if (!this.serviceObj) {
			throw {
				name: "CameraError",
				message: "could not load camera service"
			};
		}
		var obj = this;

		obj.display = options.displayType || Camera.DisplayType.DATA_URL;
		obj.success_callback = successCallback;
		obj.error_callback = errorCallback;
		this.serviceObj.startCamera( function(transactionID, errorCode, outPut) {
			//outPut should be an array of image urls (local), or an error code
			if (errorCode == 0) {
				if (obj.display == Camera.DisplayType.DATA_URL) {
					outPut = getImageBinaries(outPut);
					outPut = encode64(outPut);
				}

				obj.success_callback(outPut);
			}
			else {
				obj.error_callback({
					name: "CameraError",
					message: errorCode
				});
			}
		});

	} catch (ex) {
		errorCallback.call(ex);
	}

};

if (typeof navigator.camera == "undefined") navigator.camera = new Camera();


/**
 * Get the image (of file) binaries. Only tested on the camera images.
 * NOT working for images of 2MP and 5MP.
 * Working for images of 0.3 MP. Other resolutions have not been tested yet.
 * 
 * A big thanks goes to Marcus Granado (http://web.archive.org/web/20071103070418/http://mgran.blogspot.com/2006/08/downloading-binary-streams-with.html)
 * for his research on this topic.
 * 
 * @param url
 * @returns		binaries of the file.
 */
function getImageBinaries(url) { //synchronous binary downloader
	var req = new XMLHttpRequest();
	req.open("GET", url, false);
	// Do NOT use x-user-defined. We can't rely on that charset.
	req.overrideMimeType('text/plain; charset=us-ascii');
	req.send("");
	if (req.status != 200) {
		return "";
	}
	var t = req.responseText || "" ;
	var b = getCorrectBin(t);
	return b;
}

/**
 * A function to repair image binaries we get using the us-ascii codec.
 * All we do is map the garbage bytes back to usefull bytes.
 * 
 * @param input
 * @returns {String}
 */
function getCorrectBin(input)
{
	var conversion = {
			8364 : 128,
			8218 : 130,
			402 : 131,
			8222 : 132,
			8230 : 133,
			8224 : 134,
			8225 : 135,
			710 : 136,
			8240 : 137,
			352 : 138,
			8249 : 139,
			338 : 140,
			381 : 142,
			8216 : 145,
			8217 : 146,
			8220 : 147,
			8221 : 148,
			8226 : 149,
			8211 : 150,
			8212 : 151,
			732 : 152,
			8482 : 153,
			353 : 154,
			8250 : 155,
			339 : 156,
			382 : 158,
			376 : 159
		};
	var output = "";
	for (var i =0; i < input.length; i++) {
		var charCode = input.charCodeAt(i);

		if (charCode in conversion) {
			output += String.fromCharCode(conversion[charCode]);
		} else {
			output += input[i];
		}
	}
	return output;
}

/**
 * Encode the string or binaries to a base64 string.
 * @param inputStr
 * @returns {String}
 */
function encode64(inputStr)
{
	var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	var outputStr = "";
	var i = 0;

	while (i<inputStr.length)
	{
//		all three "& 0xff" added below are there to fix a known bug
//		with bytes returned by xhr.responseText
		var byte1 = inputStr.charCodeAt(i++) & 0xff;
		var byte2 = inputStr.charCodeAt(i++) & 0xff;
		var byte3 = inputStr.charCodeAt(i++) & 0xff;

		var enc1 = byte1 >> 2;
		var enc2 = ((byte1 & 3) << 4) | (byte2 >> 4);

		var enc3, enc4;
		if (isNaN(byte2))
		{
			enc3 = enc4 = 64;
		}
		else
		{
			enc3 = ((byte2 & 15) << 2) | (byte3 >> 6);
			if (isNaN(byte3))
			{
				enc4 = 64;
			}
			else
			{
				enc4 = byte3 & 63;
			}
		}

		outputStr +=  b64.charAt(enc1) + b64.charAt(enc2) + b64.charAt(enc3) + b64.charAt(enc4);
	}

	return outputStr;
}