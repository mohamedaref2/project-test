
import React from "react";

interface KeyStepProps {
  accessKey: string;
  setAccessKey: (key: string) => void;
  validateKeyHandler: () => Promise<void>;
  isLoading: boolean;
  errorMsg: string;
  isDarkMode: boolean;
}

const KeyStep: React.FC<KeyStepProps> = ({
  accessKey,
  setAccessKey,
  validateKeyHandler,
  isLoading,
  errorMsg,
  isDarkMode
}) => {
  return (
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
  );
};

export default KeyStep;
