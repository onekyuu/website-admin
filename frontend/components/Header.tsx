import { FC } from "react";

interface HeaderProps {}

const Header: FC<HeaderProps> = () => {
  return (
    <div className="h-18 w-full bg-gray-800 text-white flex items-center justify-center">
      header
    </div>
  );
};

export default Header;
