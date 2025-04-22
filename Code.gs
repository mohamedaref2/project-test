
// Server-side functions for Google Apps Script

// Constants
const SPREADSHEET_ID = '1234567890abcdefghijklmnopqrstuvwxyz'; // Replace with your actual Spreadsheet ID
const PDF_FOLDER_ID = '0987654321zyxwvutsrqponmlkjihgfedcba'; // Replace with your actual folder ID

// Get the database sheet
function getSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName('Records') || ss.insertSheet('Records');
}

// Initialize the sheet with headers if needed
function initializeSheet() {
  const sheet = getSheet();
  const headers = sheet.getRange(1, 1, 1, 10).getValues()[0];
  
  if (headers[0] !== 'key') {
    sheet.getRange(1, 1, 1, 10).setValues([
      ['key', 'name', 'rank', 'teamNumber', 'serialNumber', 'gender', 'image', 'pdf1', 'pdf2', 'pdf3', 'date']
    ]);
  }
}

// Validate access key
function validateKey(key) {
  try {
    // Initialize sheet if needed
    initializeSheet();
    
    // Check if key exists in the database
    const sheet = getSheet();
    const data = sheet.getDataRange().getValues();
    
    // Skip headers
    const records = data.slice(1);
    
    // Find all records with this key
    const keyRecords = records.filter(row => row[0] === key);
    
    if (keyRecords.length > 0) {
      // Key exists, determine rank and if it's been used
      const rank = keyRecords[0][2] || '';
      
      // Format the previous files for returning
      const previousFiles = keyRecords.map(row => {
        return {
          name: row[1] || '',
          key: row[0] || '',
          pdf1: row[7] || null,
          pdf2: row[8] || null,
          pdf3: row[9] || null,
          teamNumber: row[3] || '',
          serialNumber: row[4] || '',
          gender: row[5] || '',
          date: row[10] || new Date().toISOString().split('T')[0]
        };
      }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by date desc
      
      return {
        isValid: true,
        rank: rank,
        used: keyRecords.some(row => row[7] !== ''), // Has PDF1 generated
        key: key,
        previousFiles: previousFiles
      };
    } else {
      // If key doesn't exist, we'll pretend it's valid for demonstration purposes
      // In a real app, you would return {isValid: false} here
      return {
        isValid: true,
        rank: Math.random() > 0.5 ? 'قائد' : 'كشاف',
        used: false,
        key: key,
        previousFiles: []
      };
    }
  } catch (error) {
    Logger.log('Error in validateKey: ' + error.toString());
    throw new Error('حدث خطأ أثناء التحقق من المفتاح');
  }
}

// Process form with image
function processFormWithImage(formData) {
  try {
    // Initialize sheet if needed
    initializeSheet();
    
    // Create PDFs based on rank and data
    let pdfResults = {
      pdf1: null,
      pdf2: null,
      pdf3: null
    };
    
    // Generate certificate (pdf1)
    const certificateHtml = generateCertificateHtml(formData);
    const certificateBlob = HtmlService.createHtmlOutput(certificateHtml)
      .getBlob()
      .setName(formData.name + '_certificate.pdf');
    
    const certificateFile = DriveApp.getFolderById(PDF_FOLDER_ID)
      .createFile(certificateBlob);
    
    pdfResults.pdf1 = certificateFile.getUrl();
    
    // Generate ID card (pdf2)
    const idCardHtml = generateIdCardHtml(formData);
    const idCardBlob = HtmlService.createHtmlOutput(idCardHtml)
      .getBlob()
      .setName(formData.name + '_id_card.pdf');
    
    const idCardFile = DriveApp.getFolderById(PDF_FOLDER_ID)
      .createFile(idCardBlob);
    
    pdfResults.pdf2 = idCardFile.getUrl();
    
    // Generate committee certificate (pdf3) for "لجان" or "قائد" ranks
    if (formData.rank === 'لجان' || formData.rank === 'قائد') {
      const committeeHtml = generateCommitteeCertificateHtml(formData);
      const committeeBlob = HtmlService.createHtmlOutput(committeeHtml)
        .getBlob()
        .setName(formData.name + '_committee.pdf');
      
      const committeeFile = DriveApp.getFolderById(PDF_FOLDER_ID)
        .createFile(committeeBlob);
      
      pdfResults.pdf3 = committeeFile.getUrl();
    }
    
    // Save image if provided
    let imageUrl = '';
    if (formData.base64Image) {
      try {
        // Extract base64 content
        const base64Content = formData.base64Image.split(',')[1];
        
        // Create image file
        const imageBlob = Utilities.newBlob(
          Utilities.base64Decode(base64Content),
          formData.mimeType,
          formData.name + '_photo.' + (formData.mimeType === 'image/png' ? 'png' : 'jpg')
        );
        
        const imageFile = DriveApp.getFolderById(PDF_FOLDER_ID)
          .createFile(imageBlob);
        
        imageUrl = imageFile.getUrl();
      } catch (imgError) {
        Logger.log('Error saving image: ' + imgError.toString());
      }
    }
    
    // Save record to spreadsheet
    const sheet = getSheet();
    const newRow = [
      formData.key,
      formData.name,
      formData.rank,
      formData.teamNumber || '',
      formData.serialNumber || '',
      formData.gender || '',
      imageUrl,
      pdfResults.pdf1,
      pdfResults.pdf2,
      pdfResults.pdf3 || '',
      new Date().toISOString().split('T')[0] // Today's date
    ];
    
    sheet.appendRow(newRow);
    
    return pdfResults;
  } catch (error) {
    Logger.log('Error in processFormWithImage: ' + error.toString());
    throw new Error('حدث خطأ أثناء معالجة النموذج');
  }
}

// Generate certificate HTML template
function generateCertificateHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          direction: rtl;
          padding: 40px;
        }
        .certificate {
          border: 10px solid #787878;
          padding: 25px;
          width: 700px;
          margin: 0 auto;
        }
        .certificate-header {
          margin-bottom: 20px;
        }
        .certificate-title {
          font-size: 36px;
          font-weight: bold;
          color: #333;
          margin-bottom: 20px;
        }
        .certificate-content {
          font-size: 18px;
          line-height: 1.5;
          margin-bottom: 30px;
        }
        .certificate-name {
          font-size: 28px;
          font-weight: bold;
          color: #5a67d8;
          margin: 20px 0;
        }
        .certificate-footer {
          margin-top: 30px;
          font-size: 14px;
        }
        .signature {
          margin-top: 40px;
          border-top: 1px solid #787878;
          width: 200px;
          margin: 0 auto;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-header">
          <h1 class="certificate-title">شهادة</h1>
        </div>
        <div class="certificate-content">
          <p>نشهد أن</p>
          <div class="certificate-name">${data.name}</div>
          
          ${data.rank === 'قائد' || data.rank === 'كشاف' ? `
            <p>
              فرقة رقم: ${data.teamNumber || ""}<br>
              الرقم التسلسلي: ${data.serialNumber || ""}
              ${data.gender ? `<br>النوع: ${data.gender}` : ''}
            </p>
          ` : ''}
          
          <p>قد أتم متطلبات التسجيل بنجاح</p>
        </div>
        <div class="certificate-footer">
          <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
          <div class="signature">التوقيع</div>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate ID card HTML template
function generateIdCardHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          direction: rtl;
          padding: 0;
          margin: 0;
        }
        .id-card {
          width: 320px;
          height: 480px;
          background-color: #fff;
          border-radius: 10px;
          box-shadow: 0 0 10px rgba(0,0,0,0.1);
          margin: 20px auto;
          padding: 20px;
          position: relative;
          overflow: hidden;
        }
        .id-card-header {
          text-align: center;
          border-bottom: 2px solid #5a67d8;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }
        .id-card-title {
          font-size: 18px;
          font-weight: bold;
          color: #5a67d8;
          margin: 0;
        }
        .id-card-subtitle {
          font-size: 14px;
          color: #666;
          margin: 5px 0 0;
        }
        .id-card-photo {
          width: 120px;
          height: 120px;
          background-color: #f0f0f0;
          border-radius: 50%;
          margin: 0 auto 15px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid #5a67d8;
        }
        .id-card-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .id-card-details {
          margin-top: 20px;
        }
        .id-card-detail-row {
          display: flex;
          margin-bottom: 10px;
        }
        .id-card-detail-label {
          font-weight: bold;
          width: 100px;
          color: #333;
        }
        .id-card-detail-value {
          flex: 1;
          color: #666;
        }
        .id-card-barcode {
          margin-top: 20px;
          text-align: center;
        }
        .id-card-footer {
          position: absolute;
          bottom: 15px;
          width: calc(100% - 40px);
          text-align: center;
          font-size: 12px;
          color: #999;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="id-card">
        <div class="id-card-header">
          <h1 class="id-card-title">بطاقة الهوية</h1>
          <p class="id-card-subtitle">نظام التسجيل</p>
        </div>
        
        <div class="id-card-photo">
          ${data.base64Image ? `<img src="${data.base64Image}" alt="صورة شخصية">` : 'بدون صورة'}
        </div>
        
        <div class="id-card-details">
          <div class="id-card-detail-row">
            <div class="id-card-detail-label">الاسم:</div>
            <div class="id-card-detail-value">${data.name}</div>
          </div>
          
          <div class="id-card-detail-row">
            <div class="id-card-detail-label">الرتبة:</div>
            <div class="id-card-detail-value">${data.rank}</div>
          </div>
          
          ${data.rank === 'قائد' || data.rank === 'كشاف' ? `
            <div class="id-card-detail-row">
              <div class="id-card-detail-label">رقم الفرقة:</div>
              <div class="id-card-detail-value">${data.teamNumber || ""}</div>
            </div>
            
            <div class="id-card-detail-row">
              <div class="id-card-detail-label">الرقم التسلسلي:</div>
              <div class="id-card-detail-value">${data.serialNumber || ""}</div>
            </div>
          ` : ''}
          
          ${data.gender ? `
            <div class="id-card-detail-row">
              <div class="id-card-detail-label">النوع:</div>
              <div class="id-card-detail-value">${data.gender}</div>
            </div>
          ` : ''}
        </div>
        
        <div class="id-card-barcode">
          <!-- Placeholder for barcode -->
          <div style="background: repeating-linear-gradient(90deg, #000, #000 2px, #fff 2px, #fff 4px); height: 40px; width: 200px; margin: 0 auto;"></div>
          <div style="font-size: 12px; margin-top: 5px;">${data.key}</div>
        </div>
        
        <div class="id-card-footer">
          صالحة حتى: ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('ar-SA')}
        </div>
      </div>
    </body>
    </html>
  `;
}

// Generate committee certificate HTML template
function generateCommitteeCertificateHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          direction: rtl;
          padding: 40px;
          background-color: #f9f9f9;
        }
        .certificate {
          border: 5px solid #5a67d8;
          border-radius: 15px;
          padding: 30px;
          width: 700px;
          margin: 0 auto;
          background-color: #fff;
          box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        .certificate-header {
          margin-bottom: 30px;
        }
        .certificate-title {
          font-size: 32px;
          font-weight: bold;
          color: #5a67d8;
          margin-bottom: 10px;
          text-decoration: underline;
        }
        .certificate-subtitle {
          font-size: 18px;
          color: #666;
        }
        .certificate-content {
          font-size: 18px;
          line-height: 1.6;
          margin-bottom: 30px;
        }
        .certificate-name {
          font-size: 28px;
          font-weight: bold;
          color: #333;
          margin: 20px 0;
          background-color: #f0f4ff;
          padding: 10px;
          border-radius: 5px;
          display: inline-block;
        }
        .certificate-footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
        }
        .signature-block {
          width: 200px;
          text-align: center;
        }
        .signature {
          border-top: 1px solid #333;
          padding-top: 10px;
          font-weight: bold;
        }
        .signature-title {
          font-size: 14px;
          color: #666;
          margin-top: 5px;
        }
        .certificate-seal {
          position: absolute;
          bottom: 30px;
          right: 40px;
          opacity: 0.2;
          width: 150px;
          height: 150px;
          border: 2px solid #5a67d8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-15deg);
          font-weight: bold;
          color: #5a67d8;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-header">
          <h1 class="certificate-title">شهادة اللجان</h1>
          <div class="certificate-subtitle">تقديراً للمشاركة والإنجاز</div>
        </div>
        
        <div class="certificate-content">
          <p>تشهد لجنة التنظيم بأن</p>
          <div class="certificate-name">${data.name}</div>
          
          <p>
            قد شارك${data.gender === 'قائدة' ? 'ت' : ''} بفعالية في أعمال اللجان
            ${data.teamNumber ? `<br>عن فرقة رقم: ${data.teamNumber}` : ''}
            ${data.serialNumber ? `<br>الرقم التسلسلي: ${data.serialNumber}` : ''}
          </p>
          
          <p>وذلك تقديراً لجهود${data.gender === 'قائدة' ? 'ها' : 'ه'} المتميزة وتعاون${data.gender === 'قائدة' ? 'ها' : 'ه'} المثمر</p>
        </div>
        
        <div class="certificate-footer">
          <div class="signature-block">
            <div class="signature">رئيس اللجنة</div>
            <div class="signature-title">التوقيع</div>
          </div>
          
          <div class="signature-block">
            <div class="signature">المشرف العام</div>
            <div class="signature-title">التوقيع</div>
          </div>
        </div>
        
        <div class="certificate-seal">ختم رسمي</div>
      </div>
    </body>
    </html>
  `;
}

// Function to serve the HTML file
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('نظام التسجيل')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
