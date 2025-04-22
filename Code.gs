
const FAILED_ATTEMPTS_LIMIT = 5; // عدد المحاولات الخاطئة
const LOCKOUT_DURATION = 5 * 60 * 1000; // مدة الحظر بسبب الإسبام (5 دقائق)
const SPREADSHEET_ID = '1xJfs2f8roHCLJuNNJCuOsuoFOr9G0v6xN1paoL3cjZ8'; // معرّف جدول البيانات
const PDF_TEMPLATE_ID_1 = '1gukbJwN35ziQyb5OnsNeWJvP4ZLU_4X8LBAGIVTz3kE'; // قالب PDF الأول (للكشاف)
const PDF_TEMPLATE_ID_2 = '1czCXdBsOdEHV9LEaD2UlhF82nvlskfMiv5dGcjnPk0o'; // قالب PDF الثاني (للكشاف)
const PDF_TEMPLATE_ID_3 = '10qMk8dalG72juvwHk_4LmdQXAkz8fSHXLW3bshLL2Uo'; // قالب PDF الثالث (للجان)
const DELETE_TIME = 1440; // وقت الحذف بالدقائق - سيتم حذف الملفات بعد هذه المدة
const TEMP_FOLDER_NAME = 'temp_registration_files'; // اسم المجلد المؤقت
const APP_VERSION = '1.2.0'; // إصدار التطبيق - يساعد في تتبع التحديثات

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
    const cacheKey = 'failed_attempts_' + ip;

    // التحقق من تجاوز عدد المحاولات
    if (parseInt(cache.get(cacheKey) || '0') >= FAILED_ATTEMPTS_LIMIT) {
      throw('تم تجاوز عدد المحاولات، الرجاء الانتظار 5 دقائق');
    }

    // تنسيق المفتاح وتحويله لسلسلة نصية وإزالة المسافات
    key = String(key || '').trim();
    
    // تسجيل بيانات التنفيذ للتصحيح
    Logger.log('Validating key: "' + key + '"');
    
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
    const data = sheet.getRange(1, 1, lastRow, 3).getValues();
    
    // تسجيل البيانات للتصحيح
    Logger.log('Sheet data rows: ' + data.length);
    
    // البحث عن المفتاح
    let foundIndex = -1;
    let foundRank = '';
    let isUsed = false;
    
    for (let i = 0; i < data.length; i++) {
      const rowKey = String(data[i][0]).trim();
      
      if (rowKey === key) {
        foundIndex = i;
        foundRank = String(data[i][1]).trim();
        isUsed = String(data[i][2]).trim() === '1';
        break;
      }
    }
    
    Logger.log('Found index: ' + foundIndex + ', Rank: ' + foundRank + ', Used: ' + isUsed);
    
    if (foundIndex === -1) {
      // إذا لم يتم العثور على المفتاح، زيادة عداد المحاولات الخاطئة
      const attempts = parseInt(cache.get(cacheKey) || '0') + 1;
      cache.put(cacheKey, attempts.toString(), 5 * 60); // تخزين لمدة 5 دقائق
      throw('المفتاح غير صحيح');
    }

    // إعادة تعيين عداد المحاولات الفاشلة عند النجاح
    cache.remove(cacheKey);

    // الحصول على السجلات السابقة للمستخدم (للكشاف المسجل مسبقا أو قائد)
    let previousFiles = [];
    
    if (isUsed || foundRank === 'قائد') {
      previousFiles = getPreviousFiles(key);
    }
    
    // إذا كان المفتاح مستخدم ويوجد سجلات سابقة ولكن ليس بدرجة قائد
    // نسمح للمستخدم بمشاهدة السجلات السابقة فقط وليس إضافة سجلات جديدة
    const canAddNewRecord = foundRank === 'قائد' || !isUsed;
    
    // إعادة النتائج
    return {
      isValid: true,
      key: key,
      rank: foundRank,
      used: isUsed,
      index: foundIndex + 1,  // +1 لأن الصفوف في Sheets تبدأ من 1
      previousFiles: previousFiles,
      canAddNewRecord: canAddNewRecord
    };

  } catch (error) {
    Logger.log('validateKey error: ' + error);
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
    
    // تنسيق المفتاح
    const normalizedKey = String(key).trim();
    
    // تصفية السجلات حسب المفتاح
    const results = records.filter(row => String(row[1]).trim() === normalizedKey)
      .map(row => {
        // التحقق من وجود الروابط
        const pdf1Url = row[2] || null;
        const pdf2Url = row[3] || null;
        const pdf3Url = row[4] || null;
        const date = row[8] instanceof Date ? row[8] : new Date();
        
        return {
          name: row[0] || "",
          key: row[1] || "",
          pdf1: pdf1Url,
          pdf2: pdf2Url,
          pdf3: pdf3Url,
          teamNumber: row[5] || '',
          serialNumber: row[6] || '',
          gender: row[7] || '',
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
    // تسجيل بداية العملية
    Logger.log('بدء معالجة النموذج: ' + JSON.stringify(data));
    
    // تنظيف الملفات القديمة قبل إنشاء ملفات جديدة
    cleanupOldFiles();
    
    // استخراج البيانات المشتركة
    const { name, key, rank } = data;
    
    // التحقق من الاسم
    if (!name || name.length > 100) {
      throw('الاسم غير صحيح أو طويل جداً');
    }
    
    // معالجة بيانات محددة لكل رتبة
    let teamNumber = '';
    let serialNumber = '';
    let gender = '';
    
    if (rank === 'قائد') {
      teamNumber = data.teamNumber || '';
      serialNumber = data.serialNumber || '';
      gender = data.gender || '';
      
      // حفظ الصورة إذا تم تقديمها
      if (data.base64Image && data.mimeType) {
        Logger.log('جاري معالجة صورة القائد...');
        imageId = saveImage(data.base64Image, data.mimeType);
        if (!imageId) {
          throw('فشل في حفظ الصورة');
        }
        Logger.log('تم حفظ صورة القائد بنجاح بمعرف: ' + imageId);
      }
    } 
    else if (rank === 'كشاف') {
      teamNumber = data.teamNumber || '';
      serialNumber = data.serialNumber || '';
      
      // حفظ الصورة إذا تم تقديمها
      if (data.base64Image && data.mimeType) {
        Logger.log('جاري معالجة صورة الكشاف...');
        imageId = saveImage(data.base64Image, data.mimeType);
        if (!imageId) {
          throw('فشل في حفظ الصورة');
        }
        Logger.log('تم حفظ صورة الكشاف بنجاح بمعرف: ' + imageId);
      }
    }
    // لا نحتاج لأي معلومات إضافية للجان

    // تحديد أي ملفات PDF سيتم إنشاؤها استنادًا إلى الرتبة
    let pdf1Url = null;
    let pdf2Url = null;
    let pdf3Url = null;
    
    // إنشاء ملفات PDF حسب الرتبة وتوفر القوالب
    if ((rank === 'كشاف' || rank === 'قائد') && PDF_TEMPLATE_ID_1) {
      try {
        Logger.log('جاري إنشاء الشهادة PDF1...');
        const pdf1Result = createPdfFromTemplate(PDF_TEMPLATE_ID_1, name, gender);
        pdf1Url = pdf1Result.pdf.getUrl();
        tempDocIds = [...tempDocIds, ...pdf1Result.tempIds];
        Logger.log('تم إنشاء الشهادة PDF1 بنجاح: ' + pdf1Url);
      } catch (e) {
        Logger.log('تعذر إنشاء الشهادة PDF1: ' + e.message);
        // لا نرمي خطأ هنا حتى لا نتوقف عن إنشاء باقي الملفات
      }
    }
    
    // لإنشاء PDF الثاني، نحتاج إلى صورة
    if ((rank === 'كشاف' || rank === 'قائد') && imageId && PDF_TEMPLATE_ID_2) {
      try {
        Logger.log('جاري إنشاء البطاقة PDF2...');
        const pdf2Result = createPdfWithImageFromTemplate(PDF_TEMPLATE_ID_2, name, imageId, gender);
        pdf2Url = pdf2Result.pdf.getUrl();
        tempDocIds = [...tempDocIds, ...pdf2Result.tempIds];
        Logger.log('تم إنشاء البطاقة PDF2 بنجاح: ' + pdf2Url);
      } catch (e) {
        Logger.log('تعذر إنشاء البطاقة PDF2: ' + e.message);
      }
    }
    
    if ((rank === 'لجان' || rank === 'قائد') && PDF_TEMPLATE_ID_3) {
      try {
        Logger.log('جاري إنشاء شهادة اللجان PDF3...');
        const pdf3Result = createPdfFromTemplate(PDF_TEMPLATE_ID_3, name, gender);
        pdf3Url = pdf3Result.pdf.getUrl();
        tempDocIds = [...tempDocIds, ...pdf3Result.tempIds];
        Logger.log('تم إنشاء شهادة اللجان PDF3 بنجاح: ' + pdf3Url);
      } catch (e) {
        Logger.log('تعذر إنشاء شهادة اللجان PDF3: ' + e.message);
      }
    }
    
    // تحديد الملفات بسماح المشاركة للجميع
    setFilePermissionsForEveryone(pdf1Url, pdf2Url, pdf3Url);
    
    // تسجيل البيانات في جدول البيانات
    const logSheet = getSpreadsheet().getSheetByName('السجلات');
    logSheet.appendRow([
      name,           // الاسم
      key,            // المفتاح
      pdf1Url,        // رابط PDF1
      pdf2Url,        // رابط PDF2
      pdf3Url,        // رابط PDF3
      teamNumber,     // رقم الفرقة
      serialNumber,   // الرقم التسلسلي
      gender,         // النوع
      new Date(),     // التاريخ
      '',             // حقل احتياطي
      ''              // حقل احتياطي
    ]);
    
    // تحديث حالة الاستخدام للمفتاح (إذا لم يكن قائد)
    if (rank !== 'قائد') {
      const keySheet = getSpreadsheet().getSheetByName('المفاتيح');
      const keyData = validateKey(key);
      keySheet.getRange(keyData.index, 3).setValue('1'); // تحديث حالة الاستخدام
      Logger.log('تم تحديث حالة استخدام المفتاح ' + key);
    }
    
    // في حالة عدم إنشاء أي ملف PDF، نعرض رسالة خطأ
    if (!pdf1Url && !pdf2Url && !pdf3Url) {
      throw('لم يتم إنشاء أي ملفات، تأكد من توفر قوالب PDF');
    }
    
    Logger.log('تمت معالجة النموذج بنجاح');
    
    return { 
      pdf1: pdf1Url, 
      pdf2: pdf2Url,
      pdf3: pdf3Url
    };
    
  } catch (e) {
    Logger.log('خطأ في معالجة النموذج: ' + e.message);
    throw('فشل معالجة النموذج: ' + e.message);
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

// ========== تعيين صلاحيات الملفات للجميع ==========
function setFilePermissionsForEveryone(pdf1Url, pdf2Url, pdf3Url) {
  if (pdf1Url) {
    try {
      const fileId = pdf1Url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        DriveApp.getFileById(fileId[0]).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (e) {
      Logger.log('خطأ في تعيين الصلاحيات للملف الأول: ' + e.message);
    }
  }
  
  if (pdf2Url) {
    try {
      const fileId = pdf2Url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        DriveApp.getFileById(fileId[0]).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (e) {
      Logger.log('خطأ في تعيين الصلاحيات للملف الثاني: ' + e.message);
    }
  }
  
  if (pdf3Url) {
    try {
      const fileId = pdf3Url.match(/[-\w]{25,}/);
      if (fileId && fileId[0]) {
        DriveApp.getFileById(fileId[0]).setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      }
    } catch (e) {
      Logger.log('خطأ في تعيين الصلاحيات للملف الثالث: ' + e.message);
    }
  }
}

// ========== الحصول على النتائج السابقة للمفتاح المستخدم ==========
function getPreviousResults(key) {
  try {
    const logSheet = getSpreadsheet().getSheetByName('السجلات');
    if (!logSheet) {
      return null;
    }

    // تنسيق المفتاح
    const normalizedKey = String(key).trim();

    // البحث عن السجل بالمفتاح
    const records = logSheet.getDataRange().getValues();
    for (let i = 0; i < records.length; i++) {
      if (String(records[i][1]).trim() === normalizedKey) {
        // إرجاع روابط PDF
        return {
          pdf1: records[i][2] || null,
          pdf2: records[i][3] || null,
          pdf3: records[i][4] || null
        };
      }
    }

    return null;
  } catch (e) {
    Logger.log('خطأ في استرجاع النتائج السابقة: ' + e.message);
    return null;
  }
}

// ========== حفظ الصورة ==========
function saveImage(base64Image, mimeType) {
  try {
    Logger.log('بدء حفظ الصورة...');
    
    // لو السطر يحتوي على "data:image" بنشيل الجزء التعريفي
    const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

    // تحويل إلى Blob
    const decoded = Utilities.base64Decode(base64Data);
    const blob = Utilities.newBlob(decoded, mimeType, 'photo.' + mimeType.split('/')[1]);

    // رفع الصورة لجوجل درايف
    const file = DriveApp.createFile(blob);
    Logger.log('تم حفظ الصورة بنجاح. معرف الملف: ' + file.getId());
    
    return file.getId();

  } catch (e) {
    Logger.log('خطأ في حفظ الصورة: ' + e.message);
    throw('فشل حفظ الصورة');
  }
}

// ========== دوال إنشاء PDF ==========
function createPdfFromTemplate(templateId, name, gender) {
  const tempIds = [];
  try {
    // التحقق من وجود قالب
    if (!templateId) {
      throw('قالب PDF غير متوفر');
    }
    
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
    throw('فشل إنشاء المستند: ' + e.message);
  }
}

function createPdfWithImageFromTemplate(templateId, name, imageUrl, gender) {
  const tempIds = [];
  try {
    // التحقق من وجود قالب
    if (!templateId) {
      throw('قالب PDF غير متوفر');
    }
    
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
    throw('فشل إنشاء البطاقة: ' + e.message);
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

