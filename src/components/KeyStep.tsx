
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

interface KeyStepProps {
  accessKey: string;
  setAccessKey: (key: string) => void;
  validateKeyHandler: () => void;
  isLoading: boolean;
  errorMsg: string;
  isDarkMode: boolean;
  submitDisabled: boolean;
}

const KeyStep: React.FC<KeyStepProps> = ({
  accessKey,
  setAccessKey,
  validateKeyHandler,
  isLoading,
  errorMsg,
  isDarkMode,
  submitDisabled
}) => {
  // Handle key press for Enter key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading && !submitDisabled) {
      validateKeyHandler();
    }
  };

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      <div className="text-center mb-2">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          تسجيل الدخول
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          أدخل مفتاح الوصول الخاص بك للمتابعة
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            type="text"
            placeholder="مفتاح الوصول"
            value={accessKey}
            onChange={(e) => setAccessKey(e.target.value)}
            onKeyPress={handleKeyPress}
            className={`text-center ${isDarkMode ? 'bg-gray-700/60 text-white border-gray-600' : 'bg-white/80'} backdrop-blur-sm`}
            disabled={isLoading || submitDisabled}
          />
          {errorMsg && (
            <p className="text-red-500 text-sm mt-1 text-center">{errorMsg}</p>
          )}
        </div>

        <Button
          onClick={validateKeyHandler}
          disabled={isLoading || submitDisabled}
          className="w-full relative overflow-hidden group"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            تأكيد المفتاح
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></span>
        </Button>
      </div>
    </div>
  );
};

export default KeyStep;
