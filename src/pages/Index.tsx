
import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";

// Custom Components
import ParticlesBackground from "@/components/ParticlesBackground";
import DarkModeToggle from "@/components/DarkModeToggle";
import LoadingProgress from "@/components/LoadingProgress";
import KeyStep from "@/components/KeyStep";
import FormStep from "@/components/FormStep";
import ResultStep from "@/components/ResultStep";
import BannerImage from "@/components/BannerImage";

// Types and Utils
import { PDFResult, StepType, UserRecord } from "@/types";
import mockGoogleScriptFunctions from "@/utils/googleScriptMock";

const Index = () => {
  // State variables
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentStep, setCurrentStep] = useState<StepType>("key");
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
  const [wisdomQuote, setWisdomQuote] = useState("");
  const [submitDisabled, setSubmitDisabled] = useState(false);
  
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

  // Toggle dark mode
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // Check system preference for dark/light mode
  useEffect(() => {
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
    
    return () => {
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [isLoading]);

  const validateKeyHandler = async () => {
    if (!accessKey.trim()) {
      setErrorMsg("الرجاء إدخال مفتاح الوصول");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSubmitDisabled(true);
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
      setSubmitDisabled(false);
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
    setSubmitDisabled(true);
    
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
      setSubmitDisabled(false);
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
      <ParticlesBackground isDarkMode={isDarkMode} />
      
      {/* Dark mode toggle */}
      <DarkModeToggle isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />

      {/* Main card */}
      <div className={`relative ${isDarkMode ? 'bg-gray-800/40' : 'bg-white/40'} backdrop-blur-lg border ${isDarkMode ? 'border-gray-700/30' : 'border-white/30'} rounded-3xl w-full max-w-md mx-auto shadow-2xl z-10 transform transition-all hover:shadow-lg overflow-hidden`} style={{ direction: 'rtl' }}>
        {/* Header Image */}
        <div className="w-full h-[245px] overflow-hidden">
          <img 
            src="https://i.ibb.co/sJXfcDHM/3a4c72ac-fd79-4a6f-86d8-96031eec8209.jpg" 
            alt="Header" 
            className="w-full h-full object-cover object-center"
          />
        </div>
        
        {/* Banner Image */}
        <BannerImage isDarkMode={isDarkMode} />

        <div className="p-8 md:p-10">
          {/* Progress bar */}
          {isLoading && (
            <LoadingProgress
              progress={progress}
              progressText={progressText}
              wisdomQuote={wisdomQuote}
              isDarkMode={isDarkMode}
            />
          )}

          {currentStep === "key" && (
            <KeyStep
              accessKey={accessKey}
              setAccessKey={setAccessKey}
              validateKeyHandler={validateKeyHandler}
              isLoading={isLoading}
              errorMsg={errorMsg}
              isDarkMode={isDarkMode}
              submitDisabled={submitDisabled}
            />
          )}

          {currentStep === "form" && (
            <FormStep
              fullName={fullName}
              setFullName={setFullName}
              teamNumber={teamNumber}
              setTeamNumber={setTeamNumber}
              serialNumber={serialNumber}
              setSerialNumber={setSerialNumber}
              gender={gender}
              setGender={setGender}
              photoPreview={photoPreview}
              userRank={userRank}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
              triggerFileInput={triggerFileInput}
              photoInputRef={photoInputRef}
              handlePhotoChange={handlePhotoChange}
              submitForm={submitForm}
              previousFiles={previousFiles}
              isCollapsibleOpen={isCollapsibleOpen}
              setIsCollapsibleOpen={setIsCollapsibleOpen}
              submitDisabled={submitDisabled}
            />
          )}

          {currentStep === "result" && (
            <ResultStep
              results={results}
              fullName={fullName}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              downloadPDF={downloadPDF}
              restartProcess={restartProcess}
              getAvailableTabs={getAvailableTabs}
              getTabName={getTabName}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
