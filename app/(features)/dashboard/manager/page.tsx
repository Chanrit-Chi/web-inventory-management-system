"use client";

import React, { useState } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Search,
  Bell,
  Settings,
  Menu,
  X,
  Plus,
  BarChart3,
  ShoppingCart,
  Users,
} from "lucide-react";

export default function InventoryHome() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const stats = [
    {
      title: "Total Products",
      value: "2,543",
      change: "+12.5%",
      trend: "up",
      icon: Package,
    },
    {
      title: "Low Stock Items",
      value: "23",
      change: "-8.2%",
      trend: "down",
      icon: AlertCircle,
    },
    {
      title: "Total Orders",
      value: "1,429",
      change: "+23.1%",
      trend: "up",
      icon: ShoppingCart,
    },
    {
      title: "Revenue",
      value: "$54,239",
      change: "+18.7%",
      trend: "up",
      icon: TrendingUp,
    },
  ];

  const recentProducts = [
    {
      id: 1,
      name: "Wireless Mouse",
      sku: "WM-001",
      stock: 145,
      status: "In Stock",
    },
    {
      id: 2,
      name: "USB-C Cable",
      sku: "UC-002",
      stock: 12,
      status: "Low Stock",
    },
    {
      id: 3,
      name: "Laptop Stand",
      sku: "LS-003",
      stock: 0,
      status: "Out of Stock",
    },
    { id: 4, name: "Keyboard", sku: "KB-004", stock: 89, status: "In Stock" },
    { id: 5, name: "Webcam HD", sku: "WC-005", stock: 34, status: "In Stock" },
  ];

  const navItems = [
    { name: "Dashboard", icon: BarChart3 },
    { name: "Products", icon: Package },
    { name: "Orders", icon: ShoppingCart },
    { name: "Customers", icon: Users },
    { name: "Analytics", icon: TrendingUp },
    { name: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h1 className="text-xl font-bold">Inventory</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
          {navItems.map((item, index) => (
            <button
              key={index}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                index === 0
                  ? "bg-white text-black"
                  : "text-gray-400 hover:bg-gray-900 hover:text-white"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.name}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Bell className="w-5 h-5" />
              </button>
              <div className="w-10 h-10 bg-black text-white rounded-full flex items-center justify-center font-semibold">
                JD
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 space-y-6">
          {/* Welcome Section */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-black">Dashboard</h2>
              <p className="text-gray-600 mt-1">
                Welcome back! Here&apos;s what&apos;s happening today.
              </p>
            </div>
            <button className="flex items-center space-x-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
              <Plus className="w-5 h-5" />
              <span>Add Product</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="p-6 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <stat.icon className="w-6 h-6 text-black" />
                  </div>
                  <div
                    className={`flex items-center space-x-1 text-sm font-medium ${
                      stat.trend === "up" ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{stat.change}</span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-black">{stat.value}</h3>
                <p className="text-sm text-gray-600 mt-1">{stat.title}</p>
              </div>
            ))}
          </div>

          {/* Recent Products Table */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-black">Recent Products</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-black">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                        {product.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            product.status === "In Stock"
                              ? "bg-green-100 text-green-800"
                              : product.status === "Low Stock"
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
