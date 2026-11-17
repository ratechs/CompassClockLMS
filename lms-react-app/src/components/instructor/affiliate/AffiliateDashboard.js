import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardBody,
  Col,
  Input,
  InputGroup,
  Row,
  Spinner,
  Table,
} from "reactstrap";

import {
  affiliateDashboardService,
  createAffiliateService,
} from "../../../service/affiliate/affiliateService.js";

import { useAuthcontext } from "../../../contexts/Authcontext.js";
import toast from "react-hot-toast";

const formatCurrency = (value) => {
  const amount = Number(value || 0);

  return `₹${amount.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getStatusClass = (status) => {
  const normalizedStatus = String(status || "pending").toLowerCase();

  const statusClasses = {
    paid: "paid",
    approved: "approved",
    pending: "pending",
    cancelled: "cancelled",
    rejected: "cancelled",
  };

  return statusClasses[normalizedStatus] || "pending";
};

const getStatusLabel = (status) => {
  if (!status) return "Pending";

  return String(status)
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
};

const AffiliateDashboard = () => {
  const { authUser } = useAuthcontext();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [creating, setCreating] = useState(false);
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [screenWidth, setScreenWidth] = useState(90);

  const userId = authUser?.user?._id;

  // Load dashboard
  const loadDashboard = useCallback(
    async (isRefresh = false) => {
      if (!userId) {
        setLoading(false);
        setError("Please sign in to view your affiliate dashboard.");
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const response = await affiliateDashboardService(userId);

        // Supports either Axios responses or services returning response.data.
        const payload =
          response?.data?.data ||
          response?.data ||
          response ||
          null;

        console.log("Affiliate dashboard data:", payload);

        setDashboard(payload);
        setScreenWidth(85);
      } catch (requestError) {
        console.error("Affiliate dashboard error:", requestError);

        setError(
          requestError?.response?.data?.message ||
            "Unable to load your affiliate dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [userId]
  );

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Create affiliate account
  const handleCreateAffiliate = async () => {
    if (!userId) {
      toast.error("Please sign in first.");
      return;
    }

    try {
      setCreating(true);

      await createAffiliateService(userId);

      toast.success("Affiliate account created successfully.");

      await loadDashboard();
    } catch (requestError) {
      console.error("Create affiliate error:", requestError);

      toast.error(
        requestError?.response?.data?.message ||
          "Unable to create your affiliate account."
      );
    } finally {
      setCreating(false);
    }
  };

  const affiliate = dashboard?.affiliate;
  const commissions = Array.isArray(dashboard?.recentCommissions)
    ? dashboard.recentCommissions
    : [];

  // Copy referral link
  const copyReferralLink = async () => {
    const link = affiliate?.referralLink;

    if (!link) {
      toast.error("Referral link is not available.");
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      toast.success("Referral link copied.");
    } catch (copyError) {
      console.error("Copy referral link error:", copyError);
      toast.error("Unable to copy the referral link.");
    }
  };

  // Share referral link
  const shareReferralLink = async () => {
    const link = affiliate?.referralLink;

    if (!link) {
      toast.error("Referral link is not available.");
      return;
    }

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join our learning platform",
          text: "Join our LMS using my referral link.",
          url: link,
        });
      } else {
        await copyReferralLink();
      }
    } catch (shareError) {
      if (shareError?.name !== "AbortError") {
        console.error("Share referral link error:", shareError);
        toast.error("Unable to share the referral link.");
      }
    }
  };

  // Filter commissions
  const filteredCommissions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return commissions.filter((commission) => {
      const studentName =
        commission?.referredUser?.fullname ||
        commission?.referredUser?.email ||
        "User";

      const courseName =
        commission?.course?.name ||
        commission?.course?.title ||
        commission?.course?.courseName ||
        "";

      const status = String(commission?.status || "pending").toLowerCase();

      const matchesSearch =
        !query ||
        studentName.toLowerCase().includes(query) ||
        courseName.toLowerCase().includes(query) ||
        String(commission?.referredUser?.email || "")
          .toLowerCase()
          .includes(query);

      const matchesStatus =
        statusFilter === "all" || status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [commissions, searchTerm, statusFilter]);

  // Earnings visualization
  const pendingEarnings = Number(affiliate?.pendingEarnings || 0);
  const paidEarnings = Number(affiliate?.paidEarnings || 0);
  const totalEarnings = Number(affiliate?.totalEarnings || 0);
  const earningsTotal = pendingEarnings + paidEarnings;

  const paidPercentage =
    earningsTotal > 0
      ? Math.min(100, Math.round((paidEarnings / earningsTotal) * 100))
      : 0;

  // Loading screen
  if (loading) {
    return (
      <div className="affiliate-loading">
        <div className="affiliate-loading-spinner">
          <Spinner />
        </div>
        <h5>Preparing your dashboard</h5>
        <p>Please wait while we load your affiliate information.</p>
      </div>
    );
  }


  // No affiliate account
  if (!affiliate) {
    return (
      <div className="affiliate-dashboard">
        <div className="affiliate-welcome">
          <div className="affiliate-welcome-decoration affiliate-decoration-one" />
          <div className="affiliate-welcome-decoration affiliate-decoration-two" />

          <div className="affiliate-welcome-content">
            <div className="affiliate-welcome-icon">
              <i className="bi bi-people-fill" />
            </div>

            <span className="affiliate-eyebrow">
              AFFILIATE PROGRAM
            </span>

            <h2>Turn your network into an opportunity.</h2>

            <p>
              Share learning opportunities with your friends and network.
              Create your affiliate account to get your personal referral link
              and track your earnings.
            </p>

            <Button
              className="affiliate-primary-button"
              onClick={handleCreateAffiliate}
              disabled={creating}
            >
              {creating ? (
                <>
                  <Spinner size="sm" className="me-2" />
                  Creating account...
                </>
              ) : (
                <>
                  <i className="bi bi-rocket-takeoff me-2" />
                  Create Affiliate Account
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isActive = String(affiliate.status || "").toLowerCase() === "active";

  return (
    <div className="affiliate-dashboard">
      {/* Header */}
      <div className="affiliate-page-header">
        <div className="affiliate-heading">
          <div className="affiliate-heading-icon">
            <i className="bi bi-grid-1x2-fill" />
          </div>

          <div>
            <span className="affiliate-eyebrow">
              AFFILIATE CENTER
            </span>

            <h2>Affiliate Dashboard</h2>

            <p>
              Track referrals, monitor commissions, and manage your earnings.
            </p>
          </div>
        </div>

        <div className="affiliate-header-actions">
          <Badge
            className={`affiliate-account-status ${
              isActive ? "is-active" : "is-inactive"
            }`}
          >
            <span className="affiliate-status-dot" />
            {getStatusLabel(affiliate.status)}
          </Badge>

          <Button
            className="affiliate-refresh-button"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
            title="Refresh dashboard"
          >
            <i
              className={`bi bi-arrow-clockwise ${
                refreshing ? "affiliate-spin" : ""
              }`}
            />
            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert color="warning" className="affiliate-inline-alert">
          {error}
          <Button
            color="link"
            className="p-0 ms-2"
            onClick={() => loadDashboard(true)}
          >
            Retry
          </Button>
        </Alert>
      )}

      {/* Referral link */}
      <Card className="affiliate-referral-card">
        <CardBody>
          <Row className="align-items-center g-4">
            <Col lg="5">
              <div className="affiliate-referral-intro">
                <div className="affiliate-section-icon">
                  <i className="bi bi-link-45deg" />
                </div>

                <div>
                  <h5>Your referral link</h5>
                  <p>
                    Share your link to help others discover our courses.
                  </p>
                </div>
              </div>

              <div className="affiliate-code-line">
                <span>Referral code</span>
                <strong>{affiliate.referralCode || "Not available"}</strong>
              </div>
            </Col>

            <Col lg="7">
              <div className="affiliate-link-label">
                PERSONAL REFERRAL URL
              </div>

              <InputGroup className="affiliate-link-input-group">
                <Input
                  className="affiliate-link-input"
                  value={affiliate.referralLink || ""}
                  readOnly
                  aria-label="Your referral link"
                  onFocus={(event) => event.target.select()}
                />

                <Button
                  className="affiliate-copy-button"
                  onClick={copyReferralLink}
                  disabled={!affiliate.referralLink}
                >
                  <i className="bi bi-copy me-2" />
                  Copy
                </Button>

                <Button
                  className="affiliate-share-button"
                  onClick={shareReferralLink}
                  disabled={!affiliate.referralLink}
                >
                  <i className="bi bi-share me-2" />
                  Share
                </Button>
              </InputGroup>

              <div className="affiliate-link-hint">
                <i className="bi bi-shield-check me-1" />
                Your referral link is unique to your account.
              </div>
            </Col>
          </Row>
        </CardBody>
      </Card>

      {/* Statistics */}
      <div className="affiliate-section-heading">
        <div>
          <h4>Performance overview</h4>
          <p>Your referral activity at a glance.</p>
        </div>
      </div>

      <Row className="affiliate-stat-grid">
        <Col xl="3" sm="6">
          <Card className="affiliate-stat-card">
            <CardBody>
              <div className="affiliate-stat-top">
                <div className="affiliate-stat-icon stat-clicks">
                  <i className="bi bi-cursor-fill" />
                </div>
                <span className="affiliate-stat-caption">Traffic</span>
              </div>

              <div className="affiliate-stat-value">
                {Number(affiliate.clicks || 0).toLocaleString("en-IN")}
              </div>

              <div className="affiliate-stat-label">Total clicks</div>
              <div className="affiliate-stat-foot">
                <i className="bi bi-activity me-1" />
                Referral link activity
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl="3" sm="6">
          <Card className="affiliate-stat-card">
            <CardBody>
              <div className="affiliate-stat-top">
                <div className="affiliate-stat-icon stat-registrations">
                  <i className="bi bi-person-plus-fill" />
                </div>
                <span className="affiliate-stat-caption">Audience</span>
              </div>

              <div className="affiliate-stat-value">
                {Number(affiliate.registrations || 0).toLocaleString("en-IN")}
              </div>

              <div className="affiliate-stat-label">Registrations</div>
              <div className="affiliate-stat-foot">
                <i className="bi bi-people me-1" />
                People referred
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl="3" sm="6">
          <Card className="affiliate-stat-card">
            <CardBody>
              <div className="affiliate-stat-top">
                <div className="affiliate-stat-icon stat-conversions">
                  <i className="bi bi-cart-check-fill" />
                </div>
                <span className="affiliate-stat-caption">Sales</span>
              </div>

              <div className="affiliate-stat-value">
                {Number(affiliate.conversions || 0).toLocaleString("en-IN")}
              </div>

              <div className="affiliate-stat-label">Conversions</div>
              <div className="affiliate-stat-foot">
                <i className="bi bi-check-circle me-1" />
                Successful conversions
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col xl="3" sm="6">
          <Card className="affiliate-stat-card affiliate-stat-featured">
            <CardBody>
              <div className="affiliate-stat-top">
                <div className="affiliate-stat-icon stat-earnings">
                  <i className="bi bi-wallet2" />
                </div>
                <span className="affiliate-stat-caption">Rewards</span>
              </div>

              <div className="affiliate-stat-value">
                {formatCurrency(totalEarnings)}
              </div>

              <div className="affiliate-stat-label">Total earnings</div>
              <div className="affiliate-stat-foot">
                <i className="bi bi-currency-rupee me-1" />
                Affiliate earnings
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Earnings */}
      <div className="affiliate-section-heading affiliate-earnings-heading">
        <div>
          <h4>Earnings summary</h4>
          <p>Understand your current earnings distribution.</p>
        </div>
      </div>

      <Row className="g-3 affiliate-earnings-grid">
        <Col lg="7">
          <Card className="affiliate-earnings-card affiliate-earnings-main">
            <CardBody>
              <div className="affiliate-earnings-top">
                <div>
                  <span className="affiliate-muted-label">
                    TOTAL EARNINGS
                  </span>
                  <h3>{formatCurrency(totalEarnings)}</h3>
                  <p>Combined value of your recorded affiliate earnings.</p>
                </div>

                <div className="affiliate-earnings-icon">
                  <i className="bi bi-graph-up-arrow" />
                </div>
              </div>

              <div className="affiliate-progress-header">
                <span>Paid earnings share</span>
                <strong>{paidPercentage}%</strong>
              </div>

              <div
                className="affiliate-progress-track"
                role="progressbar"
                aria-valuenow={paidPercentage}
                aria-valuemin="0"
                aria-valuemax="100"
                aria-label="Paid earnings share"
              >
                <div
                  className="affiliate-progress-fill"
                  style={{ width: `${paidPercentage}%` }}
                />
              </div>

              <div className="affiliate-progress-legend">
                <span>
                  <i className="legend-dot legend-paid" />
                  Paid: {formatCurrency(paidEarnings)}
                </span>

                <span>
                  <i className="legend-dot legend-pending" />
                  Pending: {formatCurrency(pendingEarnings)}
                </span>
              </div>
            </CardBody>
          </Card>
        </Col>

        <Col lg="5">
          <Card className="affiliate-earnings-card affiliate-balance-card">
            <CardBody>
              <div className="affiliate-balance-item">
                <div className="affiliate-balance-icon balance-pending">
                  <i className="bi bi-hourglass-split" />
                </div>

                <div className="affiliate-balance-content">
                  <span>Pending earnings</span>
                  <h4>{formatCurrency(pendingEarnings)}</h4>
                  <small>Awaiting approval or payment</small>
                </div>
              </div>

              <div className="affiliate-balance-divider" />

              <div className="affiliate-balance-item">
                <div className="affiliate-balance-icon balance-paid">
                  <i className="bi bi-check2-circle" />
                </div>

                <div className="affiliate-balance-content">
                  <span>Paid earnings</span>
                  <h4>{formatCurrency(paidEarnings)}</h4>
                  <small>Recorded as successfully paid</small>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Recent commissions */}
      <Card className="affiliate-commission-card">
        <CardBody>
          <div className="affiliate-commission-header">
            <div>
              <h4>Recent commissions</h4>
              <p>Review the sales and commissions associated with referrals.</p>
            </div>

            <Badge className="affiliate-record-count">
              {filteredCommissions.length} records
            </Badge>
          </div>

          <div className="affiliate-table-toolbar">
            <div className="affiliate-search">
              <i className="bi bi-search" />
              <Input
                type="search"
                placeholder="Search student or course..."
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                aria-label="Search commissions"
              />

              {searchTerm && (
                <button
                  type="button"
                  className="affiliate-search-clear"
                  onClick={() => setSearchTerm("")}
                  aria-label="Clear search"
                >
                  <i className="bi bi-x-lg" />
                </button>
              )}
            </div>

            <div className="affiliate-status-filter">
              <label htmlFor="commission-status">Status</label>
              <Input
                id="commission-status"
                type="select"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
              </Input>
            </div>
          </div>

          <div className="affiliate-table-responsive">
            <Table className="affiliate-table" hover responsive>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Sale amount</th>
                  <th>Rate</th>
                  <th>Commission</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {filteredCommissions.length === 0 ? (
                  <tr>
                    <td colSpan="7">
                      <div className="affiliate-empty-state">
                        <div className="affiliate-empty-icon">
                          <i className="bi bi-receipt" />
                        </div>

                        <h5>
                          {commissions.length === 0
                            ? "No commissions yet"
                            : "No matching commissions"}
                        </h5>

                        <p>
                          {commissions.length === 0
                            ? "Your commission records will appear here when available."
                            : "Try another search term or change the status filter."}
                        </p>

                        {(searchTerm || statusFilter !== "all") && (
                          <Button
                            className="affiliate-reset-button"
                            onClick={() => {
                              setSearchTerm("");
                              setStatusFilter("all");
                            }}
                          >
                            Clear filters
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredCommissions.map((commission, index) => {
                    const studentName =
                      commission?.referredUser?.fullname ||
                      commission?.referredUser?.email ||
                      "Unknown student";

                    const studentEmail =
                      commission?.referredUser?.email || "";

                    const courseName =
                      commission?.course?.name ||
                      commission?.course?.title ||
                      commission?.course?.courseName ||
                      "Course not specified";

                    return (
                      <tr key={commission?._id || `commission-${index}`}>
                        <td>
                          <div className="affiliate-student-cell">
                            <div className="affiliate-student-avatar">
                              {studentName.charAt(0).toUpperCase()}
                            </div>

                            <div className="affiliate-student-details">
                              <strong>{studentName}</strong>
                              <span>{studentEmail || "No email available"}</span>
                            </div>
                          </div>
                        </td>

                        <td>
                          <div className="affiliate-course-cell">
                            <i className="bi bi-journal-bookmark-fill" />
                            <span>{courseName}</span>
                          </div>
                        </td>

                        <td>
                          <span className="affiliate-money">
                            {formatCurrency(commission?.saleAmount)}
                          </span>
                        </td>

                        <td>
                          <span className="affiliate-rate">
                            {Number(commission?.commissionRate || 0)}%
                          </span>
                        </td>

                        <td>
                          <strong className="affiliate-commission-amount">
                            {formatCurrency(commission?.commissionAmount)}
                          </strong>
                        </td>

                        <td>
                          <span className="affiliate-date">
                            {formatDate(
                              commission?.createdAt ||
                                commission?.updatedAt
                            )}
                          </span>
                        </td>

                        <td>
                          <span
                            className={`affiliate-commission-status status-${getStatusClass(
                              commission?.status
                            )}`}
                          >
                            <span className="affiliate-status-dot" />
                            {getStatusLabel(commission?.status)}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </Table>
          </div>

          <div className="affiliate-table-footer">
            <span>
              Showing {filteredCommissions.length} of {commissions.length}{" "}
              commission records
            </span>

            <Button
              className="affiliate-footer-refresh"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
            >
              <i
                className={`bi bi-arrow-clockwise me-2 ${
                  refreshing ? "affiliate-spin" : ""
                }`}
              />
              Refresh records
            </Button>
          </div>
        </CardBody>
      </Card>

      <div className="affiliate-dashboard-footer">
        <i className="bi bi-info-circle me-2" />
        Earnings and commission statuses reflect the information returned by
        your affiliate service.
      </div>
    </div>
  );
};

export default AffiliateDashboard;