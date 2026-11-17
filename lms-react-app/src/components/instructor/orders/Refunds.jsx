import React from "react";

const refunds = [
  {
    id: "REF-00421",
    order: "ORD-10242",
    student: "Divya K",
    course: "JavaScript Advanced",
    amount: 4999,
    reason: "Course not suitable",
    status: "Completed",
    date: "03 Oct 2026",
  },
  {
    id: "REF-00420",
    order: "ORD-10231",
    student: "Vijay R",
    course: "React Masterclass",
    amount: 7999,
    reason: "Duplicate purchase",
    status: "Pending",
    date: "02 Oct 2026",
  },
];

export default function Refunds() {
  return (
    <div>

      <div className="om-stat-grid">

        <Stat
          title="Total Refunds"
          value="₹1.24L"
          icon="bi bi-arrow-counterclockwise"
        />

        <Stat
          title="Pending Refunds"
          value="₹28,500"
          icon="bi bi-hourglass-split"
        />

        <Stat
          title="Completed"
          value="42"
          icon="bi bi-check-circle"
        />

        <Stat
          title="Refund Rate"
          value="3.2%"
          icon="bi bi-percent"
        />

      </div>

      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Refund Requests</h5>
            <p>Review and manage student refund requests.</p>
          </div>

          <button className="om-primary-btn">
            <i className="bi bi-download"></i>
            Export
          </button>

        </div>

        <div className="om-table-wrapper">

          <table className="om-table">

            <thead>
              <tr>
                <th>Refund ID</th>
                <th>Order</th>
                <th>Student</th>
                <th>Course</th>
                <th>Amount</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>

            <tbody>

              {refunds.map((refund) => (
                <tr key={refund.id}>

                  <td>
                    <strong>{refund.id}</strong>
                  </td>

                  <td>{refund.order}</td>

                  <td>{refund.student}</td>

                  <td>{refund.course}</td>

                  <td>
                    <strong>
                      ₹{refund.amount.toLocaleString("en-IN")}
                    </strong>
                  </td>

                  <td>{refund.reason}</td>

                  <td>
                    <span
                      className={`om-status ${
                        refund.status === "Completed"
                          ? "success"
                          : "warning"
                      }`}
                    >
                      {refund.status}
                    </span>
                  </td>

                  <td>{refund.date}</td>

                  <td>
                    <button className="om-action-btn">
                      View
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