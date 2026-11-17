import React from "react";

const monthlyData = [
  { month: "Apr", revenue: 180000, orders: 120 },
  { month: "May", revenue: 240000, orders: 158 },
  { month: "Jun", revenue: 310000, orders: 201 },
  { month: "Jul", revenue: 280000, orders: 187 },
  { month: "Aug", revenue: 390000, orders: 245 },
  { month: "Sep", revenue: 420000, orders: 278 },
  { month: "Oct", revenue: 485000, orders: 312 },
];

export default function Reports() {

  const maxRevenue = Math.max(
    ...monthlyData.map((item) => item.revenue)
  );

  return (
    <div>

      <div className="om-report-header">

        <div>
          <h3>Financial Reports</h3>
          <p>
            Analyze your course sales and revenue performance.
          </p>
        </div>

        <div className="om-report-actions">

          <select className="om-select">
            <option>Last 7 Months</option>
            <option>Last 30 Days</option>
            <option>Last 12 Months</option>
          </select>

          <button className="om-primary-btn">
            <i className="bi bi-download"></i>
            Download Report
          </button>

        </div>

      </div>

      <div className="om-stat-grid">

        <Stat
          title="Gross Revenue"
          value="₹22.84L"
          change="+18.2%"
        />

        <Stat
          title="Net Revenue"
          value="₹18.42L"
          change="+15.8%"
        />

        <Stat
          title="Total Orders"
          value="1,284"
          change="+12.5%"
        />

        <Stat
          title="Average Order"
          value="₹1,778"
          change="+6.4%"
        />

      </div>

      {/* Revenue Chart */}
      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Revenue Overview</h5>
            <p>Monthly revenue performance.</p>
          </div>

        </div>

        <div className="om-chart">

          {monthlyData.map((item) => {

            const height =
              (item.revenue / maxRevenue) * 100;

            return (
              <div
                className="om-chart-column"
                key={item.month}
              >

                <div className="om-chart-value">
                  ₹{Math.round(
                    item.revenue / 1000
                  )}K
                </div>

                <div className="om-chart-bar-container">

                  <div
                    className="om-chart-bar"
                    style={{
                      height: `${height}%`,
                    }}
                  />

                </div>

                <span>
                  {item.month}
                </span>

              </div>
            );
          })}

        </div>

      </div>

      {/* Report cards */}
      <div className="om-report-grid">

        <ReportCard
          icon="bi bi-bar-chart"
          title="Sales Report"
          description="Course sales and order performance."
        />

        <ReportCard
          icon="bi bi-wallet2"
          title="Revenue Report"
          description="Detailed revenue and commission breakdown."
        />

        <ReportCard
          icon="bi bi-arrow-counterclockwise"
          title="Refund Report"
          description="Refund requests and refunded amounts."
        />

        <ReportCard
          icon="bi bi-credit-card"
          title="Payment Report"
          description="Payment gateway transaction summary."
        />

      </div>

    </div>
  );
}

function Stat({ title, value, change }) {
  return (
    <div className="om-stat-card">

      <div className="om-stat-icon">
        <i className="bi bi-graph-up"></i>
      </div>

      <div className="om-stat-content">

        <span>{title}</span>

        <h3>{value}</h3>

        <small className="om-positive">
          <i className="bi bi-arrow-up"></i>
          {change}
        </small>

      </div>

    </div>
  );
}

function ReportCard({
  icon,
  title,
  description,
}) {
  return (
    <div className="om-report-card">

      <div className="om-report-icon">
        <i className={icon}></i>
      </div>

      <div>
        <h5>{title}</h5>
        <p>{description}</p>
      </div>

      <button className="om-icon-btn">
        <i className="bi bi-arrow-right"></i>
      </button>

    </div>
  );
}