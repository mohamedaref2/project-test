
const FAILED_ATTEMPTS_LIMIT = 5; // عدد المحاولات الخاطئة
const LOCKOUT_DURATION = 5 * 60 * 1000; // مدة الحظر بسبب الإسبام (5 دقائق)
const SPREADSHEET_ID = '1xJfs2f8roHCLJuNNJCuOsuoFOr9G0v6xN1paoL3cjZ8'; // معرّف جدول البيانات
const PDF_TEMPLATE_ID_1 = '1gukbJwN35ziQyb5OnsNeWJvP4ZLU_4X8LBAGIVTz3kE'; // قالب PDF الأول (للكشاف)
const PDF_TEMPLATE_ID_2 = '1czCXdBsOdEHV9LEaD2UlhF82nvlskfMiv5dGcjnPk0o'; // قالب PDF الثاني (للكشاف)
const PDF_TEMPLATE_ID_3 = '10qMk8dalG72juvwHk_4LmdQXAkz8fSHXLW3bshLL2Uo'; // قالب PDF الثالث (للجان)
const DELETE_TIME = 1440; // وقت الحذف بالدقائق - سيتم حذف الملفات بعد هذه المدة
const TEMP_FOLDER_NAME = 'temp_registration_files'; // اسم المجلد المؤقت

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .setTitle('نظام التسجيل الإلكتروني')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// ========== الحصول على جدول البيانات ==========
function getSpreadsheet() {
  if (SPREADSHEET_ID) {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  }
  return SpreadsheetApp.getActive();
}

// ========== الحصول على أو إنشاء مجلد مؤقت ==========
function getTempFolder() {
  try {
    // محاولة العثور على المجلد
    const folders = DriveApp.getFoldersByName(TEMP_FOLDER_NAME);
    
    // إذا وجدنا المجلد، نستخدمه
    if (folders.hasNext()) {
      return folders.next();
    }
    
    // إنشاء مجلد جديد إذا لم يكن موجوداً
    return DriveApp.createFolder(TEMP_FOLDER_NAME);
  } catch (e) {
    Logger.log('خطأ في الوصول للمجلد المؤقت: ' + e.message);
    // استخدام المجلد الجذر في حالة الفشل
    return DriveApp.getRootFolder();
  }
}

// ========== تنظيف الملفات القديمة ==========
function cleanupOldFiles() {
  try {
    const tempFolder = getTempFolder();
    const files = tempFolder.getFiles();
    const currentTime = new Date().getTime();
    const expirationTime = DELETE_TIME * 60 * 1000; // تحويل الدقائق إلى ميلي ثانية
    let deletedCount = 0;
    
    while (files.hasNext()) {
      const file = files.next();
      const fileDate = file.getDateCreated().getTime();
      
      // حذف الملفات التي تجاوزت الوقت المحدد
      if ((currentTime - fileDate) > expirationTime) {
        file.setTrashed(true);
        deletedCount++;
      }
    }
    
    Logger.log(`تم تنظيف ${deletedCount} ملفات قديمة`);
    return deletedCount;
  } catch (e) {
    Logger.log('خطأ في تنظيف الملفات القديمة: ' + e.message);
    return 0;
  }
}

// ========== التحقق من المفتاح ==========
function validateKey(key) {
  try {
    const cache = CacheService.getScriptCache();
    const ip = Session.getActiveUser().getEmail() || 'anonymous';

    // التحقق من تجاوز عدد المحاولات
    if (parseInt(cache.get(ip) || '0') >= FAILED_ATTEMPTS_LIMIT) {
      throw('تم تجاوز عدد المحاولات، الرجاء الانتظار 5 دقائق');
    }

    // تنسيق المفتاح
    key = (key || '').toString().trim();
    
    // تسجيل بيانات التنفيذ للتصحيح
    Logger.log('Validating key: ' + key);
    
    // الوصول إلى صفحة المفاتيح
    const sheet = getSpreadsheet().getSheetByName('المفاتيح');
    if (!sheet) {
      Logger.log('لم يتم العثور على صفحة المفاتيح');
      throw('لا يمكن العثور على صفحة المفاتيح');
    }

    const lastRow = sheet.getLastRow();
    Logger.log('Last row in sheet: ' + lastRow);
    
    if (lastRow === 0) {
      Logger.log('الصفحة فارغة');
      throw('صفحة المفاتيح فارغة');
    }

    // الحصول على كافة البيانات المطلوبة
    const keyRange = sheet.getRange(1, 1, lastRow, 1);
    const rankRange = sheet.getRange(1, 2, lastRow, 1);
    const usedRange = sheet.getRange(1, 3, lastRow, 1);
    
    const keys = keyRange.getValues().flat().map(k => k.toString().trim());
    const ranks = rankRange.getValues().flat().map(r => r.toString().trim());
    const used = usedRange.getValues().flat().map(u => u.toString().trim());
    
    Logger.log('Available keys: ' + JSON.stringify(keys));
    
    // البحث عن المفتاح
    const index = keys.indexOf(key);
    Logger.log('Key index: ' + index);
    
    if (index === -1) {
      // إذا لم يتم العثور على المفتاح، زيادة عداد المحاولات الخاطئة
      const attempts = parseInt(cache.get(ip) || '0') + 1;
      cache.put(ip, attempts.toString(), 5 * 60); // تخزين لمدة 5 دقائق
      throw('المفتاح غير صحيح');
    }

    // تحقق مما إذا كان المفتاح قد تم استخدامه
    const isUsed = used[index] === '1';
    
    // الحصول على الرتبة
    const rank = ranks[index];

    // البحث عن السجلات السابقة للمستخدم (فقط إذا كان قائد)
    let previousFiles = [];
    if (isUsed || rank === 'قائد') {
      previousFiles = getPreviousFiles(key);
    }

    return {
      isValid: true,
      key: key,
      rank: rank,
      used: isUsed,
      index: index + 1,  // +1 لأن الصفوف في Sheets تبدأ من 1
      previousFiles: previousFiles
    };

  } catch (error) {
    Logger.log('validateKey error: ' + error.message);
    throw error;
  }
}

// ========== الحصول على الملفات السابقة للمستخدم ==========
function getPreviousFiles(key) {
  try {
    // الوصول إلى صفحة السجلات
    const logSheet = getSpreadsheet().getSheetByName('السجلات');
    if (!logSheet) {
      return [];
    }

    // البحث عن جميع السجلات التي تحتوي على المفتاح المحدد
    const records = logSheet.getDataRange().getValues();
    
    // تصفية السجلات حسب المفتاح
    const results = records.filter(row => row[1] === key)
      .map(row => {
        // التحقق من وجود الروابط
        const pdf1Url = row[2] || null;
        const pdf2Url = row[3] || null;
        const pdf3Url = row[4] || null;
        const date = row[5] instanceof Date ? row[5] : new Date();
        
        return {
          name: row[0],
          key: row[1],
          pdf1: pdf1Url,
          pdf2: pdf2Url,
          pdf3: pdf3Url,
          date: date.toLocaleDateString('ar-SA')
        };
      });
    
    return results.reverse(); // إرجاع الأحدث أولاً
  } catch (e) {
    Logger.log('خطأ في جلب الملفات السابقة: ' + e.message);
    return [];
  }
}

// ========== معالجة النموذج مع الصورة ==========
function processFormWithImage(data) {
  let imageId = null;
  let tempDocIds = [];

  try {
    // تنظيف الملفات القديمة قبل إنشاء ملفات جديدة
    cleanupOldFiles();
    
    // استخراج البيانات
    const { name, base64Image, mimeType, key, rank, gender } = data;
    Logger.log(base64Image);
    // التحقق من الاسم
    if (!name || name.length > 100) {
      throw('الاسم غير صحيح أو طويل جداً');
    }
    
    // حفظ الصورة في Google Drive
    imageId = saveImage(base64Image, mimeType);
    
    if (!imageId) {
      throw('فشل في حفظ الصورة');
    }
    
    // تحديد أي ملفات PDF سيتم إنشاؤها استنادًا إلى الرتبة
    let pdf1Url = null;
    let pdf2Url = null;
    let pdf3Url = null;
    
    // إنشاء ملفات PDF حسب الرتبة
    if (rank === 'كشاف' || rank === 'قائد') {
      const pdf1Result = createPdfFromTemplate(PDF_TEMPLATE_ID_1, name, gender);
      pdf1Url = pdf1Result.pdf.getUrl();
      tempDocIds = [...tempDocIds, ...pdf1Result.tempIds];
      
      const pdf2Result = createPdfWithImageFromTemplate(PDF_TEMPLATE_ID_2, name, imageId, gender);
      pdf2Url = pdf2Result.pdf.getUrl();
      tempDocIds = [...tempDocIds, ...pdf2Result.tempIds];
    }
    
    if (rank === 'لجان' || rank === 'قائد') {
      const pdf3Result = createPdfFromTemplate(PDF_TEMPLATE_ID_3, name, gender);
      pdf3Url = pdf3Result.pdf.getUrl();
      tempDocIds = [...tempDocIds, ...pdf3Result.tempIds];
    }
    
    // تسجيل البيانات في جدول البيانات
    const logSheet = getSpreadsheet().getSheetByName('السجلات');
    logSheet.appendRow([name, key, pdf1Url, pdf2Url, pdf3Url, new Date()]);
    
    // تحديث حالة الاستخدام للمفتاح (إذا لم يكن قائد)
    if (rank !== 'قائد') {
      const keySheet = getSpreadsheet().getSheetByName('المفاتيح');
      const keyData = validateKey(key);
      keySheet.getRange(keyData.index, 3).setValue('1'); // تحديث حالة الاستخدام
    }
    
    return { 
      pdf1: pdf1Url, 
      pdf2: pdf2Url,
      pdf3: pdf3Url
    };
    
  } catch (e) {
    Logger.log('خطأ في معالجة النموذج: ' + e.message);
    throw('فشل معالجة النموذج');
  } finally {
    // حذف ملف الصورة المؤقت (إذا كان لا يزال موجودًا)
    if (imageId) {
      try {
        DriveApp.getFileById(imageId).setTrashed(true);
      } catch(err) {
        Logger.log('فشل حذف الصورة المؤقتة: ' + err.message);
      }
    }
    
    // حذف المستندات المؤقتة
    tempDocIds.forEach(id => {
      try {
        DriveApp.getFileById(id).setTrashed(true);
      } catch(err) {
        Logger.log('فشل حذف المستند المؤقت: ' + err.message);
      }
    });
  }
}

// ========== حفظ الصورة ==========
function saveImage(base64Image, mimeType) {
  try {
    // لو السطر يحتوي على "data:image" بنشيل الجزء التعريفي
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    // تحويل إلى Blob
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, 'photo.' + mimeType.split('/')[1]);

    // رفع الصورة لجوجل درايف
    const file = DriveApp.createFile(blob);
    return file.getId();

  } catch (e) {
    Logger.log('خطأ في حفظ الصورة: ' + e.message);
    throw new Error('Could not decode string.');
  }
}


// ========== دوال إنشاء PDF ==========
function createPdfFromTemplate(templateId, name, gender) {
  const tempIds = [];
  try {
    // إنشاء نسخة مؤقتة من النموذج
    const templateFile = DriveApp.getFileById(templateId);
    const tempFolder = getTempFolder();
    const tempFile = templateFile.makeCopy(`Temp_${name}_${Date.now()}`, tempFolder);
    tempIds.push(tempFile.getId());
    
    const doc = DocumentApp.openById(tempFile.getId());
    const body = doc.getBody();
    
    // استبدال الاسم والنوع إذا وجد
    body.replaceText('{الاسم}', name);
    if (gender) {
      body.replaceText('{النوع}', gender);
    }
    
    doc.saveAndClose();
    
    // تحويل المستند المؤقت إلى PDF
    const pdfBlob = tempFile.getAs('application/pdf');
    const pdfFile = tempFolder.createFile(pdfBlob.setName(`Certificate_${name}_${Date.now()}.pdf`));
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); 
    
    return { pdf: pdfFile, tempIds: tempIds };
  } catch (e) {
    Logger.log('خطأ في إنشاء PDF: ' + e.message);
    throw('فشل إنشاء المستند ');
  }
}

function createPdfWithImageFromTemplate(templateId, name, imageUrl, gender) {
  const tempIds = [];
  try {
    // إنشاء نسخة مؤقتة من النموذج
    const templateFile = DriveApp.getFileById(templateId);
    const tempFolder = getTempFolder();
    const tempFile = templateFile.makeCopy(`Temp_${name}_${Date.now()}`, tempFolder);
    tempIds.push(tempFile.getId());
    
    const doc = DocumentApp.openById(tempFile.getId());
    const body = doc.getBody();
    
    // استبدال الاسم والنوع إذا وجد
    body.replaceText('{الاسم}', name);
    if (gender) {
      body.replaceText('{النوع}', gender);
    }

    // البحث عن مكان الصورة
    const imagePlaceholder = body.findText('{الصورة}');
    
    if (!imagePlaceholder) {
      throw('لم يتم العثور على مكان الصورة في القالب');
    }

    const element = imagePlaceholder.getElement();
    const parent = element.getParent();
    const index = parent.getChildIndex(element);

    // التحقق من الفهرس
    if (index < 0 || index >= parent.getNumChildren()) {
      throw('موضع الصورة غير صحيح في القالب');
    }

    // إزالة العنصر النائب
    parent.removeChild(element);

    // الحصول على ملف الصورة
    const imageFile = DriveApp.getFileById(imageUrl);
    const blob = imageFile.getBlob();

    // التحقق من صحة الصورة
    if (!blob || blob.getBytes().length === 0) {
      throw('ملف الصورة غير صالح أو فارغ');
    }

    // إدراج الصورة مع التحكم في الحجم
    const image = parent.insertInlineImage(index, blob);
    
    // الحفاظ على نسبة العرض إلى الارتفاع
    const originalWidth = image.getWidth();
    const originalHeight = image.getHeight();
    
    if (originalWidth === 0 || originalHeight === 0) {
      throw('أبعاد الصورة غير صالحة');
    }
    
    const aspectRatio = originalWidth / originalHeight;
    const newWidth = 200; // يمكن تعديل القيمة حسب الحاجة
    image.setWidth(newWidth).setHeight(newWidth / aspectRatio);

    doc.saveAndClose();
    
    // تحويل المستند المؤقت إلى PDF
    const pdfBlob = tempFile.getAs('application/pdf');
    const pdfFile = tempFolder.createFile(pdfBlob.setName(`ID_${name}_${Date.now()}.pdf`));
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); 
    
    return { pdf: pdfFile, tempIds: tempIds };
  } catch (e) {
    Logger.log('خطأ في إنشاء PDF مع صورة: ' + e.message);
    throw('فشل إنشاء البطاقة ');
  }
}

// ========== تشغيل عملية التنظيف بشكل دوري ==========
function setupTrigger() {
  // حذف أي مشغلات موجودة مسبقاً لتجنب التكرار
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'cleanupOldFiles') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
  
  // إنشاء مشغل جديد يعمل كل ساعة
  ScriptApp.newTrigger('cleanupOldFiles')
    .timeBased()
    .everyHours(1)
    .create();
  
  return "تم إعداد عملية التنظيف التلقائي بنجاح";
}

// ========== تشغيل عملية التنظيف عند تشغيل النموذج ==========
function onOpen() {
  cleanupOldFiles();
}
