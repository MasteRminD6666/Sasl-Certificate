"use client";
import Header from "@/components/header";
import { Card, CardBody } from "@nextui-org/react";
import { HiOutlineDocumentCurrencyDollar } from "react-icons/hi2";
import { FaArrowDown, FaArrowUp } from "react-icons/fa6";
import Users from "@/components/tables/users.table";

import React, { useEffect, useState } from "react";
import { SalesChart } from "@/components/charts/sales.charts";

const Page = () => {
  const [ordersData, setordersData] = useState([]);
  const [usersData, setUsersData] = useState([]);

  useEffect(() => {
    const fetchOrdersAnalytics = async () => {
      const response = await fetch(`/api/get-analytics?model=${"orders"}`);
      const orders = await response.json();
      setordersData(orders.data.last12Months);
    };
    const fetchUsersAnalytics = async () => {
      const response = await fetch(`/api/get-analytics?model=${"user"}`);
      const orders = await response.json();
      setUsersData(orders.data.last12Months);
    };
    fetchOrdersAnalytics();
    fetchUsersAnalytics();
  }, []);

  return (
    <div className="w-full">
      <Header />
      <div className="w-full flex justify-between p-4 lg:p-6">
        <div className="w-full lg:w-[75%] pr-4">
          <div className="flex flex-wrap lg:flex-nowrap gap-4">
            <Card className="flex-1 h-[200px] px-1 bg-blue-600 rounded-xl min-w-[260px]">
              <CardBody className="py-5 !overflow-hidden">
                <div className="flex gap-2 px-2">
                  <HiOutlineDocumentCurrencyDollar
                    className="mt-[2px]"
                    size={28}
                  />
                  <div>
                    <span className="text-lg font-semibold">
                      Revenue Generated
                    </span>
                    <h5 className="text-[14px]">Summary of revenue</h5>
                  </div>
                </div>
                <div className="flex w-full gap-2 items-center">
                  <h3 className="text-2xl font-semibold p-2">$3,211</h3>
                  <span className="text-green-300">+2.3%</span>
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <div className="flex w-full gap-1 items-center">
                      <FaArrowUp className="text-[14px] text-green-300" />
                      <span className="text-[14px]">$4,120</span>
                      <span className="text-green-300">+2.3%</span>
                    </div>
                    <span className="text-[14px]">November</span>
                  </div>
                  <div>
                    <div className="flex w-full gap-1 items-center">
                      <FaArrowDown className="text-[14px] text-red-400" />
                      <span className="text-[14px]">$2,520</span>
                      <span className="text-red-400">-3.2%</span>
                    </div>
                    <span className="text-[14px]">October</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="flex-1 h-[200px] px-1 bg-[#16181A] rounded-xl min-w-[260px]">
              <CardBody className="py-5 !overflow-hidden">
                <div className="flex gap-2 px-2">
                  <HiOutlineDocumentCurrencyDollar
                    className="mt-[2px]"
                    size={28}
                  />
                  <div>
                    <span className="text-lg font-semibold">Users Created</span>
                    <h5 className="text-[14px]">Summary of new users</h5>
                  </div>
                </div>
                <div className="flex w-full gap-2 items-center">
                  <h3 className="text-2xl font-semibold p-2">1,211</h3>
                  <span className="text-green-300">+4.3%</span>
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <div className="flex w-full gap-1 items-center">
                      <FaArrowDown className="text-[14px] text-red-400" />
                      <span className="text-[14px]">820</span>
                      <span className="text-red-400">-2.3%</span>
                    </div>
                    <span className="text-[14px]">November</span>
                  </div>
                  <div>
                    <div className="flex w-full gap-1 items-center">
                      <FaArrowUp className="text-[14px] text-green-300" />
                      <span className="text-[14px]">1,320</span>
                      <span className="text-green-300">+1.2%</span>
                    </div>
                    <span className="text-[14px]">October</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card className="flex-1 h-[200px] px-1 bg-[#5119c9] rounded-xl min-w-[260px]">
              <CardBody className="py-5 !overflow-hidden">
                <div className="flex gap-2 px-2">
                  <HiOutlineDocumentCurrencyDollar
                    className="mt-[2px]"
                    size={28}
                  />
                  <div>
                    <span className="text-lg font-semibold">App Installed</span>
                    <h5 className="text-[14px]">Summary of installations</h5>
                  </div>
                </div>
                <div className="flex w-full gap-2 items-center">
                  <h3 className="text-2xl font-semibold p-2">625</h3>
                  <span className="text-green-300">+0.3%</span>
                </div>
                <div className="mt-4 flex justify-between">
                  <div>
                    <div className="flex w-full gap-1 items-center">
                      <FaArrowUp className="text-[14px] text-green-300" />
                      <span className="text-[14px]">620</span>
                      <span className="text-green-300">+2.3%</span>
                    </div>
                    <span className="text-[14px]">November</span>
                  </div>
                  <div>
                    <div className="flex w-full gap-1 items-center">
                      <FaArrowDown className="text-[14px] text-red-400" />
                      <span className="text-[14px]">$420</span>
                      <span className="text-red-400">-3.2%</span>
                    </div>
                    <span className="text-[14px]">October</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
          <SalesChart ordersData={ordersData} />
        </div>
        <div className="w-full lg:w-[25%] gap-y-2 mt-4 h-screen lg:mt-0">
          <Users rowsPerPage={4} title="Latest Orders" />
          <Users rowsPerPage={3} title="Latest Users" />
        </div>
      </div>
    </div>
  );
};

export default Page;
