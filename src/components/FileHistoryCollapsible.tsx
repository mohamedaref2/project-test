
import React from "react";
import { ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { UserRecord } from "@/types";

interface FileHistoryCollapsibleProps {
  previousFiles: UserRecord[];
  isCollapsibleOpen: boolean;
  setIsCollapsibleOpen: (open: boolean) => void;
  isDarkMode: boolean;
}

const FileHistoryCollapsible: React.FC<FileHistoryCollapsibleProps> = ({
  previousFiles,
  isCollapsibleOpen,
  setIsCollapsibleOpen,
  isDarkMode
}) => {
  return (
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
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    البطاقة
                  </a>
                )}
                {file.pdf3 && (
                  <a 
                    href={file.pdf3} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={`text-sm flex items-center p-2 rounded ${
                      isDarkMode ? 'bg-gray-700 text-green-300 hover:bg-gray-600' : 'bg-gray-100 text-green-600 hover:bg-gray-200'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                      <polyline points="7 10 12 15 17 10"></polyline>
                      <line x1="12" y1="15" x2="12" y2="3"></line>
                    </svg>
                    شهادة اللجان
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default FileHistoryCollapsible;
