
import React from "react";

interface PhotoUploaderProps {
  photoPreview: string;
  triggerFileInput: () => void;
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  isDarkMode: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoPreview,
  triggerFileInput,
  photoInputRef,
  handlePhotoChange,
  isLoading,
  isDarkMode
}) => {
  return (
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
  );
};

export default PhotoUploader;
