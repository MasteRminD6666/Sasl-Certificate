import React, { useState } from "react";
import Logo from "../icons/logo";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@nextui-org/dropdown";
import Box from "../box";
import DownArrow from "../icons/downarrow";

const CompaniesDropdown = () => {
  const [company, setCompany] = useState({
    name: "Betafier inc.",
    location: "Manchestar, UK",
    logo: <Logo />,
  });
  return (
    <Dropdown placement="bottom-end">
      <DropdownTrigger className="cursor-pointer">
        <Box>
          <div className="flex justify-center gap-2">
            <Logo />
            <Box>
              <h3 className="text-xl font-medium dark:text-[#ecedee]">
                Betafier Inc.
              </h3>
              <h5 className="font-medium text-xs dark:text-[#ecedeecf]">
                Manchestar, Uk
              </h5>
            </Box>
            <div className="mt-[10px]">
              <DownArrow />
            </div>
          </div>
        </Box>
      </DropdownTrigger>
      <DropdownMenu
        onAction={(e) => {
          if (e === "1") {
            setCompany({
              name: "SASL Certificate",
              location: "KSA",
              logo: <Logo />,
            });
          }
          if (e === "2") {
            setCompany({
              name: "SASL Certificate",
              location: "KSA",
              logo: <Logo />,
            });
          }
        }}
        aria-label="Avatar Actions"
      >
        <DropdownSection title={"Companies"} className="w-full">
          <DropdownItem
            key="1"
            startContent={<Logo />}
            description="A Programming Community"
          >
            SASL Certificate
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};

export default CompaniesDropdown;
