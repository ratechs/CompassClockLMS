import React, { useEffect, useMemo, useState } from "react";
import {
    Table,
    Button,
    Container,
    Row,
    Col,
    Card,
    CardBody,
    Input,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthcontext } from "../../contexts/Authcontext";

const InstitutionTable = () => {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [typeFilter, setTypeFilter] = useState("All");
    const [activeTab, setActiveTab] = useState("All");
    const [institutions, setInstitutions] = useState([]);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { authUser } = useAuthcontext();

    const role = authUser?.user?.role;
    const userId = authUser?.user?._id;

    // =========================================================
    // FETCH INSTITUTIONS
    // =========================================================

    useEffect(() => {
        const fetchInstitutions = async () => {
            if (!userId) return;

            try {
                setLoading(true);

                const url =
                    role === "coordinator"
                        ? `/api/institutions/managment/${userId}/`
                        : `/api/institutions`;

                const res = await axios.get(url);

                setInstitutions(res.data?.data || []);
            } catch (error) {
                console.error("Institution fetch error:", error);
                toast.error("Error loading institutions");
            } finally {
                setLoading(false);
            }
        };

        fetchInstitutions();
    }, [role, userId]);

    // =========================================================
    // REFRESH
    // =========================================================

    const refreshInstitutions = async () => {
        if (!userId) return;

        try {
            setLoading(true);

            const url =
                role === "coordinator"
                    ? `/api/institutions/managment/${userId}/`
                    : `/api/institutions`;

            const res = await axios.get(url);

            setInstitutions(res.data?.data || []);

            toast.success("Institutions refreshed");
        } catch (error) {
            console.error("Refresh error:", error);
            toast.error("Unable to refresh institutions");
        } finally {
            setLoading(false);
        }
    };

    // =========================================================
    // DELETE
    // =========================================================

    const deleteData = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this institution?"
        );

        if (!confirmed) return;

        try {
            const res = await axios.delete(`/api/institutions/${id}`);

            setInstitutions((prev) =>
                prev.filter((inst) => (inst._id || inst.id) !== id)
            );

            toast.success(
                res.data?.message || "Institution deleted successfully"
            );
        } catch (error) {
            console.error("Delete institution error:", error);
            toast.error("Error deleting institution");
        }
    };

    // =========================================================
    // COUNTS
    // =========================================================

    const totalCount = institutions.length;

    const schoolCount = institutions.filter(
        (inst) => inst.type?.toLowerCase() === "school"
    ).length;

    const collegeCount = institutions.filter(
        (inst) => inst.type?.toLowerCase() === "college"
    ).length;

    const educationalCenterCount = institutions.filter(
        (inst) =>
            inst.type?.toLowerCase() === "educational center"
    ).length;

    const approvedCount = institutions.filter(
        (inst) => inst.status?.toLowerCase() === "approved"
    ).length;

    const pendingCount = institutions.filter(
        (inst) => inst.status?.toLowerCase() === "pending"
    ).length;

    // =========================================================
    // FILTER
    // =========================================================

    const filteredInstitutions = useMemo(() => {
        const searchText = search.toLowerCase().trim();

        return institutions.filter((inst) => {
            const matchesSearch =
                inst.name?.toLowerCase().includes(searchText) ||
                inst.type?.toLowerCase().includes(searchText) ||
                inst.status?.toLowerCase().includes(searchText) ||
                inst.location?.city?.toLowerCase().includes(searchText) ||
                inst.location?.country?.toLowerCase().includes(searchText);

            const matchesStatus =
                statusFilter === "All" ||
                inst.status?.toLowerCase() === statusFilter.toLowerCase();

            const matchesType =
                typeFilter === "All" ||
                inst.type?.toLowerCase() === typeFilter.toLowerCase();

            let matchesTab = true;

            if (activeTab === "Schools") {
                matchesTab = inst.type?.toLowerCase() === "school";
            }

            if (activeTab === "Colleges") {
                matchesTab = inst.type?.toLowerCase() === "college";
            }

            if (activeTab === "Educational Centers") {
                matchesTab =
                    inst.type?.toLowerCase() ===
                    "educational center";
            }

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType &&
                matchesTab
            );
        });
    }, [
        institutions,
        search,
        statusFilter,
        typeFilter,
        activeTab,
    ]);

    // =========================================================
    // INITIALS
    // =========================================================

    const getInitials = (name) => {
        if (!name) return "IN";

        return name
            .split(" ")
            .slice(0, 2)
            .map((word) => word.charAt(0).toUpperCase())
            .join("");
    };

    // =========================================================
    // ADD INSTITUTION
    // =========================================================

    const handleAddInstitution = () => {
        if (role === "coordinator") {
            navigate("/coordinator/institutions/create");
        } else {
            navigate("/instructor/institutions/create");
        }
    };

    // =========================================================
    // CLEAR FILTERS
    // =========================================================

    const clearFilters = () => {
        setSearch("");
        setStatusFilter("All");
        setTypeFilter("All");
        setActiveTab("All");
    };

    // =========================================================
    // STATUS
    // =========================================================

    const renderStatus = (status) => {
        const value = status || "Unknown";

        if (value.toLowerCase() === "approved") {
            return (
                <span className="institution-status approved">
                    <span className="status-dot"></span>
                    Active
                </span>
            );
        }

        if (value.toLowerCase() === "pending") {
            return (
                <span className="institution-status pending">
                    <span className="status-dot"></span>
                    Pending
                </span>
            );
        }

        if (value.toLowerCase() === "rejected") {
            return (
                <span className="institution-status rejected">
                    <span className="status-dot"></span>
                    Rejected
                </span>
            );
        }

        return (
            <span className="institution-status">
                <span className="status-dot"></span>
                {value}
            </span>
        );
    };

    // =========================================================
    // RENDER
    // =========================================================

    return (
        <Container fluid className="institution-page">

            {/* =================================================
                PAGE HEADER
            ================================================= */}

            <div className="institution-page-header">

                <div className="institution-title-section">

                    <div className="institution-main-icon">
                        <i className="bi bi-building"></i>
                    </div>

                    <div>
                        <h1>Institutions</h1>

                        <p>
                            Manage institutions, schools, colleges and
                            educational centers
                        </p>
                    </div>

                </div>

                <div className="institution-header-actions">

                    <Button
                        className="institution-refresh-btn"
                        onClick={refreshInstitutions}
                        disabled={loading}
                    >
                        <i className="bi bi-arrow-clockwise me-2"></i>
                        Refresh
                    </Button>

                    <Button
                        color="primary"
                        className="institution-add-btn btn-gradient"
                        onClick={handleAddInstitution}
                    >
                        <i className="bi bi-plus-lg me-2"></i>
                        Add Institution
                    </Button>

                </div>

            </div>


            {/* =================================================
                MAIN CARD
            ================================================= */}

            <Card className="institution-main-card">

                {/* =================================================
                    TABS
                ================================================= */}

                <div className="institution-tabs">

                    <button
                        className={
                            activeTab === "All"
                                ? "institution-tab active"
                                : "institution-tab"
                        }
                        onClick={() => setActiveTab("All")}
                    >
                        <i className="bi bi-buildings"></i>
                        <span>All Institutions</span>

                        <b>{totalCount}</b>
                    </button>

                    <button
                        className={
                            activeTab === "Schools"
                                ? "institution-tab active"
                                : "institution-tab"
                        }
                        onClick={() => setActiveTab("Schools")}
                    >
                        <i className="bi bi-mortarboard"></i>
                        <span>Schools</span>

                        <b>{schoolCount}</b>
                    </button>

                    <button
                        className={
                            activeTab === "Colleges"
                                ? "institution-tab active"
                                : "institution-tab"
                        }
                        onClick={() => setActiveTab("Colleges")}
                    >
                        <i className="bi bi-bank"></i>
                        <span>Colleges</span>

                        <b>{collegeCount}</b>
                    </button>

                    <button
                        className={
                            activeTab === "Educational Centers"
                                ? "institution-tab active"
                                : "institution-tab"
                        }
                        onClick={() =>
                            setActiveTab("Educational Centers")
                        }
                    >
                        <i className="bi bi-house"></i>
                        <span>Educational Centers</span>

                        <b>{educationalCenterCount}</b>
                    </button>

                </div>

                {/* =================================================
                    FILTER SECTION
                ================================================= */}

                <div className="institution-filter-section">

                    <div className="filter-header">

                        <div className="filter-title">
                            <i className="bi bi-search"></i>
                            <span>Filters</span>
                        </div>

                        <button
                            className="clear-filter-btn"
                            onClick={clearFilters}
                        >
                            Clear Filters
                        </button>

                    </div>

                    <Row className="g-3">

                        {/* SEARCH */}
                        <Col xs="12" sm="6" lg="3">

                            <label>Institution</label>

                            <div className="filter-input-wrapper">

                                <i className="bi bi-search"></i>

                                <Input
                                    type="text"
                                    placeholder="Search institution..."
                                    value={search}
                                    onChange={(e) =>
                                        setSearch(e.target.value)
                                    }
                                />

                            </div>

                        </Col>

                        {/* TYPE */}
                        <Col xs="12" sm="6" lg="3">

                            <label>Type</label>

                            <Input
                                type="select"
                                value={typeFilter}
                                onChange={(e) =>
                                    setTypeFilter(e.target.value)
                                }
                            >
                                <option value="All">All Types</option>
                                <option value="School">School</option>
                                <option value="College">College</option>
                                <option value="Educational Center">
                                    Educational Center
                                </option>
                            </Input>

                        </Col>

                        {/* STATUS */}
                        <Col xs="12" sm="6" lg="3">

                            <label>Status</label>

                            <Input
                                type="select"
                                value={statusFilter}
                                onChange={(e) =>
                                    setStatusFilter(e.target.value)
                                }
                            >
                                <option value="All">All Status</option>
                                <option value="Approved">
                                    Approved
                                </option>
                                <option value="Pending">
                                    Pending
                                </option>
                                <option value="Rejected">
                                    Rejected
                                </option>
                            </Input>

                        </Col>

                        {/* RESULTS */}
                        <Col xs="12" sm="6" lg="3">

                            <label>Results</label>

                            <div className="results-box">
                                <i className="bi bi-list-ul"></i>

                                <span>
                                    {filteredInstitutions.length}{" "}
                                    institutions
                                </span>
                            </div>

                        </Col>

                    </Row>

                </div>

                {/* =================================================
                    TABLE
                ================================================= */}

                <div className="institution-table-wrapper">

                    <Table
                        responsive
                        hover
                        className="institution-table"
                    >

                        <thead>

                            <tr>

                                <th>INSTITUTION</th>
                                <th>TYPE</th>
                                <th>LOCATION</th>
                                <th>STATUS</th>
                                <th>APPROVAL</th>
                                <th className="text-end">
                                    ACTIONS
                                </th>

                            </tr>

                        </thead>

                        <tbody>

                            {/* LOADING */}
                            {loading && (
                                <tr>

                                    <td
                                        colSpan="6"
                                        className="institution-empty"
                                    >

                                        <div className="loading-container">

                                            <div className="spinner-border text-primary"></div>

                                            <p>
                                                Loading institutions...
                                            </p>

                                        </div>

                                    </td>

                                </tr>
                            )}

                            {/* EMPTY */}
                            {!loading &&
                                filteredInstitutions.length === 0 && (
                                    <tr>

                                        <td
                                            colSpan="6"
                                            className="institution-empty"
                                        >

                                            <div className="empty-icon">
                                                <i className="bi bi-building-x"></i>
                                            </div>

                                            <h5>
                                                No institutions found
                                            </h5>

                                            <p>
                                                Try changing your search
                                                or filters.
                                            </p>

                                        </td>

                                    </tr>
                                )}

                            {/* DATA */}
                            {!loading &&
                                filteredInstitutions.map((inst) => {

                                    const id =
                                        inst._id || inst.id;

                                    return (
                                        <tr key={id}>

                                            {/* INSTITUTION */}
                                            <td>

                                                <div className="institution-user">

                                                    <div className="institution-avatar">
                                                        {getInitials(
                                                            inst.name
                                                        )}
                                                    </div>

                                                    <div>

                                                        <div className="institution-name">
                                                            {inst.name}
                                                        </div>

                                                        <div className="institution-id">
                                                            ID:{" "}
                                                            {String(
                                                                id
                                                            ).slice(-8)}
                                                        </div>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* TYPE */}
                                            <td>

                                                <div className="institution-type">

                                                    <i
                                                        className={
                                                            inst.type?.toLowerCase() ===
                                                                "school"
                                                                ? "bi bi-mortarboard"
                                                                : inst.type?.toLowerCase() ===
                                                                    "college"
                                                                    ? "bi bi-bank"
                                                                    : "bi bi-house-door"
                                                        }
                                                    ></i>

                                                    <span>
                                                        {inst.type ||
                                                            "N/A"}
                                                    </span>

                                                </div>

                                            </td>

                                            {/* LOCATION */}
                                            <td>

                                                <div className="institution-location">

                                                    <i className="bi bi-geo-alt"></i>

                                                    <div>

                                                        <span>
                                                            {inst.location
                                                                ?.city ||
                                                                "N/A"}
                                                        </span>

                                                        <small>
                                                            {inst.location
                                                                ?.country ||
                                                                ""}
                                                        </small>

                                                    </div>

                                                </div>

                                            </td>

                                            {/* STATUS */}
                                            <td>
                                                {renderStatus(
                                                    inst.status
                                                )}
                                            </td>

                                            {/* APPROVAL */}
                                            <td>

                                                {inst.status ===
                                                    "Approved" ? (
                                                    <span className="approval approved">
                                                        <span className="approval-check">
                                                            <i className="bi bi-check"></i>
                                                        </span>
                                                        Approved
                                                    </span>
                                                ) : inst.status ===
                                                    "Rejected" ? (
                                                    <span className="approval rejected">
                                                        <span className="approval-check">
                                                            <i className="bi bi-x"></i>
                                                        </span>
                                                        Rejected
                                                    </span>
                                                ) : (
                                                    <span className="approval pending">
                                                        <span className="approval-check">
                                                            <i className="bi bi-clock"></i>
                                                        </span>
                                                        Pending
                                                    </span>
                                                )}

                                            </td>

                                            {/* ACTIONS */}
                                            <td>

                                                <div className="institution-actions">

                                                    {/* STUDENTS */}
                                                    <Link
                                                        to={
                                                            role ===
                                                                "coordinator"
                                                                ? `/coordinator/institutions/edit/${id}`
                                                                : `/instructor/institutions/${id}/students`
                                                        }
                                                    >

                                                        <Button
                                                            className="action-button students"
                                                            title="Students"
                                                        >
                                                            <i className="bi bi-people"></i>
                                                        </Button>

                                                    </Link>

                                                    {/* EDIT */}
                                                    <Link
                                                        to={
                                                            role ===
                                                                "coordinator"
                                                                ? `/coordinator/institutions/edit/${id}`
                                                                : `/instructor/institutions/edit/${id}`
                                                        }
                                                    >

                                                        <Button
                                                            className="action-button edit"
                                                            title="Edit"
                                                        >
                                                            <i className="bi bi-pencil"></i>
                                                        </Button>

                                                    </Link>

                                                    {/* DELETE */}
                                                    {role !==
                                                        "coordinator" && (
                                                            <Button
                                                                className="action-button delete"
                                                                title="Delete"
                                                                onClick={() =>
                                                                    deleteData(
                                                                        id
                                                                    )
                                                                }
                                                            >
                                                                <i className="bi bi-trash"></i>
                                                            </Button>
                                                        )}

                                                </div>

                                            </td>

                                        </tr>
                                    );
                                })}

                        </tbody>

                    </Table>

                </div>

            </Card>

        </Container>
    );
};

export default InstitutionTable;