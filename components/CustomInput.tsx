import React from 'react';
import Image from 'next/image';

type CustomInputProps = {
  icon: string;
  altText: string;
  mainText: string;
  subText: string;
}

const CustomInput: React.FC<CustomInputProps> = ({ icon, altText, mainText, subText }) => {
  return (
    <div className="relative flex items-center bg-readonly rounded-lg p-2">
      <Image
        width={16}
        height={16}
        src={icon}
        alt={altText}
        className="w-4 h-4 mr-2"
      />
      <div className="flex items-center">
        <span className="text-white font-bold">{mainText}</span>
        <span className="text-gray-400 ml-1 font-bold">({subText})</span>
      </div>
    </div>
  );
};

export default CustomInput;
