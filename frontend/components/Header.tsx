import { FC } from "react";

import { ModeToggle } from "./ModeToggle";
import LocaleSwitcher from "./LocaleSwitcher";

const Header: FC = () => {
  return (
    <div className="h-16 w-full px-8 flex items-center justify-end">
      <div className="flex w-max gap-4">
        <LocaleSwitcher />
        <ModeToggle />
      </div>
    </div>
  );
};

export default Header;
