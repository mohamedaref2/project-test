import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";

// Mock functions that would connect to Google Apps Script in a real implementation
const mockGoogleScriptFunctions = {
  validateKey: (key: string) => {
    return new Promise<{isValid: boolean, rank: string, used: boolean, key: string, previousFiles: any[]}>((resolve) => {
      setTimeout(() => {
        if (key === "123456") {
          resolve({
            isValid: true,
            rank: "قائد",
            used: false,
            key: "123456",
            previousFiles: [
              {
                name: "محمد أحمد",
                key: "123456",
                pdf1: "https://example.com/pdf1",
                pdf2: "https://example.com/pdf2",
                pdf3: "https://example.com/pdf3",
                teamNumber: "5",
                serialNumber: "101",
                gender: "قائد",
                date: "2025/04/01"
              },
              {
                name: "أحمد علي",
                key: "123456",
                pdf1: "https://example.com/pdf1_2",
                pdf2: null,
                pdf3: "https://example.com/pdf3_2",
                teamNumber: "6",
                serialNumber: "102",
                gender: "قائد",
                date: "2025/03/20"
              }
            ]
          });
        } else {
          resolve({
            isValid: true,
            rank: "كشاف",
            used: true,
            key: key,
            previousFiles: [
              {
                name: "خالد علي",
                key: key,
                pdf1: "https://example.com/pdf1",
                pdf2: "https://example.com/pdf2",
                pdf3: null,
                teamNumber: "7",
                serialNumber: "103",
                gender: "",
                date: "2025/04/05"
              }
            ]
          });
        }
      }, 1000);
    });
  },
  processFormWithImage: (data: any) => {
    return new Promise<{pdf1: string | null, pdf2: string | null, pdf3: string | null}>((resolve) => {
      setTimeout(() => {
        resolve({
          pdf1: "https://example.com/pdf1",
          pdf2: "https://example.com/pdf2",
          pdf3: data.rank === "لجان" || data.rank === "قائد" ? "https://example.com/pdf3" : null
        });
      }, 2000);
    });
  }
};

// Type definition for window.particlesJS
declare global {
  interface Window {
    particlesJS: any;
  }
}

// Interface for PDF files
interface PDFResult {
  pdf1: string | null;
  pdf2: string | null;
  pdf3: string | null;
}

// Interface for user record
interface UserRecord {
  name: string;
  key: string;
  pdf1: string | null;
  pdf2: string | null;
  pdf3: string | null;
  teamNumber?: string;
  serialNumber?: string;
  gender?: string;
  date: string;
}

const Index = () => {
  // State variables
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState<"key" | "form" | "result">("key");
  const [accessKey, setAccessKey] = useState("");
  const [fullName, setFullName] = useState("");
  const [teamNumber, setTeamNumber] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [gender, setGender] = useState<"قائد" | "قائدة" | "">("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [userRank, setUserRank] = useState<string>("");
  const [isKeyUsed, setIsKeyUsed] = useState(false);
  const [results, setResults] = useState<PDFResult | null>(null);
  const [previousFiles, setPreviousFiles] = useState<UserRecord[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState("");
  const [isCollapsibleOpen, setIsCollapsibleOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pdf1");
  
  // Add new state for wisdom quotes
  const [wisdomQuote, setWisdomQuote] = useState("");
  
  const wisdomQuotes = [
    "الصبر مفتاح الفرج",
    "من جدّ وجد",
    "العلم نور",
    "خير الأمور أوسطها",
    "من سار على الدرب وصل",
    "اطلب العلم من المهد إلى اللحد",
    "من صبر ظفر"
  ];
  
  const photoInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Initialize particles effect
    if (typeof window !== 'undefined' && window.particlesJS) {
      window.particlesJS('particles', {
        particles: {
          number: { value: 60 },
          color: { value: isDarkMode ? '#ffffff' : '#6366f1' },
          opacity: { value: 0.3 },
          size: { value: 3 },
          move: { enable: true, speed: 1 }
        }
      });
    }
    
    // Check system preference for dark/light mode
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setIsDarkMode(prefersDark);
  }, []);

  // Use effect for rotating wisdom quotes during loading
  useEffect(() => {
    let quoteInterval: NodeJS.Timeout;
    
    if (isLoading) {
      let index = 0;
      setWisdomQuote(wisdomQuotes[0]);
      
      quoteInterval = setInterval(() => {
        index = (index + 1) % wisdomQuotes.length;
        setWisdomQuote(wisdomQuotes[index]);
      }, 3000);
    }
    
    return () => {
      if (quoteInterval) {
        clearInterval(quoteInterval);
      }
    };
  }, [isLoading]);

  // Simulate progress during loading operations
  useEffect(() => {
    let progressInterval: NodeJS.Timeout;
    
    if (isLoading) {
      setProgress(0);
      setProgressText("جاري التحميل...");
      
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          
          const nextStep = prev + (10 - prev / 10);
          
          // Update progress text based on progress value
          if (nextStep > 75) {
            setProgressText("جاري إنشاء الملفات...");
          } else if (nextStep > 50) {
            setProgressText("جاري معالجة البيانات...");
          } else if (nextStep > 25) {
            setProgressText("جاري التحقق من المعلومات...");
          }
          
          return nextStep;
        });
      }, 300);
    } else {
      setProgress(100);
      
      // Reset progress after animation completes
      const resetTimeout = setTimeout(() => {
        setProgress(0);
        setProgressText("");
        setWisdomQuote("");
      }, 500);
      
      return () => clearTimeout(resetTimeout);
    }
    
    return () => clearInterval(progressInterval);
  }, [isLoading]);

  const validateKeyHandler = async () => {
    if (!accessKey.trim()) {
      setErrorMsg("الرجاء إدخال مفتاح الوصول");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setProgressText("جاري التحقق من المفتاح...");
    
    try {
      // In a real app, this would call google.script.run
      const response = await mockGoogleScriptFunctions.validateKey(accessKey);
      
      if (response.isValid) {
        setUserRank(response.rank);
        setIsKeyUsed(response.used);
        setPreviousFiles(response.previousFiles || []);
        
        // If the key has been used (except for قائد) and there are previous files,
        // go directly to result section with those files
        if (response.used && response.previousFiles && response.previousFiles.length > 0) {
          // Find the most recent submission for this key
          const latestSubmission = response.previousFiles[0];
          setResults({
            pdf1: latestSubmission.pdf1,
            pdf2: latestSubmission.pdf2,
            pdf3: latestSubmission.pdf3
          });
          setFullName(latestSubmission.name);
          setCurrentStep("result");
          toast({
            title: "تم التعرف عليك",
            description: "تم استرجاع بياناتك السابقة بنجاح",
            variant: "default"
          });
        } else {
          // Proceed to form for new submission
          setCurrentStep("form");
        }
      } else {
        setErrorMsg("المفتاح غير صحيح");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "حدث خطأ، الرجاء المحاولة لاحقًا");
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
    // Form validation based on user rank
    if (!fullName.trim()) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال الاسم الكامل",
        variant: "destructive"
      });
      return;
    }

    // Rank-specific validations
    if ((userRank === "كشاف" || userRank === "قائد")) {
      if (!photoFile) {
        toast({
          title: "خطأ",
          description: "الرجاء اختيار صورة",
          variant: "destructive"
        });
        return;
      }

      if (!teamNumber.trim()) {
        toast({
          title: "خطأ",
          description: "الرجاء إدخال رقم الفرقة",
          variant: "destructive"
        });
        return;
      }

      if (!serialNumber.trim()) {
        toast({
          title: "خطأ", 
          description: "الرجاء إدخال الرقم التسلسلي",
          variant: "destructive"
        });
        return;
      }
    }

    if (userRank === "قائد" && !gender) {
      toast({
        title: "خطأ",
        description: "الرجاء اختيار النوع",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare form data based on user rank
      const formData: any = {
        name: fullName,
        key: accessKey,
        rank: userRank,
      };
      
      // Add rank-specific fields
      if (userRank === "قائد" || userRank === "كشاف") {
        formData.teamNumber = teamNumber;
        formData.serialNumber = serialNumber;
      }
      
      if (userRank === "قائد") {
        formData.gender = gender;
      }

      // Add photo if provided
      if (photoFile) {
        const base64String = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.readAsDataURL(photoFile);
        });

        formData.base64Image = base64String;
        formData.mimeType = photoFile.type;
      }

      // Process form data
      const response = await mockGoogleScriptFunctions.processFormWithImage(formData);
      
      if (response) {
        setResults(response);
        setCurrentStep("result");
        toast({
          title: "نجاح",
          description: "تم إنشاء الملفات بنجاح",
          variant: "default"
        });
      }
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

  // Function to determine what tabs to show based on available PDFs
  const getAvailableTabs = (pdfs: PDFResult | null) => {
    if (!pdfs) return [];
    
    const tabs = [];
    if (pdfs.pdf1) tabs.push("pdf1");
    if (pdfs.pdf2) tabs.push("pdf2");
    if (pdfs.pdf3) tabs.push("pdf3");
    
    return tabs;
  };

  // Function to get tab name based on tab key
  const getTabName = (tabKey: string) => {
    switch (tabKey) {
      case "pdf1": return "الشهادة";
      case "pdf2": return "البطاقة";
      case "pdf3": return "شهادة اللجان";
      default: return "";
    }
  };

  // Function to download PDF instead of opening in new tab
  const downloadPDF = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.setAttribute('target', '_blank');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset and go back to the beginning
  const restartProcess = () => {
    // Reload the page to completely reset the state
    window.location.reload();
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
        className={`relative ${isDarkMode ? 'bg-gray-800/40' : 'bg-white/40'} backdrop-blur-lg border ${isDarkMode ? 'border-gray-700/30' : 'border-white/30'} rounded-3xl p-8 md:p-10 w-full max-w-md mx-auto shadow-2xl z-10 transform transition-all hover:shadow-lg`}
        style={{ direction: 'rtl' }}
      >
        {/* Progress bar */}
        {isLoading && (
          <div className="mb-6 space-y-4 animate-fade-in">
            <div className="flex justify-between text-sm font-medium">
              <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{progressText}</span>
              <span className={`${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>{Math.round(progress)}%</span>
            </div>
            <Progress 
              value={progress} 
              className={`h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} transition-all ease-in-out duration-300`} 
            />
            {wisdomQuote && (
              <div className={`text-center text-sm italic ${isDarkMode ? 'text-gray-400' : 'text-gray-600'} animate-fade-in`}>
                {wisdomQuote}
              </div>
            )}
          </div>
        )}

        {currentStep === "key" && (
          <div className="space-y-6 animate-fade-in">
            <h1 className={`text-3xl font-bold text-center ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'} mb-8`}>
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
                readOnly={isLoading}
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
                {isLoading ? "جاري التحقق..." : "تأكيد المفتاح"}
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
          <div className="space-y-6 animate-fade-in" data-section="form" data-allowed="true">
            <h2 className={`text-2xl font-bold text-center ${isDarkMode ? 'text-red-400' : 'text-red-500'}`}>
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
                readOnly={isLoading}
              />

              {/* Show fields based on user rank */}
              {(userRank === "كشاف" || userRank === "قائد") && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      value={teamNumber}
                      onChange={(e) => setTeamNumber(e.target.value)}
                      placeholder="رقم الفرقة"
                      className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                      disabled={isLoading}
                      readOnly={isLoading}
                    />
                    <input
                      type="text"
                      value={serialNumber}
                      onChange={(e) => setSerialNumber(e.target.value)}
                      placeholder="الرقم التسلسلي"
                      className={`px-4 py-3 rounded-lg ${isDarkMode ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-700 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all`}
                      disabled={isLoading}
                      readOnly={isLoading}
                    />
                  </div>
                  
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
                </>
              )}

              {/* Gender selection for قائد rank only */}
              {userRank === "قائد" && (
                <div className="flex gap-4">
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                    gender === "قائد" 
                      ? (isDarkMode ? 'bg-indigo-700/60 border-indigo-500' : 'bg-indigo-100 border-indigo-400') 
                      : (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200')
                  }`}>
                    <input
                      type="radio"
                      name="gender"
                      value="قائد"
                      checked={gender === "قائد"}
                      onChange={() => setGender("قائد")}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <span className={gender === "قائد" ? (isDarkMode ? 'text-indigo-200' : 'text-indigo-700') : ''}>قائد</span>
                  </label>
                  
                  <label className={`flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-all ${
                    gender === "قائدة" 
                      ? (isDarkMode ? 'bg-indigo-700/60 border-indigo-500' : 'bg-indigo-100 border-indigo-400') 
                      : (isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200')
                  }`}>
                    <input
                      type="radio"
                      name="gender"
                      value="قائدة"
                      checked={gender === "قائدة"}
                      onChange={() => setGender("قائدة")}
                      className="hidden"
                      disabled={isLoading}
                    />
                    <span className={gender === "قائدة" ? (isDarkMode ? 'text-indigo-200' : 'text-indigo-700') : ''}>قائدة</span>
                  </label>
                </div>
              )}
              
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
                {isLoading ? "جاري المعالجة..." : "إرسال البيانات"}
              </button>

              {userRank === "قائد" && previousFiles.length > 0 && (
                <Collapsible
                  open={isCollapsibleOpen}
                  onOpenChange={setIsCollapsibleOpen}
                  className={`mt-4 rounded-lg overflow-hidden transition-all ${
                    isDarkMode ? 'bg-gray-800/80 border border-gray-700' : 'bg-white/80 border border-gray-200'
                  }`}
                >
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 text-right">
                    <span className="font-medium">سجل الملفات السابقة</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isCollapsibleOpen ? 'rotate-180' : ''}`} />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="max-h-64 overflow-y-auto">
                    <div className="p-4 space-y-4 divide-y divide-gray-200">
                      {previousFiles.map((file, index) => (
                        <div key={index} className="pt-4 first:pt-0">
                          <div className="flex justify-between items-center mb-2">
                            <span className="font-medium">{file.name}</span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {file.date}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 gap-2">
                            {file.pdf1 && (
                              <a 
                                href={file.pdf1} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`text-sm flex items-center p-2 rounded ${
                                  isDarkMode ? 'bg-gray-700 text-blue-300 hover:bg-gray-600' : 'bg-gray-100 text-blue-600 hover:bg-gray-200'
                                }`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                الشهادة
                              </a>
                            )}
                            {file.pdf2 && (
                              <a 
                                href={file.pdf2} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className={`text-sm flex items-center p-2 rounded ${
                                  isDarkMode ? 'bg-gray-700 text-purple-300 hover:bg-gray-600' : 'bg-gray-100 text-purple-600 hover:bg-gray-200'
                                }`}
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v
