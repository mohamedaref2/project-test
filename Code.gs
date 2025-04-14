
const FAILED_ATTEMPTS_LIMIT = 5;
const LOCKOUT_DURATION = 5 * 60 * 1000; // 5 دقائق
const SPREADSHEET_ID = null; // قم بوضع معرّف جدول البيانات الخاص بك هنا
const PDF_TEMPLATE_ID_1 = '1gukbJwN35ziQyb5OnsNeWJvP4ZLU_4X8LBAGIVTz3kE';
const PDF_TEMPLATE_ID_2 = '1czCXdBsOdEHV9LEaD2UlhF82nvlskfMiv5dGcjnPk0o';
const DELETE_TIME = 180; // minutes - سيتم حذف الملفات بعد هذه المدة
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

    if (parseInt(cache.get(ip) || '0') >= FAILED_ATTEMPTS_LIMIT) {
      throw new Error('تم تجاوز عدد المحاولات، الرجاء الانتظار 5 دقائق');
    }

    key = (key || '').toString().trim();
    const sheet = getSpreadsheet().getSheetByName('المفاتيح');
    const keys = sheet.getRange(1, 1, sheet.getLastRow(), 1)
      .getValues()
      .flat()
      .map(k => k.toString().trim());

    const isValid = keys.includes(key);

    if (!isValid) {
      const attempts = parseInt(cache.get(ip) || '0') + 1;
      cache.put(ip, attempts.toString(), 5 * 60); // LOCKOUT_DURATION/1000
      throw new Error('المفتاح غير صحيح');
    }

    return true;

  } catch (error) {
    console.error('validateKey error:', error);
    throw error;
  }
}

// ========== معالجة النموذج مع الصورة ==========
function processFormWithImage(name, base64Image, mimeType) {
  let imageId = null;
  let tempDocIds = [];
  
  try {
    // تنظيف الملفات القديمة قبل إنشاء ملفات جديدة
    cleanupOldFiles();
    
    // التحقق من الاسم
    if (!name || name.length > 100) {
      throw new Error('الاسم غير صحيح أو طويل جداً');
    }
    
    // حفظ الصورة في Google Drive
    imageId = saveImage(base64Image, mimeType);
    
    if (!imageId) {
      throw new Error('فشل في حفظ الصورة');
    }
    
    // تسجيل البيانات في جدول البيانات
    const logSheet = getSpreadsheet().getSheetByName('السجلات');
    logSheet.appendRow([name, imageId, new Date()]);
    
    // إنشاء ملفات PDF
    const pdf1Result = createPdfFromTemplate(PDF_TEMPLATE_ID_1, name);
    const pdf2Result = createPdfWithImageFromTemplate(PDF_TEMPLATE_ID_2, name, imageId);
    
    // إضافة معرفات المستندات المؤقتة للتنظيف لاحقًا
    tempDocIds = [...pdf1Result.tempIds, ...pdf2Result.tempIds];
    
    return { 
      pdf1: pdf1Result.pdf.getUrl(), 
      pdf2: pdf2Result.pdf.getUrl() 
    };
    
  } catch (e) {
    Logger.log('خطأ في معالجة النموذج: ' + e.message);
    throw new Error('فشل معالجة النموذج: ' + e.message);
  } finally {
    // حذف ملف الصورة المؤقت
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
function saveImage(base64String, mimeType) {
  try {
    const blob = Utilities.base64Decode(base64String);
    const tempFolder = getTempFolder();
    const file = tempFolder.createFile(Utilities.newBlob(blob, mimeType, `image_${Date.now()}`));
    return file.getId();
  } catch (e) {
    Logger.log('خطأ في حفظ الصورة: ' + e.message);
    throw new Error('فشل حفظ الصورة: ' + e.message);
  }
}

// ========== دوال إنشاء PDF ==========
function createPdfFromTemplate(templateId, name) {
  const tempIds = [];
  try {
    // إنشاء نسخة مؤقتة من النموذج
    const templateFile = DriveApp.getFileById(templateId);
    const tempFolder = getTempFolder();
    const tempFile = templateFile.makeCopy(`Temp_${name}_${Date.now()}`, tempFolder);
    tempIds.push(tempFile.getId());
    
    const doc = DocumentApp.openById(tempFile.getId());
    const body = doc.getBody();
    
    if (!body.findText('{الاسم}')) {
      throw new Error('لم يتم العثور على مكان الاسم في القالب');
    }
    
    body.replaceText('{الاسم}', name);
    doc.saveAndClose();
    
    // تحويل المستند المؤقت إلى PDF
    const pdfBlob = tempFile.getAs('application/pdf');
    const pdfFile = tempFolder.createFile(pdfBlob.setName(`Certificate_${name}_${Date.now()}.pdf`));
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); 
    return { pdf: pdfFile, tempIds: tempIds };
  } catch (e) {
    Logger.log('خطأ في إنشاء PDF الأول: ' + e.message);
    throw new Error('فشل إنشاء الشهادة: ' + e.message);
  }
}

function createPdfWithImageFromTemplate(templateId, name, imageUrl) {
  const tempIds = [];
  try {
    // إنشاء نسخة مؤقتة من النموذج
    const templateFile = DriveApp.getFileById(templateId);
    const tempFolder = getTempFolder();
    const tempFile = templateFile.makeCopy(`Temp_${name}_${Date.now()}`, tempFolder);
    tempIds.push(tempFile.getId());
    
    const doc = DocumentApp.openById(tempFile.getId());
    const body = doc.getBody();
    
    // استبدال الاسم
    body.replaceText('{الاسم}', name);

    // البحث عن مكان الصورة
    const imagePlaceholder = body.findText('{الصورة}');
    
    if (!imagePlaceholder) {
      throw new Error('لم يتم العثور على مكان الصورة في القالب');
    }

    const element = imagePlaceholder.getElement();
    const parent = element.getParent();
    const index = parent.getChildIndex(element);

    // التحقق من الفهرس
    if (index < 0 || index >= parent.getNumChildren()) {
      throw new Error('موضع الصورة غير صحيح في القالب');
    }

    // إزالة العنصر النائب
    parent.removeChild(element);

    // الحصول على ملف الصورة
    const imageFile = DriveApp.getFileById(imageUrl);
    const blob = imageFile.getBlob();

    // التحقق من صحة الصورة
    if (!blob || blob.getBytes().length === 0) {
      throw new Error('ملف الصورة غير صالح أو فارغ');
    }

    // إدراج الصورة مع التحكم في الحجم
    const image = parent.insertInlineImage(index, blob);
    
    // الحفاظ على نسبة العرض إلى الارتفاع
    const originalWidth = image.getWidth();
    const originalHeight = image.getHeight();
    
    if (originalWidth === 0 || originalHeight === 0) {
      throw new Error('أبعاد الصورة غير صالحة');
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
    Logger.log('خطأ في إنشاء PDF الثاني: ' + e.message);
    throw new Error('فشل إنشاء البطاقة: ' + e.message);
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
