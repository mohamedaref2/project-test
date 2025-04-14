
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>نظام التسجيل الإلكتروني</title>
  <link href="https://unpkg.com/css-particles@1.0.9/particles.css" rel="stylesheet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
    :root {
      --primary: #2563eb;
      --secondary: #7c3aed;
      --glass: rgba(255, 255, 255, 0.15);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Tajawal', sans-serif;
      background: linear-gradient(45deg, #1e1b4b, #0f172a);
      min-height: 100vh;
      display: grid;
      place-items: center;
      overflow-x: hidden;
    }

    .particles {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }

    .card {
      position: relative;
      background: var(--glass);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 20px;
      padding: 2.5rem;
      width: 95%;
      max-width: 600px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      transform-style: preserve-3d;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1;
    }

    .card:hover {
      transform: translateY(-5px) rotateX(2deg) rotateY(2deg);
    }

    h1 {
      color: white;
      text-align: center;
      margin-bottom: 2rem;
      font-size: 2.2rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    }

    .form-input {
      width: 100%;
      padding: 1rem;
      margin: 1rem 0;
      border: none;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .form-input:focus {
      outline: none;
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.3);
    }

    .gradient-btn {
      background: linear-gradient(45deg, var(--primary), var(--secondary));
      color: white;
      border: none;
      padding: 1rem 2rem;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 700;
      transition: all 0.3s ease;
      width: 100%;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .gradient-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(37, 99, 235, 0.4);
    }

    .loader {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid var(--primary);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 1rem auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .toast {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 1rem 2rem;
      border-radius: 8px;
      animation: slideUp 0.3s ease;
      display: none;
    }

    @keyframes slideUp {
      from { bottom: -50px; opacity: 0; }
      to { bottom: 20px; opacity: 1; }
    }

    .progress-bar {
    height: 8px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 4px;
    overflow: hidden;
    margin: 1rem 0;
    }

    #errorMsg {
      color: #ff6b6b;
      font-size: 0.9rem;
      margin: 0.5rem 0;
      display: none;
    }

    #resultSection h2 {
      font-size: 1.8rem;
      margin-bottom: 1.5rem;
    }
    #loader {
      color: white;
      text-align: center;
      padding: 1rem;
      display: none;
    }

    .loading-spinner {
      border: 3px solid #f3f3f3;
      border-top: 3px solid var(--primary);
      border-radius: 50%;
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
      display: inline-block;
      vertical-align: middle;
    }
    .form-input {
      transition: all 0.3s ease, box-shadow 0.2s ease;
    }

    .form-input:hover {
      transform: translateY(-2px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    /* Better button hierarchy */
    #downloadButtons button {
      background: none;
      border: 2px solid var(--primary);
      color: white;
      transition: all 0.3s ease;
    }

    #downloadButtons button:hover {
      background: var(--primary);
      transform: scale(1.05);
    }
    button:disabled {
      opacity: 0.7;
      cursor: not-allowed;
      background: #cccccc !important;
    }
    .toast.success { background: #48BB78; }
    .toast.error { background: #F56565; }
    #warning {
        display: none!important;
    }
  </style>
</head>
<body>
  <div class="particles" id="particles"></div>

  <div class="card">
    <div id="keySection">
      <h1 style="text-align: center; color: var(--primary); margin-bottom: 2rem;">
        مرحبًا بك في نظام التسجيل
      </h1>
      <input type="text" class="form-input" placeholder="أدخل مفتاح الوصول" id="accessKey">
      <button class="form-input" style="background: var(--secondary); color: white;" onclick="validateKey()">
        تأكيد المفتاح
      </button>
      <div id="loader" style="display: none;">جاري التحقق…</div>
      <div id="errorMsg" style="display: none; color: #ff6b6b;">المفتاح غير صحيح، حاول مرة أخرى.</div>
    </div>

    <div id="formSection" style="display: none;">
      <h2 style="color: #dd4b39;text-align: center;padding: 20px;margin: 10px;font-size: 2em;">استمارة التسجيل</h2>
      <input type="text" class="form-input" placeholder="الاسم الكامل" id="fullName">
      <input type="file" class="form-input" accept="image/*" id="photoUpload">
      <div class="progress-bar" id="progressBar">
        <div id="progressFill" style="width: 0%; height: 100%; background: var(--secondary); transition: width 0.3s;"></div>
      </div>
      <button class="form-input" style="background: #48BB78;" onclick="submitForm()">إرسال البيانات</button>
      <div id="submitError" class="errorMsg" style="color: #ff6b6b; display: none;"></div>
    </div>

    <div id="resultSection" style="display: none; text-align: center;">
      <h2 style="color: #48BB78;">تمت العملية بنجاح! 🎉</h2>
      <div id="downloadButtons" style="margin-top: 1.5rem;"></div>
    </div>
  </div>

  <div class="toast" id="toast"></div>

  <script src="https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js"></script>
  <script>
    // Initialize particles
    particlesJS('particles', {
      particles: {
        number: { value: 80 },
        color: { value: '#ffffff' },
        opacity: { value: 0.5 },
        size: { value: 3 },
        move: { enable: true, speed: 1 }
      }
    });

    // Helper functions for UI updates
    function showLoader() {
      document.getElementById('loader').style.display = 'block';
    }

    function hideLoader() {
      document.getElementById('loader').style.display = 'none';
    }

    function showToast(message, type) {
      const toast = document.getElementById('toast');
      toast.className = `toast ${type}`;
      toast.textContent = message;
      toast.style.display = 'block';
      setTimeout(() => toast.style.display = 'none', 3000);
    }

    // ========== دالة التحقق من المفتاح ==========
    function validateKey() {
      const keyInput = document.getElementById('accessKey');
      const errMsg = document.getElementById('errorMsg');
      
      // تنظيف المدخلات
      const key = keyInput.value.trim();
      errMsg.style.display = 'none';

      if (!key) {
        errMsg.textContent = 'الرجاء إدخال مفتاح وصول صحيح';
        errMsg.style.display = 'block';
        return;
      }

      keyInput.disabled = true;
      showLoader();

      google.script.run
        .withSuccessHandler(function(isValid) {
          hideLoader();
          if (isValid) {
            document.getElementById('keySection').style.display = 'none';
            document.getElementById('formSection').style.display = 'block';
          } else {
            errMsg.textContent = 'المفتاح غير صحيح، الرجاء المحاولة مرة أخرى';
            errMsg.style.display = 'block';
            keyInput.disabled = false;
          }
        })
        .withFailureHandler(function(err) {
          hideLoader();
          errMsg.textContent = err.message || 'حدث خطأ في الخادم، الرجاء المحاولة لاحقًا';
          errMsg.style.display = 'block';
          keyInput.disabled = false;
        })
        .validateKey(key);
    }

    // ========== دالة إرسال النموذج ==========
    function submitForm() {
      const btn = document.querySelector('#formSection button');
      const submitError = document.getElementById('submitError');
      submitError.style.display = 'none';
      
      try {
        btn.disabled = true;
        showLoader();
        
        const name = document.getElementById('fullName').value.trim();
        const fileInput = document.getElementById('photoUpload');
        const file = fileInput.files[0];

        // التحقق من المدخلات
        if (!name) {
          submitError.textContent = 'الرجاء إدخال الاسم الكامل';
          submitError.style.display = 'block';
          btn.disabled = false;
          hideLoader();
          return;
        }
        
        if (!file) {
          submitError.textContent = 'الرجاء اختيار صورة';
          submitError.style.display = 'block';
          btn.disabled = false;
          hideLoader();
          return;
        }

        // التحقق من نوع الملف
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
          submitError.textContent = 'نوع الملف غير مدعوم، يرجى اختيار صورة بصيغة PNG أو JPEG';
          submitError.style.display = 'block';
          btn.disabled = false;
          hideLoader();
          return;
        }

        // التحقق من حجم الملف (20 ميجابايت كحد أقصى)
        if (file.size > 20 * 1024 * 1024) {
          submitError.textContent = 'حجم الصورة كبير جداً، الحد الأقصى المسموح به هو 20 ميجابايت';
          submitError.style.display = 'block';
          btn.disabled = false;
          hideLoader();
          return;
        }

        // تحويل الصورة إلى قاعدة Base64
        const reader = new FileReader();
        reader.onload = function(e) {
          const base64String = e.target.result.split(',')[1]; // استخراج البيانات base64
          
          // إرسال البيانات إلى السيرفر
          google.script.run
            .withSuccessHandler(function(response) {
              hideLoader();
              showResults(response);
              showToast('تم إنشاء الملفات بنجاح', 'success');
            })
            .withFailureHandler(function(error) {
              hideLoader();
              submitError.textContent = error.message || 'حدث خطأ أثناء معالجة الطلب';
              submitError.style.display = 'block';
              btn.disabled = false;
            })
            .processFormWithImage(name, base64String, file.type);
        };
        
        reader.onerror = function() {
          hideLoader();
          submitError.textContent = 'حدث خطأ أثناء قراءة الصورة';
          submitError.style.display = 'block';
          btn.disabled = false;
        };
        
        reader.readAsDataURL(file);
        
      } catch (err) {
        hideLoader();
        submitError.textContent = err.message || 'حدث خطأ غير متوقع';
        submitError.style.display = 'block';
        btn.disabled = false;
      }
    }

    // ========== دوال العرض ==========
    function showResults(response) {
      document.getElementById('formSection').style.display = 'none';
      document.getElementById('resultSection').style.display = 'block';
      document.getElementById('downloadButtons').innerHTML = `
        <button class="gradient-btn" onclick="window.open('${response.pdf1}', '_blank')">
          تحميل الشهادة
        </button>
        <button class="gradient-btn" style="margin-top: 1rem;" onclick="window.open('${response.pdf2}', '_blank')">
          تحميل البطاقة
        </button>`;
    }
  </script>
</body>
</html>
