"use client";
import React, { useEffect, useState } from "react";
import Box from "../box";
import { Sidebar } from "./sidebar.styles";
import CompaniesDropdown from "../dropdown/companies.dropdown";
import SidebarItem from "./sidebar-item";
import Home from "../icons/home";
import SidebarMenu from "./sidebar.menu";
import AccountsIcon from "../icons/accounts-icon";
import Payment from "../icons/payment";
import { MdVideoCall } from "react-icons/md";
import { RiVideoFill } from "react-icons/ri";
import { MdOutlineSupportAgent } from "react-icons/md";
import { MdOutlineManageAccounts } from "react-icons/md";
import { MdOutlineNotificationAdd } from "react-icons/md";
import { IoBarChartSharp } from "react-icons/io5";
import { TbDeviceAnalytics } from "react-icons/tb";
import { GrAnalytics } from "react-icons/gr";
import { RiLogoutCircleRLine } from "react-icons/ri";
import useSidebar from "@/hooks/useSidebar";
import { usePathname } from "next/navigation";

const SidebarWrapper = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeSidebar, setActiveSidebar } = useSidebar();
  const pathName = usePathname();

  // Update activeSidebar based on the current path
  useEffect(() => {
    setActiveSidebar(pathName);
  }, [pathName, setActiveSidebar]);

  // Function to determine icon color
  const getIconColor = (route: string) =>
    activeSidebar === route ? "#0085FF" : "#969696";

  return (
    <Box
      css={{
        height: "100vh",
        zIndex: 202,
        position: "sticky",
        padding: "8px",
        top: "0",
        overflowY: "scroll",
        scrollbarWidth: "none"
      }}
      className="sidebar-wrapper"
    >
      {collapsed && (
        <Sidebar.Overlay onClick={() => setCollapsed(!collapsed)} />
      )}
      <Sidebar.Header>
        <CompaniesDropdown />
      </Sidebar.Header>
      <div className="block my-3 h-full">
        <Sidebar.Body className="body sidebar">
          <SidebarItem
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            title="Home"
            icon={<Home fill={getIconColor("/")} />}
            isActive={activeSidebar === "/"}
            href="/"
          />
          <div className="mt-2 block" />
          <SidebarMenu title="Main Menu">
            <SidebarItem
              isActive={activeSidebar === "/accounts"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Accounts"
              href="/accounts"
              icon={<AccountsIcon fill={getIconColor("/accounts")} />}
            />
            <SidebarItem
              isActive={activeSidebar === "/payments"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Payments"
              href="/payments"
              icon={<Payment fill={getIconColor("/payments")} />}
            />
          </SidebarMenu>
          <SidebarMenu title="Content">
            <SidebarItem
              isActive={activeSidebar === "/create-course"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Create Course"
              href="/create-course"
              icon={
                <MdVideoCall size={24} color={getIconColor("/create-course")} />
              }
            />
            <SidebarItem
              isActive={activeSidebar === "/live-courses"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Live Courses"
              href="/live-courses"
              icon={
                <RiVideoFill size={22} color={getIconColor("/live-courses")} />
              }
            />
          </SidebarMenu>
          <SidebarMenu title="Controllers">
            <SidebarItem
              isActive={activeSidebar === "/support-center"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Support Center"
              href="/support-center"
              icon={
                <MdOutlineSupportAgent
                  size={24}
                  color={getIconColor("/support-center")}
                />
              }
            />
            <SidebarItem
              isActive={activeSidebar === "/create-notification"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Create Notifications"
              href="/create-notification"
              icon={
                <MdOutlineNotificationAdd
                  size={24}
                  color={getIconColor("/create-notification")}
                />
              }
            />
            <SidebarItem
              isActive={activeSidebar === "/manage-team"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Manage Team"
              href="/manage-team"
              icon={
                <MdOutlineManageAccounts
                  size={26}
                  color={getIconColor("/manage-team")}
                />
              }
            />
          </SidebarMenu>
          <SidebarMenu title="Analytics">
            <SidebarItem
              isActive={activeSidebar === "/courses-analytics"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Courses Analytics"
              href="/courses-analytics"
              icon={
                <IoBarChartSharp
                  size={20}
                  color={getIconColor("/courses-analytics")}
                />
              }
            />
            <SidebarItem
              isActive={activeSidebar === "/orders-analytics"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Orders Analytics"
              href="/orders-analytics"
              icon={
                <TbDeviceAnalytics
                  size={22}
                  color={getIconColor("/orders-analytics")}
                />
              }
            />
            <SidebarItem
              isActive={activeSidebar === "/users-analytics"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Users Analytics"
              href="/users-analytics"
              icon={
                <GrAnalytics
                  size={20}
                  color={getIconColor("/users-analytics")}
                />
              }
            />
          </SidebarMenu>
          <SidebarMenu title="Extras">
            <SidebarItem
              isActive={activeSidebar === "/logout"}
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              title="Logout"
              href="/"
              icon={
                <RiLogoutCircleRLine
                  size={20}
                  color={getIconColor("/logout")}
                />
              }
            />
          </SidebarMenu>
          <div className="mb-5 block" />
        </Sidebar.Body>
      </div>
    </Box>
  );
};

export default SidebarWrapper;
