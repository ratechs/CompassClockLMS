// components/StudentExcelUpload.jsx
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { FaDownload, FaUpload } from "react-icons/fa";

const StudentExcelUpload = ({ institutionId, onSuccess }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);

  // ================================================================
  // DROPZONE
  // ================================================================

  const onDrop = useCallback((acceptedFiles) => {
    const selected = acceptedFiles[0];
    if (selected) {
      setFile(selected);
      setResult(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
  });

  // ================================================================
  // UPLOAD
  // ================================================================

  const handleUpload = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    try {
      const response = await axios.post(
        `/api/uploads/students/${institutionId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setResult(response.data.data);
      toast.success("Students uploaded successfully!");

      if (onSuccess) onSuccess(response.data);

      setFile(null);
    } catch (error) {
      const msg = error.response?.data?.message || "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  // ================================================================
  // DOWNLOAD TEMPLATE
  // ================================================================

  const downloadTemplate = async () => {
    try {
      const response = await axios.get("/api/uploads/template/students", {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = "students_template.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Template downloaded!");
    } catch (error) {
      toast.error("Failed to download template");
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  return (
    <div className="student-excel-upload">
      <div className="upload-header">
        <h4>Bulk Upload Students</h4>
        <p className="text-muted">Upload Excel file to add or update students</p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`dropzone ${isDragActive ? "active" : ""} ${file ? "has-file" : ""}`}
      >
        <input {...getInputProps()} />
        <div className="dropzone-content">
          {file ? (
            <>
              <span className="file-icon">📄</span>
              <p className="file-name">{file.name}</p>
              <p className="file-size">{(file.size / 1024).toFixed(2)} KB</p>
              <button
                className="btn btn-sm btn-outline-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
              >
                Remove
              </button>
            </>
          ) : (
            <>
              <span className="upload-icon"><FaUpload className="me-2" /></span>
              <p className="drop-text">
                {isDragActive
                  ? "Drop your Excel file here..."
                  : "Drag & drop or click to select"}
              </p>
              <p className="drop-subtext">Supports .xlsx, .xls, .csv (Max 10MB)</p>
            </>
          )}
        </div>
      </div>

      {/* Buttons */}
      <div className="upload-actions">
        <button
          className="btn btn-outline-primary"
          onClick={downloadTemplate}
          disabled={uploading}
        >
          <FaDownload className="me-2" />
          Download Template
        </button>
        <button
          className="btn btn-primary"
          onClick={handleUpload}
          disabled={!file || uploading}
        >
          {uploading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2"></span>
              Uploading...
            </>
          ) : (
           <>
            <FaUpload className="me-2" />
            "Upload"
            </>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="upload-results">
          <div className="result-summary">
            <span className="text-success">
              ✅ Success: {result.success?.length || 0}
            </span>
            {result.failed?.length > 0 && (
              <span className="text-danger">
                ❌ Failed: {result.failed.length}
              </span>
            )}
            <span className="text-muted">Total: {result.total}</span>
          </div>

          {result.failed?.length > 0 && (
            <div className="error-details">
              <h6>Failed Rows:</h6>
              <ul>
                {result.failed.slice(0, 5).map((item, index) => (
                  <li key={index}>
                    Row {item.row}: {item.errors}
                  </li>
                ))}
                {result.failed.length > 5 && (
                  <li>...and {result.failed.length - 5} more</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentExcelUpload;