
// Server-side functions for Google Apps Script

// Constants
const SPREADSHEET_ID = '1xJfs2f8roHCLJuNNJCuOsuoFOr9G0v6xN1paoL3cjZ8'; // معرّف جدول البيانات
const PDF_FOLDER_ID = '0987654321zyxwvutsrqponmlkjihgfedcba'; // معرف المجلد
const FAILED_ATTEMPTS_LIMIT = 5; // عدد المحاولات الخاطئة
const LOCKOUT_DURATION = 5 * 60 * 1000; // مدة الحظر بسبب الإسبام (5 دقائق)
const PDF_TEMPLATE_ID_1 = '1gukbJwN35ziQyb5OnsNeWJvP4ZLU_4X8LBAGIVTz3kE'; // قالب PDF الأول (للكشاف)
const PDF_TEMPLATE_ID_2 = '1czCXdBsOdEHV9LEaD2UlhF82nvlskfMiv5dGcjnPk0o'; // قالب PDF الثاني (للكشاف)
const PDF_TEMPLATE_ID_3 = '10qMk8dalG72juvwHk_4LmdQXAkz8fSHXLW3bshLL2Uo'; // قالب PDF الثالث (للجان)
const DELETE_TIME = 1440; // وقت الحذف بالدقائق - سيتم حذف الملفات بعد هذه المدة
const TEMP_FOLDER_NAME = 'temp_registration_files'; // اسم المجلد المؤقت

// متغيرات عالمية لتتبع المحاولات الفاشلة
const failedAttempts = {};
const lockedIPs = {};

// الحصول على صفحة المفاتيح
function getKeysSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName('المفاتيح') || ss.insertSheet('المفاتيح');
}

// الحصول على صفحة السجلات
function getRecordsSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName('السجلات') || ss.insertSheet('السجلات');
}

// التحقق من تهيئة جدول المفاتيح
function initializeKeysSheet() {
  const sheet = getKeysSheet();
  const headers = sheet.getRange(1, 1, 1, 3).getValues()[0];
  
  if (headers[0] !== 'key') {
    sheet.getRange(1, 1, 1, 3).setValues([
      ['key', 'rank', 'used']
    ]);
  }
}

// التحقق من تهيئة جدول السجلات
function initializeRecordsSheet() {
  const sheet = getRecordsSheet();
  const headers = sheet.getRange(1, 1, 1, 9).getValues()[0];
  
  if (headers[0] !== 'name') {
    sheet.getRange(1, 1, 1, 9).setValues([
      ['name', 'key', 'pdf1', 'pdf2', 'pdf3', 'teamNumber', 'serialNumber', 'rank', 'date']
    ]);
  }
}

// التأكد من وجود مجلد مؤقت للملفات
function ensureTempFolderExists() {
  try {
    const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
    
    if (folders.hasNext()) {
      return folders.next();
    } else {
      return DriveApp.createFolder(TEMP_FOLDER_NAME);
    }
  } catch (error) {
    Logger.log('خطأ في إنشاء المجلد المؤقت: ' + error.toString());
    return null;
  }
}

// حذف الملفات القديمة من المجلد المؤقت
function cleanupOldFiles() {
  try {
    const folder = ensureTempFolderExists();
    if (!folder) return;
    
    const cutoffTime = new Date().getTime() - (DELETE_TIME * 60 * 1000);
    const files = folder.getFiles();
    
    while (files.hasNext()) {
      const file = files.next();
      if (file.getDateCreated().getTime() < cutoffTime) {
        file.setTrashed(true);
      }
    }
  } catch (error) {
    Logger.log('خطأ في تنظيف الملفات القديمة: ' + error.toString());
  }
}

// التحقق من صلاحية المفتاح
function validateKey(key, clientIP) {
  try {
    // التحقق من الحظر بسبب الإسبام
    if (lockedIPs[clientIP] && lockedIPs[clientIP] > new Date().getTime()) {
      throw new Error('تم حظر وصولك مؤقتًا بسبب محاولات كثيرة خاطئة. يرجى المحاولة لاحقًا.');
    }
    
    // تهيئة جداول البيانات إذا لزم الأمر
    initializeKeysSheet();
    initializeRecordsSheet();
    
    // التحقق من وجود المفتاح في قاعدة البيانات
    const keysSheet = getKeysSheet();
    const keysData = keysSheet.getDataRange().getValues();
    
    // تخطي الصف الرئيسي
    const keysRecords = keysData.slice(1);
    
    // البحث عن المفتاح
    const keyRecord = keysRecords.find(row => row[0] === key);
    
    if (keyRecord) {
      // إعادة تعيين عدد المحاولات الفاشلة
      if (failedAttempts[clientIP]) {
        delete failedAttempts[clientIP];
      }
      
      const rank = keyRecord[1] || '';
      const isUsed = keyRecord[2] == 1;
      
      // استرجاع سجلات المستخدم السابقة (للقائد فقط)
      const previousFiles = [];
      
      if (rank === 'قائد') {
        const recordsSheet = getRecordsSheet();
        const recordsData = recordsSheet.getDataRange().getValues();
        const recordsRows = recordsData.slice(1);
        
        // البحث عن جميع السجلات ذات المفتاح
        const userRecords = recordsRows.filter(row => row[1] === key);
        
        // تنسيق السجلات السابقة للإرجاع
        userRecords.forEach(record => {
          previousFiles.push({
            name: record[0] || '',
            key: record[1] || '',
            pdf1: record[2] || null,
            pdf2: record[3] || null,
            pdf3: record[4] || null,
            teamNumber: record[5] || '',
            serialNumber: record[6] || '',
            rank: record[7] || '',
            date: record[8] || new Date().toLocaleString('ar-SA')
          });
        });
        
        // ترتيب السجلات حسب التاريخ تنازليًا
        previousFiles.sort((a, b) => {
          const dateA = new Date(a.date.replace(/[^0-9/:\s]/g, ''));
          const dateB = new Date(b.date.replace(/[^0-9/:\s]/g, ''));
          return dateB - dateA;
        });
      }
      
      // الحصول على وصف الرتبة
      let rankLabel = '';
      switch (rank) {
        case 'قائد':
          rankLabel = 'القائد الكشفي - القائدة الكشفية';
          break;
        case 'لجان':
          rankLabel = 'لجان التميز التنفيذي';
          break;
        case 'كشاف':
          rankLabel = 'الكشاف - فتاة الكشافة';
          break;
        default:
          rankLabel = '';
      }
      
      return {
        isValid: true,
        rank: rank,
        used: rank === 'قائد' ? false : isUsed, // القائد يمكنه دائمًا التعديل
        key: key,
        rankLabel: rankLabel,
        previousFiles: previousFiles
      };
    } else {
      // زيادة عدد المحاولات الفاشلة
      failedAttempts[clientIP] = (failedAttempts[clientIP] || 0) + 1;
      
      // إذا وصل المستخدم للحد الأقصى من المحاولات الفاشلة، قم بحظره مؤقتًا
      if (failedAttempts[clientIP] >= FAILED_ATTEMPTS_LIMIT) {
        lockedIPs[clientIP] = new Date().getTime() + LOCKOUT_DURATION;
        throw new Error('تم حظر وصولك مؤقتًا بسبب محاولات كثيرة خاطئة. يرجى المحاولة بعد 5 دقائق.');
      }
      
      throw new Error('المفتاح غير صحيح. يرجى التأكد من المفتاح والمحاولة مرة أخرى.');
    }
  } catch (error) {
    Logger.log('خطأ في التحقق من المفتاح: ' + error.toString());
    throw error;
  }
}

// معالجة النموذج مع الصورة
function processFormWithImage(formData) {
  try {
    // تهيئة جداول البيانات إذا لزم الأمر
    initializeKeysSheet();
    initializeRecordsSheet();
    
    // إنشاء ملفات PDF بناءً على الرتبة والبيانات
    let pdfResults = {
      pdf1: null,
      pdf2: null,
      pdf3: null
    };
    
    // توليد ملفات PDF المناسبة حسب الرتبة
    if (formData.rank === 'كشاف' || formData.rank === 'قائد') {
      // إنشاء PDF 1 (الشهادة)
      const certificate1Html = generateCertificateHtml(formData);
      const certificate1Blob = HtmlService.createHtmlOutput(certificate1Html)
        .getBlob()
        .setName(formData.name + '_certificate1.pdf');
      
      const certificate1File = DriveApp.getFolderById(PDF_FOLDER_ID)
        .createFile(certificate1Blob);
      
      pdfResults.pdf1 = certificate1File.getUrl();
      
      // إنشاء PDF 2 (البطاقة)
      const certificate2Html = generateIdCardHtml(formData);
      const certificate2Blob = HtmlService.createHtmlOutput(certificate2Html)
        .getBlob()
        .setName(formData.name + '_id_card.pdf');
      
      const certificate2File = DriveApp.getFolderById(PDF_FOLDER_ID)
        .createFile(certificate2Blob);
      
      pdfResults.pdf2 = certificate2File.getUrl();
    }
    
    // إنشاء PDF 3 (شهادة اللجان) للرتب 'لجان' أو 'قائد'
    if (formData.rank === 'لجان' || formData.rank === 'قائد') {
      const certificate3Html = generateCommitteeCertificateHtml(formData);
      const certificate3Blob = HtmlService.createHtmlOutput(certificate3Html)
        .getBlob()
        .setName(formData.name + '_committee.pdf');
      
      const certificate3File = DriveApp.getFolderById(PDF_FOLDER_ID)
        .createFile(certificate3Blob);
      
      pdfResults.pdf3 = certificate3File.getUrl();
    }
    
    // حفظ الصورة إذا تم توفيرها
    let imageUrl = '';
    if (formData.base64Image) {
      try {
        // استخراج محتوى Base64
        const base64Content = formData.base64Image.split(',')[1];
        
        // إنشاء ملف الصورة
        const imageBlob = Utilities.newBlob(
          Utilities.base64Decode(base64Content),
          formData.mimeType,
          formData.name + '_photo.' + (formData.mimeType === 'image/png' ? 'png' : 'jpg')
        );
        
        const imageFile = DriveApp.getFolderById(PDF_FOLDER_ID)
          .createFile(imageBlob);
        
        imageUrl = imageFile.getUrl();
      } catch (imgError) {
        Logger.log('خطأ في حفظ الصورة: ' + imgError.toString());
      }
    }
    
    // حفظ السجل في جدول البيانات
    const recordsSheet = getRecordsSheet();
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, Session.getScriptTimeZone(), "h:mm:ss a yyyy/MM/dd");
    
    const newRow = [
      formData.name,
      formData.key,
      pdfResults.pdf1 || '',
      pdfResults.pdf2 || '',
      pdfResults.pdf3 || '',
      formData.teamNumber || '',
      formData.serialNumber || '',
      formData.rank,
      formattedDate
    ];
    
    recordsSheet.appendRow(newRow);
    
    // تحديث حالة المفتاح للإشارة إلى أنه تم استخدامه (ما عدا للقائد)
    if (formData.rank !== 'قائد') {
      const keysSheet = getKeysSheet();
      const keysData = keysSheet.getDataRange().getValues();
      
      for (let i = 1; i < keysData.length; i++) {
        if (keysData[i][0] === formData.key) {
          keysSheet.getRange(i + 1, 3).setValue(1); // تعيين 'used' إلى 1
          break;
        }
      }
    }
    
    // تنظيف الملفات القديمة
    cleanupOldFiles();
    
    return pdfResults;
  } catch (error) {
    Logger.log('خطأ في معالجة النموذج: ' + error.toString());
    throw new Error('حدث خطأ أثناء معالجة النموذج: ' + error.message);
  }
}

// توليد قالب HTML للشهادة
function generateCertificateHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Amiri', 'Scheherazade', Arial, sans-serif;
          text-align: center;
          direction: rtl;
          padding: 40px;
          background-color: #f8f9fa;
        }
        .certificate {
          border: 10px solid #5a67d8;
          border-radius: 15px;
          padding: 30px;
          width: 700px;
          margin: 0 auto;
          background-color: #fff;
          box-shadow: 0 4px 20px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }
        .certificate-background {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          opacity: 0.05;
          z-index: 0;
          background-size: 200px;
          background-repeat: repeat;
          background-position: center;
        }
        .certificate-header {
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .certificate-title {
          font-size: 36px;
          font-weight: bold;
          color: #4a5568;
          margin-bottom: 20px;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.1);
        }
        .certificate-content {
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .certificate-name {
          font-size: 32px;
          font-weight: bold;
          color: #5a67d8;
          margin: 20px 0;
          padding: 10px 20px;
          display: inline-block;
          border-bottom: 2px solid #5a67d8;
          position: relative;
          z-index: 1;
        }
        .certificate-footer {
          margin-top: 40px;
          position: relative;
          z-index: 1;
        }
        .signature {
          margin-top: 40px;
          border-top: 2px solid #5a67d8;
          width: 200px;
          margin: 20px auto;
          padding-top: 15px;
          font-weight: bold;
          color: #4a5568;
        }
        .certificate-badge {
          position: absolute;
          bottom: 20px;
          right: 20px;
          width: 100px;
          height: 100px;
          background-color: #5a67d8;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          transform: rotate(-15deg);
          opacity: 0.7;
          z-index: 1;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-background"></div>
        <div class="certificate-header">
          <h1 class="certificate-title">شهادة تسجيل</h1>
        </div>
        <div class="certificate-content">
          <p>نشهد أن</p>
          <div class="certificate-name">${data.name}</div>
          
          ${data.rank === 'قائد' || data.rank === 'كشاف' ? `
            <p>
              فرقة رقم: ${data.teamNumber || ""}<br>
              الرقم التسلسلي: ${data.serialNumber || ""}
            </p>
          ` : ''}
          
          <p>قد أتم متطلبات التسجيل بنجاح</p>
        </div>
        <div class="certificate-footer">
          <p>تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}</p>
          <div class="signature">التوقيع</div>
        </div>
        <div class="certificate-badge">معتمد</div>
      </div>
    </body>
    </html>
  `;
}

// توليد قالب HTML لبطاقة الهوية
function generateIdCardHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Amiri', 'Scheherazade', Arial, sans-serif;
          direction: rtl;
          padding: 0;
          margin: 0;
          background-color: #f8f9fa;
        }
        .id-card {
          width: 340px;
          height: 540px;
          background: linear-gradient(135deg, #5a67d8 0%, #3c366b 100%);
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.2);
          margin: 20px auto;
          padding: 20px;
          position: relative;
          overflow: hidden;
          color: white;
        }
        .id-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="none" stroke="white" stroke-width="0.5"/></svg>');
          opacity: 0.1;
          z-index: 0;
        }
        .id-card-header {
          text-align: center;
          border-bottom: 2px solid rgba(255,255,255,0.3);
          padding-bottom: 15px;
          margin-bottom: 20px;
          position: relative;
          z-index: 1;
        }
        .id-card-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }
        .id-card-subtitle {
          font-size: 14px;
          opacity: 0.8;
          margin: 5px 0 0;
        }
        .id-card-photo {
          width: 120px;
          height: 120px;
          background-color: rgba(255,255,255,0.2);
          border-radius: 50%;
          margin: 0 auto 20px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 4px solid rgba(255,255,255,0.3);
          position: relative;
          z-index: 1;
        }
        .id-card-photo img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .id-card-photo::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          border-radius: 50%;
          box-shadow: inset 0 0 10px rgba(0,0,0,0.3);
        }
        .id-card-details {
          position: relative;
          z-index: 1;
        }
        .id-card-detail-row {
          display: flex;
          margin-bottom: 15px;
          background-color: rgba(255,255,255,0.1);
          padding: 10px;
          border-radius: 8px;
        }
        .id-card-detail-label {
          font-weight: bold;
          width: 110px;
        }
        .id-card-detail-value {
          flex: 1;
        }
        .id-card-barcode {
          margin-top: 25px;
          text-align: center;
          position: relative;
          z-index: 1;
        }
        .id-card-barcode-img {
          background: repeating-linear-gradient(90deg, #fff, #fff 2px, transparent 2px, transparent 4px);
          height: 50px;
          width: 200px;
          margin: 0 auto;
          border-radius: 4px;
        }
        .id-card-barcode-text {
          font-size: 12px;
          margin-top: 5px;
          letter-spacing: 1px;
        }
        .id-card-footer {
          position: absolute;
          bottom: 20px;
          left: 20px;
          right: 20px;
          text-align: center;
          font-size: 12px;
          color: rgba(255,255,255,0.7);
          border-top: 1px solid rgba(255,255,255,0.2);
          padding-top: 10px;
          z-index: 1;
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
            <div class="id-card-detail-value">
              ${data.rank === 'قائد' ? 'القائد الكشفي' : data.rank === 'كشاف' ? 'الكشاف' : 'لجنة التميز'}
            </div>
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
        </div>
        
        <div class="id-card-barcode">
          <div class="id-card-barcode-img"></div>
          <div class="id-card-barcode-text">${data.key}</div>
        </div>
        
        <div class="id-card-footer">
          صالحة حتى: ${new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toLocaleDateString('ar-SA')}
        </div>
      </div>
    </body>
    </html>
  `;
}

// توليد قالب HTML لشهادة اللجان
function generateCommitteeCertificateHtml(data) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Amiri', 'Scheherazade', Arial, sans-serif;
          text-align: center;
          direction: rtl;
          padding: 40px;
          background-color: #f8f9fa;
        }
        .certificate {
          border: 5px solid #805ad5;
          border-radius: 20px;
          padding: 40px;
          width: 700px;
          margin: 0 auto;
          background: linear-gradient(135deg, #fff 0%, #f3f4f6 100%);
          box-shadow: 0 10px 50px rgba(0,0,0,0.1);
          position: relative;
          overflow: hidden;
        }
        .certificate::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><polygon points="50 15, 60 40, 85 40, 65 55, 75 80, 50 65, 25 80, 35 55, 15 40, 40 40" fill="none" stroke="%23805ad5" stroke-width="0.5"/></svg>');
          opacity: 0.05;
          z-index: 0;
        }
        .certificate-header {
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
        }
        .certificate-title {
          font-size: 32px;
          font-weight: bold;
          color: #4c1d95;
          margin-bottom: 10px;
          text-decoration: none;
          border-bottom: 2px solid #805ad5;
          padding-bottom: 10px;
          display: inline-block;
          text-shadow: 1px 1px 1px rgba(0,0,0,0.1);
        }
        .certificate-subtitle {
          font-size: 18px;
          color: #6b7280;
          margin-top: 5px;
        }
        .certificate-content {
          font-size: 20px;
          line-height: 1.6;
          margin-bottom: 30px;
          position: relative;
          z-index: 1;
          color: #4b5563;
        }
        .certificate-name {
          font-size: 32px;
          font-weight: bold;
          color: #805ad5;
          margin: 20px 0;
          padding: 10px 20px;
          background-color: rgba(128, 90, 213, 0.1);
          border-radius: 10px;
          display: inline-block;
          position: relative;
          z-index: 1;
        }
        .certificate-footer {
          margin-top: 40px;
          display: flex;
          justify-content: space-between;
          position: relative;
          z-index: 1;
        }
        .signature-block {
          width: 200px;
          text-align: center;
        }
        .signature {
          border-top: 2px solid #805ad5;
          padding-top: 10px;
          font-weight: bold;
          color: #4b5563;
        }
        .signature-title {
          font-size: 14px;
          color: #6b7280;
          margin-top: 5px;
        }
        .certificate-seal {
          position: absolute;
          bottom: 30px;
          right: 40px;
          width: 150px;
          height: 150px;
          border: 3px solid #805ad5;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-15deg);
          font-weight: bold;
          color: #805ad5;
          opacity: 0.2;
          z-index: 0;
        }
        .certificate-ribbon {
          position: absolute;
          top: 0;
          left: 30px;
          width: 40px;
          height: 120px;
          background-color: #805ad5;
          opacity: 0.1;
          z-index: 0;
        }
        .certificate-ribbon::before,
        .certificate-ribbon::after {
          content: '';
          position: absolute;
          width: 40px;
          height: 40px;
          background-color: #805ad5;
          transform: rotate(45deg);
        }
        .certificate-ribbon::before {
          bottom: -20px;
          left: 0;
        }
        .certificate-ribbon::after {
          bottom: -20px;
          left: 0;
        }
      </style>
    </head>
    <body>
      <div class="certificate">
        <div class="certificate-ribbon"></div>
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

// سيرفر الملف HTML
function doGet() {
  // تنظيف الملفات القديمة عند تحميل الصفحة
  cleanupOldFiles();
  
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('نظام التسجيل')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

