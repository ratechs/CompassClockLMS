import React, { useState } from "react";

const transactions = [
  {
    id: "TXN-88291",
    order: "ORD-10245",
    student: "Arun Kumar",
    type: "Course Purchase",
    method: "Razorpay",
    amount: 12999,
    status: "Success",
    date: "05 Oct 2026",
  },
  {
    id: "TXN-88290",
    order: "ORD-10244",
    student: "Priya S",
    type: "Course Purchase",
    method: "UPI",
    amount: 7999,
    status: "Success",
    date: "04 Oct 2026",
  },
  {
    id: "TXN-88289",
    order: "ORD-10242",
    student: "Divya K",
    type: "Refund",
    method: "Razorpay",
    amount: -4999,
    status: "Refunded",
    date: "03 Oct 2026",
  },
];

export default function Transactions() {

  const [search, setSearch] = useState("");

  const filtered = transactions.filter(
    (item) =>
      item.id.toLowerCase().includes(search.toLowerCase()) ||
      item.student.toLowerCase().includes(search.toLowerCase()) ||
      item.order.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>

      <div className="om-stat-grid">

        <Stat
          title="Transactions"
          value="4,892"
          icon="bi bi-receipt"
        />

        <Stat
          title="Successful"
          value="4,612"
          icon="bi bi-check-circle"
        />

        <Stat
          title="Failed"
          value="142"
          icon="bi bi-x-circle"
        />

        <Stat
          title="Net Amount"
          value="₹18.42L"
          icon="bi bi-currency-rupee"
        />

      </div>

      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Transactions</h5>
            <p>Complete payment transaction history.</p>
          </div>

        </div>

        <div className="om-filters">

          <div className="om-search">

            <i className="bi bi-search"></i>

            <input
              placeholder="Search transaction..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

          </div>

          <select className="om-select">
            <option>All Transactions</option>
            <option>Course Purchase</option>
            <option>Refund</option>
            <option>Payout</option>
          </select>

          <button className="om-filter-btn">
            <i className="bi bi-calendar3"></i>
            Date
          </button>

        </div>

        <div className="om-table-wrapper">

          <table className="om-table">

            <thead>
              <tr>
                <th>Transaction</th>
                <th>Order</th>
                <th>Student</th>
                <th>Type</th>
                <th>Method</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>

            <tbody>

              {filtered.map((transaction) => (
                <tr key={transaction.id}>

                  <td>
                    <strong>
                      {transaction.id}
                    </strong>
                  </td>

                  <td>{transaction.order}</td>

                  <td>{transaction.student}</td>

                  <td>{transaction.type}</td>

                  <td>{transaction.method}</td>

                  <td>
                    <strong>
                      ₹
                      {Math.abs(
                        transaction.amount
                      ).toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>
                    <span
                      className={`om-status ${
                        transaction.status === "Success"
                          ? "success"
                          : "danger"
                      }`}
                    >
                      {transaction.status}
                    </span>
                  </td>

                  <td>{transaction.date}</td>

                </tr>
              ))}

            </tbody>

          </table>

        </div>

      </div>

    </div>
  );
}

function Stat({ title, value, icon }) {
  return (
    <div className="om-stat-card">

      <div className="om-stat-icon">
        <i className={icon}></i>
      </div>

      <div className="om-stat-content">
        <span>{title}</span>
        <h3>{value}</h3>
      </div>

    </div>
  );
}