"use client";
import React from "react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownSection,
  DropdownItem,
} from "@nextui-org/dropdown";
import { Navbar, NavbarItem } from "@nextui-org/navbar";
import { Badge } from "@nextui-org/react";
import { IoMdNotifications } from "react-icons/io";

const Notifications = () => {
  return (
    <Dropdown placement="bottom-start">
      <DropdownTrigger>
        <NavbarItem className="cursor-pointer mt-[6px]">
          <Badge color="danger" content="5">
            <IoMdNotifications color="#687176" size={22} />
          </Badge>
        </NavbarItem>
      </DropdownTrigger>
      <DropdownMenu aria-label="Avatar Actions" className="w-full md:w-[340px]">
        <DropdownSection title={"Notifications"}>
          <DropdownItem key={"1"}>
            📣 Edit your information
            <p className="text-sm opacity-[.8]">
              Sint occaecat cupidatat non proident, sunt in culpa qui officia
              deserunt mollit anim.
            </p>
          </DropdownItem>
          <DropdownItem key={"1"}>
            🚀 Say goodbye to paper receipts!
            <p className="text-sm opacity-[.8]">
              Sint occaecat cupidatat non proident, sunt in culpa qui officia
              deserunt mollit anim.
            </p>
          </DropdownItem>
        </DropdownSection>
      </DropdownMenu>
    </Dropdown>
  );
};

export default Notifications;
