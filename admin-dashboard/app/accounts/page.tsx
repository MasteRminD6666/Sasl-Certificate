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
  Button,
  DropdownTrigger,
  Dropdown,
  DropdownMenu,
  DropdownItem,
  Chip,
  Pagination,
  Spinner,
  Avatar,
} from "@nextui-org/react";
import { VerticalDotsIcon, SearchIcon } from "@/utils/icons";
import { format } from "timeago.js";

// Define table columns
export const columns = [
  { name: "ID", uid: "id", sortable: true },
  { name: "AVATAR", uid: "avatar", sortable: false },
  { name: "NAME", uid: "name", sortable: true },
  { name: "ORDERS", uid: "orders", sortable: false },
  { name: "CREATED", uid: "created", sortable: true },
  { name: "ROLE", uid: "role", sortable: true },
  { name: "STATUS", uid: "status", sortable: true },
  { name: "ACTIONS", uid: "actions" },
];

// Status color mapping for Chip component
const statusColorMap = {
  active: "success",
  paused: "danger",
  vacation: "warning",
};

// Define User type
type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  orders: any[];
  avatar?: string;
  createdAt: string;
};

interface SortDescriptor {
  column: string;
  direction: "ascending" | "descending";
}

export default function UserTable() {
  const [filterValue, setFilterValue] = useState("");
  const [data, setData] = useState<User[]>([]);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "name",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
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

        const response = await fetch(`/api/get-users?${params.toString()}`);
        if (!response.ok) {
          throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();
        setData(result.data);
        setTotalUsers(result.meta.totalUsers);
      } catch (err: any) {
        setError(err.message || "Failed to fetch users.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [page, rowsPerPage, sortDescriptor, filterValue]);

  const renderCell = useCallback((user: User, columnKey: React.Key) => {
    const cellValue = user[columnKey as keyof User];

    switch (columnKey) {
      case "name":
        return (
          <div>
            <span>{user.name}</span>
            <p className="text-gray-500 text-sm">{user.email}</p>
          </div>
        );
      case "role":
        return <span>{user.role}</span>;
      case "orders":
        return <span>{user.orders.length}</span>;
      case "created":
        return <span>{format(user?.createdAt)}</span>;
      case "avatar":
        return (
          <Avatar
            src={user.avatar || "https://via.placeholder.com/50"}
            alt="Avatar"
            className="rounded-full w-10 h-10"
          />
        );
      case "status":
        return (
          <Chip
            // @ts-ignore
            color={statusColorMap[user.status.toLowerCase()]}
            size="sm"
            variant="flat"
          >
            {user.status}
          </Chip>
        );
      case "actions":
        return (
          <Dropdown>
            <DropdownTrigger>
              <Button isIconOnly size="sm" variant="light">
                <VerticalDotsIcon className="text-gray-400" />
              </Button>
            </DropdownTrigger>
            <DropdownMenu>
              <DropdownItem key="contact">Contact</DropdownItem>
              <DropdownItem key="delete">Delete</DropdownItem>
            </DropdownMenu>
          </Dropdown>
        );
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
          placeholder="Search by name..."
          value={filterValue}
          endContent={<SearchIcon />}
          onClear={() => setFilterValue("")}
          onChange={(e) => {
            setFilterValue(e.target.value);
            setPage(1); // Reset to the first page when the filter value changes
          }}
        />
      </div>
      <Table
        aria-label="User Table"
        className="h-[80vh]"
        css={{ height: "auto" }}
        sortDescriptor={sortDescriptor}
        // @ts-ignore
        onSortChange={(descriptor: SortDescriptor) => {
          setSortDescriptor({
            column: String(descriptor.column), // Ensure column is a string
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
          emptyContent={isLoading ? <Spinner size="lg" /> : "No users found."}
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
        <span className="text-sm text-gray-500">Total: {totalUsers} users</span>
        <Pagination
          page={page}
          total={Math.ceil(totalUsers / rowsPerPage)}
          onChange={(newPage) => setPage(newPage)}
        />
      </div>
    </div>
  );
}
