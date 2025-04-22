
import React from "react";
import PhotoUploader from "./PhotoUploader";
import FileHistoryCollapsible from "./FileHistoryCollapsible";
import { UserRecord } from "@/types";

interface FormStepProps {
  fullName: string;
  setFullName: (name: string) => void;
  teamNumber: string;
  setTeamNumber: (num: string) => void;
  serialNumber: string;
  setSerialNumber: (num: string) => void;
  gender: "قائد" | "قائدة" | "";
  setGender: (gender: "قائد" | "قائدة" | "") => void;
  photoPreview: string;
  userRank: string;
  isLoading: boolean;
  isDarkMode: boolean;
  triggerFileInput: () => void;
  photoInputRef: React.RefObject<HTMLInputElement>;
  handlePhotoChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  submitForm: () => Promise<void>;
  previousFiles: UserRecord[];
  isCollapsibleOpen: boolean;
  setIsCollapsibleOpen: (open: boolean) => void;
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
  setIsCollapsibleOpen
}) => {
  return (
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
            
            <PhotoUploader
              photoPreview={photoPreview}
              triggerFileInput={triggerFileInput}
              photoInputRef={photoInputRef}
              handlePhotoChange={handlePhotoChange}
              isLoading={isLoading}
              isDarkMode={isDarkMode}
            />
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
              <span className={`${gender === "قائد" ? (isDarkMode ? 'text-indigo-200' : 'text-indigo-700') : (isDarkMode ? 'text-gray-300' : '')}`}>قائد</span>
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
              <span className={`${gender === "قائدة" ? (isDarkMode ? 'text-indigo-200' : 'text-indigo-700') : (isDarkMode ? 'text-gray-300' : '')}`}>قائدة</span>
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
          <FileHistoryCollapsible 
            previousFiles={previousFiles}
            isCollapsibleOpen={isCollapsibleOpen}
            setIsCollapsibleOpen={setIsCollapsibleOpen}
            isDarkMode={isDarkMode}
          />
        )}
      </div>
    </div>
  );
};

export default FormStep;
