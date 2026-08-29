import React, { useEffect, useState } from "react";
import {
    Table,
    Button,
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    Input,
} from "reactstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuthcontext } from "../../contexts/Authcontext";

// Mock data
const mockInstitutions = [
    {
        id: 1,
        name: "Greenfield College",
        type: "College",
        status: "Approved",
        location: {
            city: "New York",
            country: "USA",
        },
    },
    {
        id: 2,
        name: "Bright Future School",
        type: "School",
        status: "Pending",
        location: {
            city: "San Francisco",
            country: "USA",
        },
    },
    {
        id: 3,
        name: "Global Educational Center",
        type: "Educational Center",
        status: "Rejected",
        location: {
            city: "Toronto",
            country: "Canada",
        },
    },
];

const InstitutionTable = () => {
    const [search, setSearch] = useState("");
    const [institutions, setInstitutions] = useState([]); // Change from undefined
    const navigate = useNavigate();
    const { authUser } = useAuthcontext();

    useEffect(() => {
        const fetchInstitutions = async () => {
            try {
                const url = authUser?.user?.role === 'coordinator'
                    ? `/api/institution/managment/${authUser.user._id}/`
                    : `/api/institution`;
                const res = await axios.get(url);
                setInstitutions(res.data?.data || []);
            } catch (err) {
                console.log("the error is", err)
                toast.error("Error loading Institutions");
            }
        };
        if (authUser?.user) {
            fetchInstitutions();
        }
    }, [authUser]);

    console.log("the user", authUser.user._id)

    const deleteData = (id) => {
        axios.delete(`/api/institution/${id}`)
            .then(res => toast.success(res.message))
            .catch(err => toast.error("Error loading Coordinators"));
    }

    const filteredInstitutions = institutions?.filter((inst) => {
        const searchText = search.toLowerCase();
        return (
            inst.name.toLowerCase().includes(searchText) ||
            inst.type.toLowerCase().includes(searchText) ||
            inst.status.toLowerCase().includes(searchText) ||
            inst.location.city.toLowerCase().includes(searchText) ||
            inst.location.country.toLowerCase().includes(searchText)
        );
    });

    return (
        <Container className="mt-4">
            <Row>
                <Col>
                    <Card>
                        <CardBody>
                            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-3 gap-3">
                                <CardTitle tag="h5" className="mb-0">
                                    Institutions
                                </CardTitle>
                                <div className="d-flex gap-2 flex-wrap">
                                    <Input
                                        type="text"
                                        placeholder="Search institutions..."
                                        aria-label="Search institutions"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        style={{ width: "250px", minWidth: "180px" }}
                                    />
                                    <Button color="primary" className="flex-shrink-0" onClick={() => navigate(authUser.user.role === 'coordinator' ? "/coordinator/institutions/create" : "/instructor/institutions/create")}>
                                        Add New
                                    </Button>
                                </div>


                            </div>

                            <div className="table-responsive">
                                <Table bordered hover>
                                    <thead className="table-light">
                                        <tr>
                                            <th>Name</th>
                                            <th>Type</th>
                                            <th>Status</th>
                                            <th>Location</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredInstitutions?.length === 0 ? (
                                            <tr>
                                                <td colSpan="5" className="text-center text-muted">
                                                    No institutions found.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredInstitutions?.map((inst) => (
                                                <tr key={inst._id || inst.id}>
                                                    <td>{inst.name}</td>
                                                    <td>{inst.type}</td>
                                                    <td>
                                                        <span
                                                            className={`badge ${inst.status === "Approved"
                                                                ? "bg-success"
                                                                : inst.status === "Pending"
                                                                    ? "bg-warning text-dark"
                                                                    : "bg-danger"
                                                                }`}
                                                        >
                                                            {inst.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {inst.location.city}, {inst.location.country}
                                                    </td>
                                                    <td className="d-flex flex-wrap">
                                                        <Link to={authUser.user.role === 'coordinator' ? `/coordinator/institutions/edit/${inst._id || inst.id}` : `/instructor/institutions/${inst._id || inst.id}/students`}>
                                                            <Button
                                                                color="dark"
                                                                size="sm"
                                                                className="m-1"
                                                                title="Students List"
                                                            >
                                                               SL
                                                            </Button>
                                                        </Link>
                                                        
                                                        <Link to={authUser.user.role === 'coordinator' ? `/coordinator/institutions/edit/${inst._id || inst.id}` : `/instructor/institutions/edit/${inst._id || inst.id}`}>
                                                            <Button
                                                                color="warning"
                                                                size="sm"
                                                                className="m-1"
                                                                title="Edit"
                                                            >
                                                                <i className="bi bi-pencil-fill"></i>
                                                            </Button>
                                                        </Link>
                                                        {
                                                            authUser.user.role !== 'coordinator' && (

                                                                <Button color="danger" size="sm" title="Delete" onClick={() => deleteData(inst._id || inst.id)} className="m-1">
                                                                    <i className="bi bi-trash-fill"></i>
                                                                </Button>
                                                            )
                                                        }
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

export default InstitutionTable;
