import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram, FaLinkedin } from 'react-icons/fa';
import { Col, Row } from 'reactstrap';

const ContactUs = () => {
    const styles = {
        container: {
            padding: '40px',
            backgroundColor: '#000000',
            color: '#fff',
            maxWidth: '100%',
            margin: '0 auto',
            textAlign: 'center',
        },
        section: {
            marginBottom: '0px',
        },
        title: {
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '15px',
        },
        description: {
            fontSize: '16px',
            marginBottom: '20px',
        },
        socialIcons: {
            display: 'flex',
            justifyContent: 'center',
            gap: '15px',
            fontSize: '24px',
        },
        emailContainer: {
            backgroundColor: '#f4f4f4',
            color: '#333',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center',
        },
        emailTitle: {
            fontSize: '24px',
            fontWeight: 'bold',
            marginBottom: '10px',
        },
        emailDescription: {
            fontSize: '16px',
        },
        email: {
            fontWeight: 'bold',
            color: '#007bff',
        },
    };

    return (
        <div>
            <div style={styles.container}>
                <Row>
                    <Col md='6'>
                        <div style={styles.section}>
                            <h2 style={styles.title}>Contact Us</h2>
                            <p style={styles.description}>
                                We would love to hear from you! Feel free to reach out through our social media channels or the contact details below.
                            </p>
                            <div style={styles.socialIcons}>
                                <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                                    <FaFacebook />
                                </a>
                                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                                    <FaTwitter />
                                </a>
                                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                                    <FaInstagram />
                                </a>
                                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={{ color: '#fff' }}>
                                    <FaLinkedin />
                                </a>
                            </div>
                            <p style={styles.description}>Phone: (123) 456-7890</p>
                            <p style={styles.description}>Address: 123 Main St, Anytown, USA</p>
                        </div>
                    </Col>
                    <Col md='6'>
                        <div style={styles.emailContainer}>
                            <h3 style={styles.emailTitle}>Email Us</h3>
                            <p style={styles.emailDescription}>
                                For inquiries, please reach out via email: <span style={styles.email}>info@example.com</span>
                            </p>
                        </div>
                    </Col>
                </Row>

            </div>


        </div>
    );
};

export default ContactUs;
