import React from "react";

const payouts = [
  {
    id: "PAY-00982",
    amount: 125000,
    method: "Bank Transfer",
    account: "**** 4582",
    status: "Completed",
    date: "01 Oct 2026",
  },
  {
    id: "PAY-00981",
    amount: 87500,
    method: "Bank Transfer",
    account: "**** 4582",
    status: "Processing",
    date: "25 Sep 2026",
  },
  {
    id: "PAY-00980",
    amount: 92000,
    method: "Bank Transfer",
    account: "**** 4582",
    status: "Completed",
    date: "18 Sep 2026",
  },
];

export default function Payouts() {
  return (
    <div>

      <div className="om-stat-grid">

        <div className="om-stat-card">
          <div className="om-stat-icon">
            <i className="bi bi-wallet2"></i>
          </div>

          <div className="om-stat-content">
            <span>Available Balance</span>
            <h3>₹2,84,500</h3>

            <button className="om-small-primary">
              Request Payout
            </button>
          </div>
        </div>

        <Stat
          title="Pending Payout"
          value="₹87,500"
          icon="bi bi-hourglass"
        />

        <Stat
          title="Total Paid"
          value="₹12.84L"
          icon="bi bi-check-circle"
        />

        <Stat
          title="Next Payout"
          value="10 Oct"
          icon="bi bi-calendar"
        />

      </div>

      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Payout History</h5>
            <p>Track all instructor payouts.</p>
          </div>

        </div>

        <div className="om-table-wrapper">

          <table className="om-table">

            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Account</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {payouts.map((payout) => (
                <tr key={payout.id}>

                  <td>
                    <strong>{payout.id}</strong>
                  </td>

                  <td>
                    <strong>
                      ₹{payout.amount.toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>{payout.method}</td>

                  <td>{payout.account}</td>

                  <td>
                    <span
                      className={`om-status ${
                        payout.status === "Completed"
                          ? "success"
                          : "warning"
                      }`}
                    >
                      {payout.status}
                    </span>
                  </td>

                  <td>{payout.date}</td>

                  <td>
                    <button className="om-action-btn">
                      Details
                    </button>
                  </td>

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