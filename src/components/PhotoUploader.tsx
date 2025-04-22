
import React from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Camera } from 'lucide-react';

interface PhotoUploaderProps {
  photoPreview: string;
  triggerFileInput: () => void;
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  isDarkMode: boolean;
  submitDisabled: boolean;
}

const PhotoUploader: React.FC<PhotoUploaderProps> = ({
  photoPreview,
  triggerFileInput,
  photoInputRef,
  handlePhotoChange,
  isLoading,
  isDarkMode,
  submitDisabled
}) => {
  return (
    <div className="space-y-3">
      <Label className={`block ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
        الصورة الشخصية
      </Label>
      
      <div 
        className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md cursor-pointer transition-colors duration-200 
        ${isDarkMode ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'}
        ${isLoading || submitDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={isLoading || submitDisabled ? undefined : triggerFileInput}
      >
        <div className="space-y-1 text-center">
          {photoPreview ? (
            <div className="flex flex-col items-center">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-md mb-2"
              />
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                اضغط لتغيير الصورة
              </p>
            </div>
          ) : (
            <>
              <div className={`mx-auto h-12 w-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Camera size={48} />
              </div>
              <div className="flex text-sm">
                <p className={`pr-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                  اضغط لتحميل صورة شخصية
                </p>
              </div>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                PNG, JPG, JPEG حتى 20MB
              </p>
            </>
          )}
        </div>
        
        <input
          ref={photoInputRef}
          id="photo-upload"
          name="photo-upload"
          type="file"
          accept="image/png, image/jpeg, image/jpg"
          className="sr-only"
          onChange={handlePhotoChange}
          disabled={isLoading || submitDisabled}
        />
      </div>
    </div>
  );
};

export default PhotoUploader;
