import React, { useEffect, useMemo, useState } from "react";
import {
  adminOrderService,
  adminOrderStatsService,
} from "../../../service/baseService.js";

/* =========================================================
   HELPERS
========================================================= */

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "--";
  }

  return number.toLocaleString("en-IN");
};

const formatCurrency = (value, currency = "INR") => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "--";
  }

  if (currency === "INR") {
    return `₹${number.toLocaleString("en-IN")}`;
  }

  return `${currency} ${number.toLocaleString("en-IN")}`;
};

const formatPercentage = (value) => {
  if (value === null || value === undefined || value === "") {
    return "--";
  }

  const number = Number(value);

  if (Number.isNaN(number)) {
    return "--";
  }

  if (number === 0) {
    return "0.00%";
  }

  const sign = number > 0 ? "+" : "";

  return `${sign}${number.toFixed(2)}%`;
};

const formatDate = (date) => {
  if (!date) {
    return "--";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/* =========================================================
   MAIN ORDERS COMPONENT
========================================================= */

export default function Orders() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* =======================================================
     LOAD ORDER DATA
  ======================================================= */

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError("");

      const [statsResponse, ordersResponse] = await Promise.all([
        adminOrderStatsService(),
        adminOrderService(),
      ]);

      /* -----------------------------------------------------
         Stats Response
      ----------------------------------------------------- */

      const statsData = statsResponse?.data ?? statsResponse;

      /* -----------------------------------------------------
         Orders Response
      ----------------------------------------------------- */

      const ordersResponseData =
        ordersResponse?.data ?? ordersResponse;

      /*
       * Supports different backend response structures:
       *
       * 1. [...]
       *
       * 2. { orders: [...] }
       *
       * 3. { data: [...] }
       */

      let ordersData = [];

      if (Array.isArray(ordersResponseData)) {
        ordersData = ordersResponseData;
      } else if (
        Array.isArray(ordersResponseData?.orders)
      ) {
        ordersData = ordersResponseData.orders;
      } else if (
        Array.isArray(ordersResponseData?.data)
      ) {
        ordersData = ordersResponseData.data;
      }

      console.log("Order Stats API Response:", statsData);
      console.log("Orders API Response:", ordersData);

      setStats(statsData);
      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching order data:", err);

      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Unable to load order data."
      );
    } finally {
      setLoading(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadOrders();
  }, []);

  /* =======================================================
     FILTER ORDERS
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();

    return orders.filter((order) => {
      const orderId = String(
        order?.orderId ||
          order?.providerOrderId ||
          order?._id ||
          ""
      ).toLowerCase();

      const studentName = String(
        order?.user?.fullname ||
          order?.user?.name ||
          order?.student?.fullname ||
          order?.student?.name ||
          ""
      ).toLowerCase();

      const email = String(
        order?.user?.email ||
          order?.student?.email ||
          ""
      ).toLowerCase();

      const courseName = String(
        order?.course?.name ||
          order?.course?.title ||
          ""
      ).toLowerCase();

      const paymentProvider = String(
        order?.paymentProvider ||
          order?.paymentMethod ||
          ""
      ).toLowerCase();

      const matchesSearch =
        !searchValue ||
        orderId.includes(searchValue) ||
        studentName.includes(searchValue) ||
        email.includes(searchValue) ||
        courseName.includes(searchValue) ||
        paymentProvider.includes(searchValue);

      const matchesStatus =
        status === "All" ||
        normalizeStatus(order?.status) ===
          normalizeStatus(status);

      return matchesSearch && matchesStatus;
    });
  }, [orders, search, status]);

  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
  };

  /* =======================================================
     EXPORT ORDERS
  ======================================================= */

  const handleExportOrders = () => {
    if (!filteredOrders.length) {
      return;
    }

    const headers = [
      "Order ID",
      "Student",
      "Email",
      "Course",
      "Amount",
      "Payment",
      "Status",
      "Date",
    ];

    const rows = filteredOrders.map((order) => {
      const orderId =
        order?.orderId ||
        order?.providerOrderId ||
        order?._id ||
        "--";

      const studentName =
        order?.user?.fullname ||
        order?.user?.name ||
        order?.student?.fullname ||
        order?.student?.name ||
        "--";

      const email =
        order?.user?.email ||
        order?.student?.email ||
        "--";

      const courseName =
        order?.course?.name ||
        order?.course?.title ||
        "--";

      const payment =
        order?.paymentProvider ||
        order?.paymentMethod ||
        "--";

      const date =
        order?.paidAt ||
        order?.createdAt ||
        null;

      return [
        orderId,
        studentName,
        email,
        courseName,
        order?.amount ?? 0,
        payment,
        order?.status || "--",
        formatDate(date),
      ];
    });

    const csvContent = [
      headers,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
            `"${String(value).replace(/"/g, '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = window.URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = `orders-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    window.URL.revokeObjectURL(url);
  };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="om-container">

      {/* =====================================================
          STATS
      ===================================================== */}

      <div className="om-stat-grid">

        <StatCard
          icon="bi bi-cart-check"
          title="Orders"
          value={
            loading
              ? "..."
              : formatNumber(stats?.totalOrders)
          }
          change={formatPercentage(
            stats?.totalOrderChangeValue
          )}
        />

        <StatCard
          icon="bi bi-check-circle"
          title="Paid"
          value={
            loading
              ? "..."
              : formatNumber(stats?.completedOrders)
          }
          change={formatPercentage(
            stats?.totalPaidOrdersChangeValue
          )}
        />

        <StatCard
          icon="bi bi-clock"
          title="Pending"
          value={
            loading
              ? "..."
              : formatNumber(stats?.pendingOrders)
          }
          change={formatPercentage(
            stats?.totalPendingOrdersChangeValue
          )}
        />

        <StatCard
          icon="bi bi-currency-rupee"
          title="Revenue"
          value={
            loading
              ? "..."
              : formatCurrency(stats?.revenue)
          }
          change={formatPercentage(
            stats?.revenueChange
          )}
        />

      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div
          className="alert alert-danger mt-3 d-flex align-items-center justify-content-between"
          role="alert"
        >
          <div>
            <i className="bi bi-exclamation-triangle me-2"></i>

            {error}
          </div>

          <button
            type="button"
            className="btn btn-sm btn-outline-danger"
            onClick={loadOrders}
          >
            <i className="bi bi-arrow-clockwise me-1"></i>
            Retry
          </button>
        </div>
      )}

      {/* =====================================================
          ORDERS CARD
      ===================================================== */}

      <div className="om-card">

        {/* ===================================================
            HEADER
        =================================================== */}

        <div className="om-card-header">

          <div>
            <h5>Orders</h5>

            <p>
              Manage all course purchase orders.
            </p>
          </div>

          <button
            type="button"
            className="om-primary-btn"
            onClick={handleExportOrders}
            disabled={!filteredOrders.length}
          >
            <i className="bi bi-download"></i>

            Export Orders
          </button>

        </div>

        {/* ===================================================
            FILTERS
        =================================================== */}

        <div className="om-filters">

          {/* Search */}

          <div className="om-search">

            <i className="bi bi-search"></i>

            <input
              type="text"
              placeholder="Search order, student or course..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            {search && (
              <button
                type="button"
                className="border-0 bg-transparent"
                onClick={() => setSearch("")}
                title="Clear search"
              >
                <i className="bi bi-x"></i>
              </button>
            )}

          </div>

          {/* Status */}

          <select
            value={status}
            onChange={(e) =>
              setStatus(e.target.value)
            }
            className="om-select"
          >
            <option value="All">
              All Status
            </option>

            <option value="Completed">
              Completed
            </option>

            <option value="Paid">
              Paid
            </option>

            <option value="Pending">
              Pending
            </option>

            <option value="Refunded">
              Refunded
            </option>

            <option value="Failed">
              Failed
            </option>

            <option value="Cancelled">
              Cancelled
            </option>
          </select>

          {/* Filter */}

          <button
            type="button"
            className="om-filter-btn"
          >
            <i className="bi bi-funnel"></i>

            Filters
          </button>

        </div>

        {/* ===================================================
            RESULT COUNT
        =================================================== */}

        <div className="d-flex justify-content-between align-items-center px-3 py-2">

          <small className="text-muted">

            Showing{" "}

            <strong>
              {filteredOrders.length}
            </strong>{" "}

            of{" "}

            <strong>
              {orders.length}
            </strong>{" "}

            orders

          </small>

          {(search || status !== "All") && (
            <button
              type="button"
              className="btn btn-sm btn-link text-decoration-none"
              onClick={clearFilters}
            >
              Clear filters
            </button>
          )}

        </div>

        {/* ===================================================
            TABLE
        =================================================== */}

        <div className="om-table-wrapper">

          <table className="om-table">

            <thead>
              <tr>
                <th>Order</th>
                <th>Student</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {loading ? (

                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-5"
                  >
                    <div className="text-muted">
                      <div
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></div>

                      Loading orders...
                    </div>
                  </td>
                </tr>

              ) : filteredOrders.length > 0 ? (

                filteredOrders.map((order) => {

                  const orderId =
                    order?.orderId ||
                    order?.providerOrderId ||
                    order?._id ||
                    "--";

                  const studentName =
                    order?.user?.fullname ||
                    order?.user?.name ||
                    order?.student?.fullname ||
                    order?.student?.name ||
                    "Unknown Student";

                  const studentEmail =
                    order?.user?.email ||
                    order?.student?.email ||
                    "--";

                  const courseName =
                    order?.course?.name ||
                    order?.course?.title ||
                    "Unknown Course";

                  const payment =
                    order?.paymentProvider ||
                    order?.paymentMethod ||
                    "--";

                  const date =
                    order?.paidAt ||
                    order?.createdAt ||
                    null;

                  return (
                    <tr
                      key={
                        order?._id ||
                        orderId
                      }
                    >

                      {/* Order */}

                      <td>
                        <strong>
                          {orderId}
                        </strong>
                      </td>

                      {/* Student */}

                      <td>
                        <div className="om-user">

                          <div className="om-avatar">
                            {studentName
                              ?.charAt(0)
                              ?.toUpperCase()}
                          </div>

                          <div>
                            <strong>
                              {studentName}
                            </strong>

                            <small>
                              {studentEmail}
                            </small>
                          </div>

                        </div>
                      </td>

                      {/* Course */}

                      <td>
                        {courseName}
                      </td>

                      {/* Amount */}

                      <td>
                        <strong>
                          {formatCurrency(
                            order?.amount,
                            order?.currency ||
                              "INR"
                          )}
                        </strong>
                      </td>

                      {/* Payment */}

                      <td>
                        {payment}
                      </td>

                      {/* Status */}

                      <td>
                        <StatusBadge
                          status={
                            order?.status
                          }
                        />
                      </td>

                      {/* Date */}

                      <td>
                        {formatDate(date)}
                      </td>

                      {/* More */}

                      <td>
                        <button
                          type="button"
                          className="om-more"
                          title="More options"
                          onClick={() =>
                            console.log(
                              "Selected order:",
                              order
                            )
                          }
                        >
                          <i className="bi bi-three-dots-vertical"></i>
                        </button>
                      </td>

                    </tr>
                  );
                })

              ) : (

                <tr>
                  <td
                    colSpan="8"
                    className="text-center py-5"
                  >

                    <div className="text-muted">

                      <i
                        className="bi bi-inbox"
                        style={{
                          fontSize: "40px",
                        }}
                      ></i>

                      <div className="mt-2">
                        No orders found.
                      </div>

                      {(search ||
                        status !== "All") && (
                        <button
                          type="button"
                          className="btn btn-sm btn-link"
                          onClick={clearFilters}
                        >
                          Clear filters
                        </button>
                      )}

                    </div>

                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </div>
    </div>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  title,
  value,
  change,
}) {
  const isNegative =
    change &&
    change !== "--" &&
    change.startsWith("-");

  const hasChange =
    change &&
    change !== "--";

  return (
    <div className="om-stat-card">

      {/* Icon */}

      <div className="om-stat-icon">
        <i className={icon}></i>
      </div>

      {/* Content */}

      <div className="om-stat-content">
        <span>{title}</span>

        <h3>{value}</h3>
      </div>

      {/* Change */}

      <div>
        <small
          className={
            isNegative
              ? "om-negative"
              : "om-positive"
          }
        >

          {hasChange ? (
            <>
              <i
                className={
                  isNegative
                    ? "bi bi-arrow-down"
                    : "bi bi-arrow-up"
                }
              ></i>

              {change}
            </>
          ) : (
            <>
              <i className="bi bi-dash"></i>
              --
            </>
          )}

        </small>
      </div>

    </div>
  );
}

/* =========================================================
   STATUS BADGE
========================================================= */

function StatusBadge({ status }) {
  const normalizedStatus = normalizeStatus(
    status
  );

  let className = "danger";

  switch (normalizedStatus) {
    case "completed":
    case "paid":
      className = "success";
      break;

    case "pending":
    case "created":
      className = "warning";
      break;

    case "refunded":
    case "failed":
    case "cancelled":
      className = "danger";
      break;

    default:
      className = "danger";
      break;
  }

  return (
    <span
      className={`om-status ${className}`}
    >
      {status || "Unknown"}
    </span>
  );
}

/* =========================================================
   NORMALIZE STATUS
========================================================= */

function normalizeStatus(status) {
  return String(status || "")
    .trim()
    .toLowerCase();
}
