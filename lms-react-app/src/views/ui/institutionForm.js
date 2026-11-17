import React, { useState, useEffect } from "react";
import {
    Form,
    FormGroup,
    Label,
    Input,
    Button,
    Row,
    Col,
    Card,
    CardBody,
    Container,
} from "reactstrap";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { useCourse } from "../../hooks/Courses/useCourses";

const initialState = {
    institution_image: "",
    institution_id: "",
    name: "",
    type: "College",
    location: {
        address: "",
        city: "",
        state: "",
        zipcode: "",
        country: ""
    },
    contact: {
        person_name: "",
        person_email: "",
        person_phoneNumber: ""
    },
    registered_year: "",
    reffered_by: "",
    status: "Pending",
    institution_management_access: [],
    course_access: []
};

const InstitutionForm = () => {
    const [formData, setFormData] = useState(initialState);
    const [coordinators, setCoordinators] = useState([]);
    const [admins, setAdmins] = useState([]);
    const { id } = useParams();
    const navigate = useNavigate();
    const { course, loading } = useCourse();
    const filterCourses = course.filter((c) => c.course_type === 'public');
   const adminIds = admins.map(a => a._id);
const adminCourses = course.filter(c => adminIds.includes(c.created_by));



    // Fetch coordinators
    useEffect(() => {
        axios.get(`/api/users/role/coordinator`)
            .then(res => setCoordinators(res.data))
            .catch(() => toast.error("Error loading coordinators"));
    }, []);

    useEffect(() => {
        axios.get(`/api/users/role/admin`)
            .then(res => setAdmins(res.data))
            .catch(() => toast.error("Error loading coordinators"));
    }, []);


    // Fetch institution data for editing
    useEffect(() => {
        if (id) {
            axios.get(`/api/institutions/${id}`)
                .then(res => {
                    const data = res.data;
                    setFormData({
                        ...data,
                        institution_management_access: Array.isArray(data.institution_management_access)
                            ? data.institution_management_access.map(user => user._id)
                            : [],
                        location: data.location || initialState.location,
                        contact: data.contact || initialState.contact,
                    });
                })
                .catch(() => toast.error("Error loading institution"));
        }
    }, [id]);


    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name.startsWith("location.")) {
            const key = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                location: { ...prev.location, [key]: value }
            }));
        } else if (name.startsWith("contact.")) {
            const key = name.split(".")[1];
            setFormData(prev => ({
                ...prev,
                contact: { ...prev.contact, [key]: value }
            }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (id) {
                await axios.put(`/api/institutions/${id}`, formData);
                toast.success("Institution updated successfully!");
            } else {
                await axios.post("/api/institutions", formData);
                toast.success("Institution created successfully!");
            }
            navigate("/institutions");
        } catch {
            toast.error("Something went wrong.");
        }
    };

    console.log("For data", formData)
    return (
        <Container className="mt-4">
            <Card>
                <CardBody>
                    <h4>{id ? "Edit" : "Create"} Institution</h4>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Institution Name</Label>
                                    <Input type="text" name="name" value={formData.name} onChange={handleChange} required />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Institution Type</Label>
                                    <Input type="select" name="type" value={formData.type} onChange={handleChange}>
                                        <option>College</option>
                                        <option>School</option>
                                        <option>Educational Center</option>
                                        <option>Other</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Institution ID</Label>
                                    <Input type="text" name="institution_id" value={formData.institution_id} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={12}><h6>Institution Address</h6></Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Address</Label>
                                    <Input type="text" name="location.address" value={formData.location.address} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>City</Label>
                                    <Input type="text" name="location.city" value={formData.location.city} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>State</Label>
                                    <Input type="text" name="location.state" value={formData.location.state} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>Zip Code</Label>
                                    <Input type="text" name="location.zipcode" value={formData.location.zipcode} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={2}>
                                <FormGroup>
                                    <Label>Country</Label>
                                    <Input type="text" name="location.country" value={formData.location.country} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={12}><h6>Contact Person Details</h6></Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Contact Name</Label>
                                    <Input type="text" name="contact.person_name" value={formData.contact.person_name} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Contact Email</Label>
                                    <Input type="email" name="contact.person_email" value={formData.contact.person_email} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Contact Phone</Label>
                                    <Input type="text" name="contact.person_phoneNumber" value={formData.contact.person_phoneNumber} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={12}><h6>Registry Details</h6></Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Registered At</Label>
                                    <Input
                                        type="date"
                                        name="registered_year"
                                        value={formData.registered_year ? formData.registered_year.slice(0, 10) : ""}
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Referred By</Label>
                                    <Input type="text" name="reffered_by" value={formData.reffered_by} onChange={handleChange} />
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Status</Label>
                                    <Input type="select" name="status" value={formData.status} onChange={handleChange}>
                                        <option>Approved</option>
                                        <option>Pending</option>
                                        <option>Rejected</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Institution Management Access</Label>
                                    <Input
                                        type="select"
                                        name="institution_management_access"
                                        multiple
                                        value={
                                            Array.isArray(formData.institution_management_access)
                                                ? formData.institution_management_access.map(String)
                                                : []
                                        }
                                        onChange={(e) => {
                                            const selectedOptions = Array.from(e.target.selectedOptions, opt => opt.value);
                                            setFormData({ ...formData, institution_management_access: selectedOptions });
                                        }}
                                    >
                                        {coordinators.map(user => {
                                            const isSelected = formData.institution_management_access.includes(user._id);
                                            return (
                                                <option
                                                    key={user._id}
                                                    value={user._id}
                                                    style={{
                                                        backgroundColor: isSelected ? "#ededed" : "#ffffff",
                                                        fontWeight: isSelected ? "bold" : "normal"
                                                    }}
                                                    className="text-capitalize"
                                                >
                                                    {user.username}
                                                </option>
                                            );
                                        })}
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label>Course Access</Label>
                                    <div
                                        className="border border-1 p-2 overflow-auto"
                                        style={{
                                            height: "120px",
                                            borderRadius: "0.375rem",
                                            backgroundColor: "#fff"
                                        }}
                                    >
                                        {adminCourses.map(crs => {
                                            const isChecked = formData.course_access.includes(crs._id);
                                            return (
                                                <FormGroup check key={crs._id} className="mb-1">
                                                    <Label check className="text-capitalize" style={{ cursor: "pointer" }}>
                                                        <Input
                                                            type="checkbox"
                                                            value={crs._id}
                                                            checked={isChecked}
                                                            onChange={(e) => {
                                                                const { checked, value } = e.target;
                                                                const currentAccess = [...formData.course_access];

                                                                const updatedAccess = checked
                                                                    ? [...currentAccess, value]
                                                                    : currentAccess.filter(id => id !== value);

                                                                setFormData({ ...formData, course_access: updatedAccess });
                                                            }}
                                                        />{' '}
                                                        {crs.name}
                                                    </Label>
                                                </FormGroup>
                                            );
                                        })}
                                    </div>
                                </FormGroup>
                            </Col>



                        </Row>

                        <Button color="primary" type="submit" className="mt-3">
                            {id ? "Update" : "Create"}
                        </Button>
                    </Form>
                </CardBody>
            </Card>
        </Container>
    );
};

export default InstitutionForm;
