
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

// Mock functions that would connect to Google Apps Script in a real implementation
const mockGoogleScriptFunctions = {
  validateKey: (key: string) => {
    return new Promise<boolean>((resolve) => {
      setTimeout(() => resolve(key === "123456"), 1000);
    });
  },
  processFormWithImage: (name: string, base64Image: string, mimeType: string) => {
    return new Promise<{pdf1: string, pdf2: string}>((resolve) => {
      setTimeout(() => {
        resolve({
          pdf1: "https://example.com/pdf1",
          pdf2: "https://example.com/pdf2"
        });
      }, 2000);
    });
  }
};

const Index = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState<"key" | "form" | "result">("key");
  const [accessKey, setAccessKey] = useState("");
  const [fullName, setFullName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [results, setResults] = useState<{pdf1: string, pdf2: string} | null>(null);
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize particles effect
    if (typeof window !== 'undefined' && window.particlesJS) {
      window.particlesJS('particles', {
        particles: {
          number: { value: 80 },
          color: { value: '#ffffff' },
          opacity: { value: 0.5 },
          size: { value: 3 },
          move: { enable: true, speed: 1 }
        }
      });
    }
    
    // Check system preference for dark/light mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const validateKeyHandler = async () => {
    if (!accessKey.trim()) {
      setErrorMsg("الرجاء إدخال مفتاح وصول صحيح");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    
    try {
      // In a real app, this would call google.script.run
      const isValid = await mockGoogleScriptFunctions.validateKey(accessKey);
      
      if (isValid) {
        setCurrentStep("form");
      } else {
        setErrorMsg("المفتاح غير صحيح، الرجاء المحاولة مرة أخرى");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ في الخادم، الرجاء المحاولة لاحقًا");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "نوع الملف غير مدعوم",
        description: "يرجى اختيار صورة بصيغة PNG أو JPEG",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "حجم الصورة كبير جداً",
        description: "الحد الأقصى المسموح به هو 20 ميجابايت",
        variant: "destructive"
      });
      return;
    }

    setPhotoFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPhotoPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const submitForm = async () => {
    if (!fullName.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم الكامل",
        variant: "destructive"
      });
      return;
    }

    if (!photoFile) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار صورة",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Convert image to base64
      const base64String = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          resolve(result.split(',')[1]); // Remove data URL prefix
        };
        reader.readAsDataURL(photoFile);
      });

      // In a real app, this would call google.script.run
      const response = await mockGoogleScriptFunctions.processFormWithImage(
        fullName,
        base64String,
        photoFile.type
      );

      setResults(response);
      setCurrentStep("result");
      toast({
        title: "نجاح",
        description: "تم إنشاء الملفات بنجاح",
        variant: "default"
      });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message || "حدث خطأ أثناء معالجة الطلب",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const triggerFileInput = () => {
    photoInputRef.current?.click();
  };

  return (
    <div 
      className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-gray-900 to-slate-800' : 'bg-gradient-to-br from-blue-50 to-indigo-100'} flex items-center justify-center p-4`}
    >
      {/* Particles background */}
      <div id="particles" className="absolute inset-0 z-0"></div>
      
      {/* Dark mode toggle */}
      <button 
        onClick={toggleDarkMode} 
        className="fixed top-4 right-4 p-2 rounded-full bg-opacity-20 backdrop-blur-sm z-50 transition-all hover:bg-opacity-30"
        aria-label={isDarkMode ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}
      >
        {isDarkMode ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-300">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-700">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
          </svg>
        )}
      </button>

      {/* Main card */}
      <div
        className={`relative ${isDarkMode ? 'bg-gray-800/30' : 'bg-white/30'} backdrop-blur-lg border ${isDarkMode ? 'border-gray-700/30' : 'border-white/30'} rounded-3xl p-8 md:p-10 w-full max-w-md mx-auto shadow-2xl z-10 transform transition-all hover:shadow-lg`}
        style={{ direction: 'rtl' }}
      >
        {currentStep === "key" && (
          <div className="space-y-6 animate-fade-in">
            <h1 className={`text-3xl font-bold text-center ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>
              مرحبًا بك في نظام التسجيل
            </h1>
            
            <div className="space-y-4">
              <input
                type="text"
                value={accessKey}
                onChange={(e) => setAccessKey(e.target.value)}
                placeholder="أدخل مفتاح الوصول"
                className={`w-full px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                disabled={isLoading}
              />
              
              <button
                onClick={validateKeyHandler}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:shadow-lg transform hover:-translate-y-0.5'
                } ${isDarkMode 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white' 
                    : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري التحقق...
                  </div>
                ) : "تأكيد المفتاح"}
              </button>
              
              {errorMsg && (
                <div className="text-red-500 bg-red-100 border border-red-200 rounded-lg p-3 text-sm">
                  {errorMsg}
                </div>
              )}
            </div>
          </div>
        )}

        {currentStep === "form" && (
          <div className="space-y-6 animate-fade-in">
            <h2 className="text-2xl font-bold text-center text-red-500">
              استمارة التسجيل
            </h2>
            
            <div className="space-y-4">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                className={`w-full px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                disabled={isLoading}
              />
              
              <div 
                onClick={triggerFileInput} 
                className={`relative cursor-pointer border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all ${
                  isDarkMode 
                    ? 'border-gray-600 hover:border-indigo-400 bg-gray-800/50' 
                    : 'border-gray-300 hover:border-indigo-400 bg-gray-50/80'
                } ${photoPreview ? 'h-56' : 'h-36'}`}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  disabled={isLoading}
                />
                
                {photoPreview ? (
                  <div className="relative w-full h-full">
                    <img 
                      src={photoPreview} 
                      alt="معاينة الصورة" 
                      className="w-full h-full object-contain rounded"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded">
                      <div className="text-white text-center">
                        <p>انقر لتغيير الصورة</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={`mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>انقر لاختيار صورة</span>
                    <span className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>يجب أن لا يتجاوز حجم الصورة 20 ميجابايت</span>
                  </>
                )}
              </div>
              
              <button
                onClick={submitForm}
                disabled={isLoading}
                className={`w-full py-3 rounded-lg font-bold transition-all ${
                  isLoading 
                    ? 'opacity-70 cursor-not-allowed' 
                    : 'hover:shadow-lg transform hover:-translate-y-0.5'
                } ${isDarkMode 
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white' 
                    : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                }`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    جاري المعالجة...
                  </div>
                ) : "إرسال البيانات"}
              </button>
            </div>
          </div>
        )}

        {currentStep === "result" && results && (
          <div className="space-y-8 animate-fade-in text-center">
            <div className="space-y-2">
              <div className="inline-flex items-center justify-center p-2 bg-green-100 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-green-600">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-500">تمت العملية بنجاح! 🎉</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                تم إنشاء الملفات بنجاح، يمكنك تحميلها من الروابط أدناه
              </p>
            </div>
            
            <div className="space-y-4">
              <a
                href={results.pdf1}
                target="_blank"
                rel="noopener noreferrer"
                className={`block py-3 rounded-lg font-bold transition-all border-2 hover:shadow-lg transform hover:-translate-y-0.5 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-indigo-500 hover:bg-indigo-900/40' 
                    : 'bg-white text-indigo-600 border-indigo-500 hover:bg-indigo-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  تحميل الشهادة
                </div>
              </a>
              
              <a
                href={results.pdf2}
                target="_blank"
                rel="noopener noreferrer"
                className={`block py-3 rounded-lg font-bold transition-all border-2 hover:shadow-lg transform hover:-translate-y-0.5 ${
                  isDarkMode 
                    ? 'bg-gray-800 text-white border-purple-500 hover:bg-purple-900/40' 
                    : 'bg-white text-purple-600 border-purple-500 hover:bg-purple-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  تحميل البطاقة
                </div>
              </a>
              
              <button
                onClick={() => setCurrentStep("key")}
                className={`w-full py-2 rounded-lg font-medium text-sm transition-all ${
                  isDarkMode 
                    ? 'bg-transparent text-gray-300 hover:text-white' 
                    : 'bg-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                العودة للبداية
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Script for particles.js */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            document.addEventListener('DOMContentLoaded', function() {
              if (typeof particlesJS !== 'undefined') {
                particlesJS('particles', {
                  particles: {
                    number: { value: 80 },
                    color: { value: '#ffffff' },
                    opacity: { value: 0.5 },
                    size: { value: 3 },
                    move: { enable: true, speed: 1 }
                  }
                });
              }
            });
          `
        }}
      />
    </div>
  );
};

export default Index;
