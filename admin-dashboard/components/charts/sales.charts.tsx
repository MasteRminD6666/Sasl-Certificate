"use client";
import React from "react";
import Chart, { Props } from "react-apexcharts";
import Box from "../box";

export const SalesChart = ({
  ordersData,
}: {
  ordersData: {
    month: string;
    count: number;
  }[];
}) => {
  const chartSeries: Props["series"] = [
    {
      name: "Sales",
      data: ordersData.map((data) => data.count)
      // data: [31, 40, 28, 51, 42, 109, 100],
    },
  ];

  const chartOptions: Props["options"] = {
    chart: {
      type: "area",
      animations: {
        // @ts-ignore
        easing: "linear",
        speed: 300,
      },
      sparkline: {
        enabled: false,
      },
      brush: {
        enabled: false,
      },
      id: "basic-bar",
      fontFamily: "Inter, sans-serif",
      foreColor: "#ECEDEE",
      stacked: true,
    },

    xaxis: {
      categories: ordersData.map((data) => {
        const date = new Date(data.month);
        return date.toLocaleDateString("default", {
          month: "short",
          year: "numeric",
        });
      }),

      labels: {
        style: {
          colors: "#9ba1a6",
          fontFamily: "Inter, sans-serif",
        },
      },
      axisBorder: {
        color: "#ffffff26",
      },
      axisTicks: {
        color: "#ffffff26",
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "#9ba1a6",
          fontFamily: "Inter, sans-serif",
        },
      },
    },
    tooltip: {
      enabled: true,
    },
    grid: {
      show: true,
      borderColor: "#ffffff26",
      strokeDashArray: 0,
      position: "back",
    },
    stroke: {
      curve: "smooth",
      fill: {
        colors: ["#FF4560"],
      },
    },
    // @ts-ignore
    markers: false,
  };

  return (
    <div className="mt-10">
      <h3>Sales Statistics</h3>
      <Box
        css={{
          width: "100%",
          zIndex: 5,
        }}
        className="bg-[#16181A] text-black rounded-xl p-3"
      >
        <div id="chart">
          <Chart
            options={chartOptions}
            series={chartSeries}
            type="area"
            height={425}
          />
        </div>
      </Box>
    </div>
  );
};
