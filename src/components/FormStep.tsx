
import React, { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Camera, Upload } from 'lucide-react';
import FileHistoryCollapsible from '@/components/FileHistoryCollapsible';
import PhotoUploader from '@/components/PhotoUploader';
import { UserRecord } from '@/types';

interface FormStepProps {
  fullName: string;
  setFullName: (name: string) => void;
  teamNumber: string;
  setTeamNumber: (team: string) => void;
  serialNumber: string;
  setSerialNumber: (serial: string) => void;
  gender: string;
  setGender: (gender: "قائد" | "قائدة" | "") => void;
  photoPreview: string;
  userRank: string;
  isLoading: boolean;
  isDarkMode: boolean;
  triggerFileInput: () => void;
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitForm: () => void;
  previousFiles: UserRecord[];
  isCollapsibleOpen: boolean;
  setIsCollapsibleOpen: (isOpen: boolean) => void;
  submitDisabled: boolean;
}

const FormStep: React.FC<FormStepProps> = ({
  fullName,
  setFullName,
  teamNumber,
  setTeamNumber,
  serialNumber,
  setSerialNumber,
  gender,
  setGender,
  photoPreview,
  userRank,
  isLoading,
  isDarkMode,
  triggerFileInput,
  photoInputRef,
  handlePhotoChange,
  submitForm,
  previousFiles,
  isCollapsibleOpen,
  setIsCollapsibleOpen,
  submitDisabled
}) => {
  const getRankText = () => {
    switch (userRank) {
      case "قائد":
        return "القائد الكشفي - القائدة الكشفية";
      case "لجان":
        return "لجان التميز التنفيذي";
      case "كشاف":
        return "الكشاف - فتاة الكشافة";
      default:
        return "";
    }
  };

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      <div className="text-center mb-2">
        <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
          استمارة التسجيل
        </h1>
        <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          {getRankText()}
        </p>
      </div>

      {previousFiles.length > 0 && (
        <div className="mb-4">
          <FileHistoryCollapsible 
            previousFiles={previousFiles} 
            isCollapsibleOpen={isCollapsibleOpen} 
            setIsCollapsibleOpen={setIsCollapsibleOpen}
            isDarkMode={isDarkMode}
          />
        </div>
      )}

      <div className="space-y-5">
        {/* Full Name Input */}
        <div>
          <Label className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>الاسم الكامل</Label>
          <Input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="أدخل الاسم الكامل"
            className={`mt-1 ${isDarkMode ? 'bg-gray-700/60 text-white border-gray-600' : 'bg-white/80'} backdrop-blur-sm`}
            disabled={isLoading || submitDisabled}
          />
        </div>

        {/* Conditional Fields based on user rank */}
        {(userRank === "كشاف" || userRank === "قائد") && (
          <>
            {/* Team Number Input */}
            <div>
              <Label className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>رقم الفرقة</Label>
              <Input
                value={teamNumber}
                onChange={(e) => setTeamNumber(e.target.value)}
                placeholder="أدخل رقم الفرقة"
                className={`mt-1 ${isDarkMode ? 'bg-gray-700/60 text-white border-gray-600' : 'bg-white/80'} backdrop-blur-sm`}
                disabled={isLoading || submitDisabled}
              />
            </div>

            {/* Serial Number Input */}
            <div>
              <Label className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>الرقم التسلسلي</Label>
              <Input
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="أدخل الرقم التسلسلي"
                className={`mt-1 ${isDarkMode ? 'bg-gray-700/60 text-white border-gray-600' : 'bg-white/80'} backdrop-blur-sm`}
                disabled={isLoading || submitDisabled}
              />
            </div>

            {/* Photo Upload */}
            <PhotoUploader
              photoPreview={photoPreview}
              triggerFileInput={triggerFileInput}
              photoInputRef={photoInputRef}
              handlePhotoChange={handlePhotoChange}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
              submitDisabled={submitDisabled}
            />
          </>
        )}

        {/* Gender Selection for Leader rank */}
        {userRank === "قائد" && (
          <div className="space-y-3">
            <Label className={`block ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>النوع</Label>
            <RadioGroup value={gender} onValueChange={(value) => setGender(value as "قائد" | "قائدة")}>
              <div className="flex space-x-4 space-x-reverse">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="قائد" id="male" disabled={isLoading || submitDisabled} />
                  <Label htmlFor="male" className={isDarkMode ? 'text-gray-200' : ''}>قائد</Label>
                </div>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <RadioGroupItem value="قائدة" id="female" disabled={isLoading || submitDisabled} />
                  <Label htmlFor="female" className={isDarkMode ? 'text-gray-200' : ''}>قائدة</Label>
                </div>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Submit Button */}
        <Button
          onClick={submitForm}
          disabled={isLoading || submitDisabled}
          className="w-full relative overflow-hidden group mt-4"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            إرسال
            {isLoading ? (
              <svg className="animate-spin -mr-1 ml-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <Upload size={16} className="transition-transform duration-300 group-hover:-translate-y-1" />
            )}
          </span>
          <span className="absolute inset-0 bg-gradient-to-r from-green-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-md"></span>
        </Button>
      </div>
    </div>
  );
};

export default FormStep;
