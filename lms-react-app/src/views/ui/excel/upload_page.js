// pages/UploadStudentsPage.jsx
import React, { useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StudentExcelUpload from "../../../components/excel/student_upload.js";
import { FaUpload, FaArrowLeft, FaFileExcel, FaCheckCircle, FaInfoCircle } from "react-icons/fa";

const UploadStudentsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const uploadRef = useRef();
  const [uploadStatus, setUploadStatus] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  console.log("the given id is:", id);

  const handleUploadClick = () => {
    if (uploadRef.current) {
      setIsUploading(true);
      uploadRef.current.triggerUpload();
    }
  };

  const handleUploadSuccess = (data) => {
    setIsUploading(false);
    setUploadStatus({ type: "success", message: `✅ ${data?.count || "Students"} uploaded successfully!` });
    console.log("Upload successful!", data);
    
    // Auto-clear success message after 5 seconds
    setTimeout(() => setUploadStatus(null), 5000);
  };

  const handleUploadError = (error) => {
    setIsUploading(false);
    setUploadStatus({ type: "error", message: `❌ Upload failed: ${error?.message || "Please check your file format"}` });
  };

  return (
    <div className="upload-students-page">
      {/* Header with Navigation */}
      <div className="page-header">
        <div className="container-fluid">
          <div className="d-flex align-items-center gap-3">
            <div>
              <h1 className="page-title mb-0">Upload Students</h1>
              <p className="page-subtitle mb-0">Bulk upload student records via Excel file</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-fluid py-4">
        {/* Stats / Info Cards */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <div className="info-card">
              <div className="info-card-icon">
                <FaFileExcel className="text-success" size={24} />
              </div>
              <div>
                <h6 className="info-card-title">Supported Format</h6>
                <p className="info-card-text">.xlsx, .xls files only</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="info-card">
              <div className="info-card-icon">
                <FaInfoCircle className="text-primary" size={24} />
              </div>
              <div>
                <h6 className="info-card-title">Template Required</h6>
                <p className="info-card-text">Download template below</p>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="info-card">
              <div className="info-card-icon">
                <FaCheckCircle className="text-warning" size={24} />
              </div>
              <div>
                <h6 className="info-card-title">Institution ID</h6>
                <p className="info-card-text">{id || "Not specified"}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Status Alert */}
        {uploadStatus && (
          <div className={`alert alert-${uploadStatus.type === "success" ? "success" : "danger"} alert-dismissible fade show mb-4`} role="alert">
            {uploadStatus.message}
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => setUploadStatus(null)}
            ></button>
          </div>
        )}

        {/* Main Upload Card */}
        <div className="upload-card">
          <div className="upload-card-header">
            <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
              <button 
                className="btn btn-primary btn-upload" 
                onClick={handleUploadClick}
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <FaUpload className="me-2" />
                    Upload Now
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="upload-card-body">
            <StudentExcelUpload
              ref={uploadRef}
              institutionId={id}
              onSuccess={handleUploadSuccess}
              onError={handleUploadError}
            />
          </div>
        </div>

        {/* Guidelines Section */}
        <div className="guidelines-card mt-4">
          <h6 className="guidelines-title">📋 Upload Guidelines</h6>
          <div className="row g-3">
            <div className="col-md-6">
              <ul className="guidelines-list">
                <li>File must be in <strong>.xlsx</strong> or <strong>.xls</strong> format</li>
                <li>First row should contain column headers</li>
                <li>Required columns: Name, DOB, Gender, Class, Section</li>
                <li>Phone numbers should be 10 digits</li>
              </ul>
            </div>
            <div className="col-md-6">
              <ul className="guidelines-list">
                <li>Email addresses should be valid format</li>
                <li>Date of Birth format: DD/MM/YYYY or MM/DD/YYYY</li>
                <li>Maximum file size: 5MB</li>
                <li>Duplicate entries will be skipped</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Styles */}
      <style jsx>{`
        .upload-students-page {
          background: #f8f9fc;
          min-height: 100vh;
        }

        /* Page Header */
        .page-header {
          background: linear-gradient(135deg,rgb(0, 0, 1) 0%, #764ba2 100%);
          padding: 24px 0;
          color: white;
          box-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
        }

        .page-subtitle {
          font-size: 14px;
          opacity: 0.9;
        }

        .back-btn {
          border-color: rgba(255, 255, 255, 0.3);
          color: white;
          padding: 8px 20px;
          transition: all 0.3s;
        }

        .back-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: white;
          color: white;
        }

        /* Info Cards */
        .info-card {
          background: white;
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          transition: transform 0.2s, box-shadow 0.2s;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .info-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .info-card-icon {
          width: 44px;
          height: 44px;
          border-radius: 10px;
          background: #f8f9fc;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .info-card-title {
          font-size: 13px;
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 2px;
        }

        .info-card-text {
          font-size: 13px;
          color: #718096;
          margin-bottom: 0;
        }

        /* Upload Card */
        .upload-card {
          background: white;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .upload-card-header {
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
          background: #fafbfc;
        }

        .upload-card-body {
          padding: 24px;
        }

        .btn-upload {
          padding: 10px 28px;
          border-radius: 10px;
          font-weight: 500;
          background: linear-gradient(135deg,rgb(0, 0, 0) 0%, #764ba2 100%);
          border: none;
          transition: all 0.3s;
        }

        .btn-upload:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }

        .btn-upload:disabled {
          opacity: 0.7;
        }

        /* Guidelines Card */
        .guidelines-card {
          background: white;
          border-radius: 16px;
          padding: 20px 24px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .guidelines-title {
          font-weight: 600;
          color: #2d3748;
          margin-bottom: 12px;
        }

        .guidelines-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .guidelines-list li {
          padding: 4px 0;
          font-size: 14px;
          color: #4a5568;
          position: relative;
          padding-left: 20px;
        }

        .guidelines-list li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #667eea;
          font-weight: bold;
        }

        /* Alert styling */
        .alert {
          border-radius: 12px;
          border: none;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page-header {
            padding: 16px 0;
          }
          
          .page-title {
            font-size: 20px;
          }

          .upload-card-header {
            padding: 16px;
          }

          .upload-card-body {
            padding: 16px;
          }

          .btn-upload {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default UploadStudentsPage;