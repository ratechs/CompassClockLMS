import React from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";

const menuItems = [
  {
    title: "Orders",
    href: "/instructor/order-management/orders",
    icon: "bi bi-bag-check",
  },
  {
    title: "Refunds",
    href: "/instructor/order-management/refunds",
    icon: "bi bi-arrow-counterclockwise",
  },
  {
    title: "Payouts",
    href: "/instructor/order-management/payouts",
    icon: "bi bi-wallet2",
  },
  {
    title: "Transactions",
    href: "/instructor/order-management/transactions",
    icon: "bi bi-receipt",
  },
  {
    title: "Reports",
    href: "/instructor/order-management/reports",
    icon: "bi bi-bar-chart-line",
  },
  {
    title: "Settings",
    href: "/instructor/order-management/settings",
    icon: "bi bi-gear",
  },
];

export default function OrderManagementLayout() {
  const location = useLocation();

  return (
    <div className="om-page">

      {/* Header */}
      <div className="om-header">

        <div>
          <div className="om-breadcrumb">
            Instructor
            <span>/</span>
            Order Management
          </div>

          <h2>Order Management</h2>

          <p>
            Manage orders, payments, refunds, payouts and financial reports.
          </p>
        </div>

        <div className="om-header-actions">
          <button className="om-export-btn btn-gradient">
            <i className="bi bi-download"></i>
            Export
          </button>
        </div>

      </div>

      {/* Navigation */}
      <div className="om-tabs">

        {menuItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              `om-tab ${isActive ? "active" : ""}`
            }
          >
            <i className={item.icon}></i>
            <span>{item.title}</span>
          </NavLink>
        ))}

      </div>

      {/* Page */}
      <div className="om-content">
        <Outlet />
      </div>

    </div>
  );
}