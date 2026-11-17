import React, { useState } from "react";

export default function Settings() {

  const [settings, setSettings] = useState({
    autoPayout: true,
    emailOrders: true,
    emailRefunds: true,
    emailPayouts: true,
    invoice: true,
  });

  const updateSetting = (key) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div className="om-settings">

      {/* Payment Settings */}
      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Payment Settings</h5>
            <p>
              Configure how you receive payments.
            </p>
          </div>

        </div>

        <div className="om-settings-body">

          <div className="om-setting-row">

            <div className="om-setting-info">

              <div className="om-setting-icon">
                <i className="bi bi-bank"></i>
              </div>

              <div>
                <strong>Bank Account</strong>
                <p>
                  HDFC Bank •••• 4582
                </p>
              </div>

            </div>

            <button className="om-outline-btn">
              Update
            </button>

          </div>

          <div className="om-setting-row">

            <div className="om-setting-info">

              <div className="om-setting-icon">
                <i className="bi bi-credit-card"></i>
              </div>

              <div>
                <strong>Payment Gateway</strong>
                <p>
                  Razorpay
                </p>
              </div>

            </div>

            <button className="om-outline-btn">
              Configure
            </button>

          </div>

          <div className="om-setting-row">

            <div>

              <strong>
                Automatic Payout
              </strong>

              <p>
                Automatically transfer your available
                balance according to the payout schedule.
              </p>

            </div>

            <Toggle
              checked={settings.autoPayout}
              onClick={() =>
                updateSetting("autoPayout")
              }
            />

          </div>

        </div>

      </div>


      {/* Notifications */}
      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Notifications</h5>
            <p>
              Control your order and payment notifications.
            </p>
          </div>

        </div>

        <div className="om-settings-body">

          <SettingToggle
            title="New Order Notifications"
            description="Receive notifications when a student purchases a course."
            checked={settings.emailOrders}
            onClick={() =>
              updateSetting("emailOrders")
            }
          />

          <SettingToggle
            title="Refund Notifications"
            description="Receive notifications when a refund is requested."
            checked={settings.emailRefunds}
            onClick={() =>
              updateSetting("emailRefunds")
            }
          />

          <SettingToggle
            title="Payout Notifications"
            description="Receive notifications when a payout is processed."
            checked={settings.emailPayouts}
            onClick={() =>
              updateSetting("emailPayouts")
            }
          />

          <SettingToggle
            title="Invoice Generation"
            description="Automatically generate invoices after successful purchases."
            checked={settings.invoice}
            onClick={() =>
              updateSetting("invoice")
            }
          />

        </div>

      </div>


      {/* Refund Policy */}
      <div className="om-card">

        <div className="om-card-header">

          <div>
            <h5>Refund Policy</h5>
            <p>
              Configure your course refund policy.
            </p>
          </div>

        </div>

        <div className="om-form-grid">

          <div className="om-form-group">

            <label>
              Refund Period
            </label>

            <select className="om-select full">
              <option>7 Days</option>
              <option>14 Days</option>
              <option>30 Days</option>
              <option>No Refund</option>
            </select>

          </div>

          <div className="om-form-group">

            <label>
              Minimum Course Completion
            </label>

            <select className="om-select full">
              <option>Less than 10%</option>
              <option>Less than 25%</option>
              <option>Less than 50%</option>
            </select>

          </div>

        </div>

        <div className="om-settings-footer">

          <button className="om-primary-btn">
            Save Changes
          </button>

        </div>

      </div>

    </div>
  );
}

function Toggle({ checked, onClick }) {
  return (
    <button
      className={`om-toggle ${
        checked ? "active" : ""
      }`}
      onClick={onClick}
    >
      <span></span>
    </button>
  );
}

function SettingToggle({
  title,
  description,
  checked,
  onClick,
}) {
  return (
    <div className="om-setting-row">

      <div>

        <strong>{title}</strong>

        <p>{description}</p>

      </div>

      <Toggle
        checked={checked}
        onClick={onClick}
      />

    </div>
  );
}