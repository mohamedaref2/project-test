// Include the Apps Script API
/**
 * @OnlyCurrentDoc
 */

// --- UTILITY FUNCTIONS ---
// Get the active spreadsheet
function getActiveSpreadsheet() {
  return SpreadsheetApp.getActiveSpreadsheet();
}

// Get the sheet by name
function getSheetByName(sheetName) {
  return getActiveSpreadsheet().getSheetByName(sheetName);
}

// Get the script URL
function getScriptUrl() {
  return ScriptApp.getService().getUrl();
}

// --- INITIALIZATIONS ---
// Initialize the sheet and form settings
function initializeSheetAndForm() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName("Responses");

  // Check if the sheet exists
  if (!sheet) {
    sheet = ss.insertSheet("Responses");
    sheet.appendRow(["Timestamp", "Name", "Email", "Phone", "Image", "Notes", "PDF Link"]);
  }

  // Get the form URL
  var formUrl = ScriptApp.getService().getUrl();

  // Return the sheet and form URL
  return {
    sheet: sheet,
    formUrl: formUrl
  };
}

// ----------- NAVIGATE TO PREVIEW AFTER FILE CREATED -------------
function submitDataAndPreview(formData) {
  // 1. Process the form data, create the PDF(s), as usual.
  var filesCreated = createFiles(formData); // createFiles returns [{id, name, url},{...}]
  // 2. Send response to client-side JS to call showPreviewArea and scroll to PDFs.
  return {
    status: "success",
    files: filesCreated
  };
}

// You would call this instead of doSubmit in your client JS to get the file list, then call handleFormSubmitSuccess(files)

// -------- DOWNLOAD PDF (from preview) -----------
function downloadPdf(fileId, fileName) {
  try {
    var file = DriveApp.getFileById(decodeURIComponent(fileId));
    var blob = file.getBlob();
    var contentType = blob.getContentType();
    var bytes = blob.getBytes();
    var base64 = Utilities.base64Encode(bytes);
    var dataUrl = "data:" + contentType + ";base64," + base64;
    var html = '<html><head><title>' + fileName + '</title></head>' +
      '<body style="background:#fcfbff;margin:60px 0;text-align:center;font-family:sans-serif">' +
      '<a href="' + dataUrl + '" download="' + fileName + '" ' +
      'style="display:inline-block;font-size:1.17em;background:linear-gradient(90deg,#9b87f5,#1EAEDB 85%);color:#fff;padding:9px 26px 9px 17px;font-weight:600;border-radius:22px;text-decoration:none;box-shadow:0 4px 22px #9872e326;margin-top:30px;">' +
      '⬇️ تحميل ' + fileName + '</a></body></html>';
    var template = HtmlService.createHtmlOutput(html).setWidth(420).setHeight(300);
    return template;
  } catch (e) {
    return HtmlService.createHtmlOutput("خطأ أثناء التنزيل: " + e);
  }
}

// --- FORM SUBMISSION ---
// Handle form submission
function doSubmit(formData) {
  try {
    // Get the sheet
    var sheet = getSheetByName("Responses");

    // Get the image data
    var imageData = formData.image;

    // Decode the image data
    var imageBlob = Utilities.base64Decode(imageData.split(',')[1]);

    // Create a blob from the image data
    var blob = Utilities.newBlob(imageBlob, "image/png", "image.png");

    // Get the Drive folder
    var folder = DriveApp.getRootFolder();

    // Save the image to Drive
    var imageFile = folder.createFile(blob);

    // Get the image URL
    var imageUrl = imageFile.getUrl();

    // Create the PDF
    var pdfFile = createPdf(formData, imageUrl);

    // Get the PDF URL
    var pdfUrl = pdfFile.getUrl();

    // Append the data to the sheet
    sheet.appendRow([
      new Date(),
      formData.name,
      formData.email,
      formData.phone,
      imageUrl,
      formData.notes,
      pdfUrl
    ]);

    // Return a success message
    return HtmlService.createHtmlOutput("تم إرسال النموذج بنجاح!").setTitle("Success");
  } catch (e) {
    // Log the error
    Logger.log(e);

    // Return an error message
    return HtmlService.createHtmlOutput("حدث خطأ أثناء إرسال النموذج. يرجى المحاولة مرة أخرى.").setTitle("Error");
  }
}

// --- PDF CREATION ---
// Create the PDF file
function createPdf(formData, imageUrl) {
  // Create the HTML content
  var htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>نموذج PDF</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
        }
        h1 {
          color: #333;
        }
        p {
          color: #666;
        }
        img {
          max-width: 300px;
          height: auto;
        }
      </style>
    </head>
    <body>
      <h1>نموذج PDF</h1>
      <p><strong>الاسم:</strong> ${formData.name}</p>
      <p><strong>البريد الإلكتروني:</strong> ${formData.email}</p>
      <p><strong>رقم الهاتف:</strong> ${formData.phone}</p>
      <p><strong>ملاحظات:</strong> ${formData.notes}</p>
      <img src="${imageUrl}" alt="Image">
    </body>
    </html>
  `;

  // Create the PDF data
  var pdfData = Utilities.newBlob(htmlContent, MimeType.HTML).getDataAsString();
  var pdf = DriveApp.createFile("نموذج.pdf", pdfData, MimeType.HTML).getAs("application/pdf");

  // Return the PDF file
  return pdf;
}
