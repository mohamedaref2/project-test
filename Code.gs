function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('PDF Generator')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function doPost(e) {
  // Parse submission, ensure "groupNum", "serialNum" and all other fields are also captured
  var form = e.postData.type == 'application/json' ? JSON.parse(e.postData.contents) : e.parameter;

  // Modern: gather all necessary values
  var groupNum = form.groupNum || "";
  var serialNum = form.serialNum || "";
  
  // Get the form data
  var formData = {
    name: form.name,
    email: form.email,
    phone: form.phone,
    address: form.address,
    // Add other form fields as needed
  };
  
  // Handle file upload if present
  var fileBlob = null;
  if (form.profilePic) {
    fileBlob = form.profilePic;
  }
  
  // Process the data and generate PDFs
  var pdfFiles = generatePDFs(formData, fileBlob, groupNum, serialNum);
  
  // Return as JSON for front-end to use (showPreviewSection)
  return ContentService.createTextOutput(JSON.stringify({
    success: true,
    files: pdfFiles
  })).setMimeType(ContentService.MimeType.JSON);
}

function generatePDFs(formData, fileBlob, groupNum, serialNum) {
  // Create a folder to store the PDFs
  var folder = DriveApp.createFolder('Generated PDFs - ' + new Date().toISOString());
  
  // Generate different types of PDFs
  var files = [];
  
  // Example: Generate first PDF
  var pdf1 = createFirstPDF(formData, fileBlob, groupNum, serialNum);
  var file1 = folder.createFile(pdf1);
  file1.setName('Document 1.pdf');
  files.push({
    id: file1.getId(),
    name: file1.getName(),
    url: file1.getUrl()
  });
  
  // Example: Generate second PDF
  var pdf2 = createSecondPDF(formData, groupNum, serialNum);
  var file2 = folder.createFile(pdf2);
  file2.setName('Document 2.pdf');
  files.push({
    id: file2.getId(),
    name: file2.getName(),
    url: file2.getUrl()
  });
  
  return files;
}

function createFirstPDF(formData, fileBlob, groupNum, serialNum) {
  // Create PDF content
  var htmlContent = '<html><body>';
  htmlContent += '<h1>First Document</h1>';
  htmlContent += '<p>Name: ' + formData.name + '</p>';
  htmlContent += '<p>Email: ' + formData.email + '</p>';
  htmlContent += '<p>Phone: ' + formData.phone + '</p>';
  htmlContent += '<p>Address: ' + formData.address + '</p>';
  htmlContent += '<p>Group Number: ' + groupNum + '</p>';
  htmlContent += '<p>Serial Number: ' + serialNum + '</p>';
  
  // Add image if available
  if (fileBlob) {
    // Process image and add to PDF
    htmlContent += '<img src="' + fileBlob + '" alt="Profile Picture" />';
  }
  
  htmlContent += '</body></html>';
  
  // Convert HTML to PDF
  var pdfBlob = Utilities.newBlob(htmlContent, 'text/html', 'Document 1.pdf');
  return pdfBlob;
}

function createSecondPDF(formData, groupNum, serialNum) {
  // Create PDF content for second document
  var htmlContent = '<html><body>';
  htmlContent += '<h1>Second Document</h1>';
  htmlContent += '<p>Name: ' + formData.name + '</p>';
  htmlContent += '<p>Group Number: ' + groupNum + '</p>';
  htmlContent += '<p>Serial Number: ' + serialNum + '</p>';
  // Add more content as needed
  htmlContent += '</body></html>';
  
  // Convert HTML to PDF
  var pdfBlob = Utilities.newBlob(htmlContent, 'text/html', 'Document 2.pdf');
  return pdfBlob;
}

function downloadFile(fileId) {
  try {
    var file = DriveApp.getFileById(fileId);
    return file.getBlob();
  } catch (e) {
    return ContentService.createTextOutput(
      JSON.stringify({error: 'File not found or access denied'})
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
