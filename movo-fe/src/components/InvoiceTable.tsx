"use client";

import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";
import RefreshButton from "./ui/RefreshButton";
interface Invoice {
  id: string;
  invoiceNo: string;
  customer: string;
  email: string;
  status: "prepared" | "paid" | "expired" | "overpaid";
  created: string;
  expired: string;
  paidAmount: string;
  currency: string;
  equivalentAmount: string | null;
}

interface InvoiceTableProps {
  invoices: Invoice[];
}

const statusConfig = {
  prepared: {
    label: "Prepared",
    className: "bg-yellow-100 text-yellow-800 border-yellow-200",
  },
  paid: {
    label: "Paid",
    className: "bg-green-100 text-green-800 border-green-200",
  },
  expired: {
    label: "Expired",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  overpaid: {
    label: "Overpaid",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
};

export default function InvoiceTable({ invoices }: InvoiceTableProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  //filter and search
  const filteredInvoices = useMemo(() => {
    return invoices.filter((invoice) => {
      //search
      const matchesSearch =
        invoice.invoiceNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        invoice.email.toLowerCase().includes(searchQuery.toLowerCase());

      //filter
      const matchesStatus =
        statusFilter === "all" || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedInvoices = filteredInvoices.slice(startIndex, endIndex);

  //handler
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleRowClick = (invoiceId: string) => {
    router.push(`/invoice/${invoiceId}`);
  };

  const handleRefresh = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      {/* Table Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Invoice List
            </h2>
            <p className="text-sm text-gray-500">
              {filteredInvoices.length} of {invoices.length} invoices
              {searchQuery && ` matching "${searchQuery}"`}
            </p>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="flex gap-4 items-center">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search invoices..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full px-4 py-2 border text-gray-600 border-gray-300 focus:ring-2 focus:ring-blue-500 rounded-lg focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearchChange("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
          <div className="relative">
            <select
              className="px-4 py-2 border border-gray-300 text-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="prepared">Prepared</option>
              <option value="paid">Paid</option>
              <option value="expired">Expired</option>
              <option value="overpaid">Overpaid</option>
            </select>
          </div>
          <RefreshButton onClick={handleRefresh} title="Reset Filters" />
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {filteredInvoices.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-2">No invoices found</p>
            <p className="text-gray-400">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filter to find what you're looking for."
                : "There are no invoices to display."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Invoice No.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expired
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Paid Amount
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedInvoices.map((invoice) => {
                const statusInfo = statusConfig[invoice.status];
                return (
                  <tr
                    key={invoice.id}
                    onClick={() => handleRowClick(invoice.id)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <span className="text-blue-600 hover:text-blue-800 font-semibold">
                        {invoice.invoiceNo}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {invoice.customer}
                        </div>
                        <div className="text-sm text-gray-500">
                          {invoice.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusInfo.className}`}
                      >
                        {statusInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.created}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {invoice.expired}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {invoice.paidAmount}
                          </span>
                          <span className="text-gray-500">
                            {invoice.currency}
                          </span>
                        </div>
                        {invoice.equivalentAmount && (
                          <div className="text-xs text-gray-500 mt-1">
                            {invoice.equivalentAmount}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {filteredInvoices.length > 0 && (
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-700">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
              className="px-2 py-1 border border-gray-300 rounded text-sm"
            >
              <option>5</option>
              <option selected>10</option>
              <option>25</option>
            </select>
            <span className="text-sm text-gray-700">
              entries (showing {startIndex + 1}-
              {Math.min(endIndex, filteredInvoices.length)} of{" "}
              {filteredInvoices.length})
            </span>{" "}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousPage}
              disabled={currentPage === 1}
              className={`px-3 py-1 border border-gray-300 rounded text-sm transition-colors ${
                currentPage === 1
                  ? "opacity-50 cursor-not-allowed bg-gray-100"
                  : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              &lt; Previous
            </button>
            <span className="px-3 py-1 text-sm text-gray-700">
              Page {currentPage} of {totalPages || 1}
            </span>{" "}
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className={`px-3 py-1 border border-gray-300 rounded text-sm transition-colors ${
                currentPage >= totalPages
                  ? "opacity-50 cursor-not-allowed bg-gray-100"
                  : "hover:bg-gray-50 cursor-pointer"
              }`}
            >
              Next &gt;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
