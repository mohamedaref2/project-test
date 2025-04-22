
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PDFResult } from "@/types";

interface ResultStepProps {
  results: PDFResult | null;
  fullName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  downloadPDF: (url: string, filename: string) => void;
  restartProcess: () => void;
  getAvailableTabs: (pdfs: PDFResult | null) => string[];
  getTabName: (tabKey: string) => string;
  isDarkMode: boolean;
}

const ResultStep: React.FC<ResultStepProps> = ({
  results,
  fullName,
  activeTab,
  setActiveTab,
  downloadPDF,
  restartProcess,
  getAvailableTabs,
  getTabName,
  isDarkMode
}) => {
  const availableTabs = getAvailableTabs(results);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
          تم إنشاء الملفات بنجاح
        </h2>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} mb-6`}>
          مرحباً بك {fullName}، تم إنشاء الملفات التالية
        </p>
      </div>

      {results && availableTabs.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${availableTabs.length}, minmax(0, 1fr))` }}>
            {availableTabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {getTabName(tab)}
              </TabsTrigger>
            ))}
          </TabsList>
          
          {availableTabs.map((tab) => {
            const pdfUrl = results[tab as keyof PDFResult] as string;
            const pdfFilename = `${getTabName(tab)}_${fullName}.pdf`;
            
            return (
              <TabsContent key={tab} value={tab} className="mt-6">
                <div className="bg-gray-800 rounded-lg overflow-hidden">
                  <iframe 
                    src={pdfUrl} 
                    className="w-full h-96" 
                    title={getTabName(tab)} 
                  />
                </div>
                
                <div className="flex justify-between mt-4">
                  <button
                    onClick={() => downloadPDF(pdfUrl, pdfFilename)}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    تنزيل الملف
                  </button>
                  
                  <a 
                    href={pdfUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                      <polyline points="15 3 21 3 21 9"></polyline>
                      <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                    فتح في نافذة جديدة
                  </a>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      ) : (
        <div className={`text-center p-8 border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            لم يتم إنشاء أي ملفات
          </p>
        </div>
      )}
      
      <button
        onClick={restartProcess}
        className={`w-full py-3 rounded-lg font-bold transition-all ${
          isDarkMode 
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white' 
            : 'bg-gradient-to-r from-purple-500 to-indigo-500 text-white'
        } hover:shadow-lg transform hover:-translate-y-0.5`}
      >
        العودة للبداية
      </button>
    </div>
  );
};

export default ResultStep;
