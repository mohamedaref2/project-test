
import React from "react";

interface BannerImageProps {
  isDarkMode: boolean;
}

const BannerImage: React.FC<BannerImageProps> = ({ isDarkMode }) => {
  return (
    <div className="w-full h-32 relative overflow-hidden">
      <img 
        src="https://i.ibb.co/sJXfcDHM/3a4c72ac-fd79-4a6f-86d8-96031eec8209.jpg" 
        alt="Banner" 
        className="w-full h-full object-cover"
      />
      <div className={`absolute inset-0 ${isDarkMode ? 'bg-gradient-to-b from-transparent to-gray-800/40' : 'bg-gradient-to-b from-transparent to-white/40'}`} />
    </div>
  );
};

export default BannerImage;
