
import React from "react";
import { Progress } from "@/components/ui/progress";

interface LoadingProgressProps {
  progress: number;
  progressText: string;
  wisdomQuote: string;
  isDarkMode: boolean;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({ 
  progress, 
  progressText, 
  wisdomQuote, 
  isDarkMode 
}) => {
  return (
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
  );
};

export default LoadingProgress;
