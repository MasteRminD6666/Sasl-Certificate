"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Pagination,
  Spinner,
} from "@nextui-org/react";
import { SearchIcon } from "@/utils/icons";
import { format } from "timeago.js";

// Define table columns
export const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "COURSE TITLE", uid: "courseTitle", sortable: true },
  { name: "PRICE", uid: "price", sortable: true },
  { name: "USER NAME", uid: "userName", sortable: true },
  { name: "USER EMAIL", uid: "userEmail", sortable: true },
  { name: "ORDERED AT", uid: "orderedAt", sortable: true },
];

// Define Order type
type Order = {
  id: string;
  courseTitle: string;
  price: number;
  userName: string;
  userEmail: string;
  orderedAt: string;
};

interface SortDescriptor {
  column: string;
  direction: "ascending" | "descending";
}

export default function OrdersTable() {
  const [filterValue, setFilterValue] = useState("");
  const [data, setData] = useState<Order[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "orderedAt",
    direction: "descending",
  });
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: rowsPerPage.toString(),
          sortBy: sortDescriptor.column,
          sortDirection:
            sortDescriptor.direction === "ascending" ? "asc" : "desc",
          search: filterValue,
        });

        const response = await fetch(`/api/get-payments?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        setData(result.data);
        setTotalOrders(result.meta.totalOrders);
      } catch (err: any) {
        setError(err.message || "Failed to fetch orders.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, [page, rowsPerPage, sortDescriptor, filterValue]);

  const renderCell = useCallback((order: Order, columnKey: React.Key) => {
    const cellValue = order[columnKey as keyof Order];

    switch (columnKey) {
      case "courseTitle":
        return <span>{order.courseTitle}</span>;
      case "price":
        return <span>${order.price.toFixed(2)}</span>;
      case "userName":
        return <span>{order.userName}</span>;
      case "userEmail":
        return <span>{order.userEmail}</span>;
      case "orderedAt":
        return <span>{format(order.orderedAt)}</span>;
      default:
        return <span>{cellValue}</span>;
    }
  }, []);

  return (
    <div className="p-4 mt-4 w-[95%] m-auto">
      {error && <div className="text-red-500 mb-4">Error: {error}</div>}
      <div className="flex justify-between items-center mb-4">
        <Input
          isClearable
          className="w-full sm:max-w-[300px]"
          placeholder="Search orders..."
          value={filterValue}
          endContent={<SearchIcon />}
          onClear={() => setFilterValue("")}
          onChange={(e) => {
            setFilterValue(e.target.value);
            setPage(1);
          }}
        />
      </div>
      <Table
        aria-label="Orders Table"
        className="h-[80vh]"
        css={{ height: "auto" }}
        sortDescriptor={sortDescriptor}
        // @ts-ignore
        onSortChange={(descriptor: SortDescriptor) => {
          setSortDescriptor({
            column: String(descriptor.column),
            direction: descriptor.direction,
          });
        }}
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.uid} allowsSorting={column.sortable}>
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          items={data}
          emptyContent={isLoading ? <Spinner size="lg" /> : "No orders found."}
        >
          {(item) => (
            <TableRow key={item.id}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex justify-between items-center py-2">
        <span className="text-sm text-gray-500">
          Total: {totalOrders} orders
        </span>
        <Pagination
          page={page}
          total={Math.ceil(totalOrders / rowsPerPage)}
          onChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  );
}
