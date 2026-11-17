import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMaterialById } from "../../../service/baseService";
import { Button, Spinner } from "reactstrap";
import DOMPurify from "dompurify";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faBookOpen,
  faCircleCheck,
  faClock,
  faDownload,
  faExternalLinkAlt,
  faFilePdf,
  faPlay,
  faVideo,
} from "@fortawesome/free-solid-svg-icons";

const MaterialPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [materialData, setMaterialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
  |--------------------------------------------------------------------------
  | Fetch Material
  |--------------------------------------------------------------------------
  */

  const fetchMaterialById = async (materialId) => {
    try {
      setLoading(true);
      setError("");

      const data = await getMaterialById(materialId);

      setMaterialData(data?.data || null);
    } catch (err) {
      console.error(
        "Error fetching material by ID:",
        err
      );

      setError(
        err?.response?.data?.message ||
          "Unable to load this material."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchMaterialById(id);
    }
  }, [id]);

  /*
  |--------------------------------------------------------------------------
  | Google Drive ID
  |--------------------------------------------------------------------------
  */

  const getDriveId = (url) => {
    if (!url) return "";

    const match =
      url.match(
        /\/file\/d\/([a-zA-Z0-9_-]+)/
      ) ||
      url.match(
        /id=([a-zA-Z0-9_-]+)/
      );

    return match ? match[1] : "";
  };

  /*
  |--------------------------------------------------------------------------
  | Google Drive Preview URL
  |--------------------------------------------------------------------------
  */

  const getPdfViewerUrl = (url) => {
    if (!url) return "";

    if (url.includes("drive.google.com")) {
      const driveId = getDriveId(url);

      if (driveId) {
        return `https://drive.google.com/file/d/${driveId}/preview`;
      }
    }

    return url;
  };

  /*
  |--------------------------------------------------------------------------
  | Content Type
  |--------------------------------------------------------------------------
  */

  const isVideo =
    materialData?.content_type === "Video";

  const isPdf =
    materialData?.content_type === "PDF";

  /*
  |--------------------------------------------------------------------------
  | External Open
  |--------------------------------------------------------------------------
  */

  const openExternal = () => {
    if (!materialData?.content_url) return;

    window.open(
      materialData.content_url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  /*
  |--------------------------------------------------------------------------
  | Loading
  |--------------------------------------------------------------------------
  */

  if (loading) {
    return (
      <div className="material-page-loading">
        <div className="material-loading-icon">
          <Spinner />
        </div>

        <h4>Loading material...</h4>

        <p>
          Preparing your learning content.
        </p>
      </div>
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Error
  |--------------------------------------------------------------------------
  */

  if (error || !materialData) {
    return (
      <div className="material-page-empty">
        <div className="material-empty-icon">
          <FontAwesomeIcon icon={faBookOpen} />
        </div>

        <h3>
          {error
            ? "Unable to load material"
            : "Material not found"}
        </h3>

        <p>
          {error ||
            "The requested learning material is not available."}
        </p>

        <Button
          className="material-back-btn"
          onClick={() => navigate(-1)}
        >
          <FontAwesomeIcon
            icon={faArrowLeft}
          />

          Back
        </Button>
      </div>
    );
  }

  return (
    <div className="material-page">
      <div className="material-page-container">

        {/* ============================================================
            TOP NAVIGATION
        ============================================================= */}

        <div className="material-topbar">

          <button
            type="button"
            className="material-back-link"
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
            />

            <span>Back to Course</span>
          </button>

          <div className="material-learning-label">
            <FontAwesomeIcon
              icon={faBookOpen}
            />

            <span>Learning Material</span>
          </div>

        </div>

        {/* ============================================================
            HEADER
        ============================================================= */}

        <div className="material-header">

          <div className="material-title-section">

            <div
              className={`material-type-icon ${
                isVideo
                  ? "video"
                  : isPdf
                  ? "pdf"
                  : "other"
              }`}
            >
              <FontAwesomeIcon
                icon={
                  isVideo
                    ? faVideo
                    : isPdf
                    ? faFilePdf
                    : faBookOpen
                }
              />
            </div>

            <div className="material-title-content">

              <div className="material-type-row">

                <span
                  className={`material-type-badge ${
                    isVideo
                      ? "video"
                      : isPdf
                      ? "pdf"
                      : "other"
                  }`}
                >
                  {materialData.content_type ||
                    "Material"}
                </span>

                <span className="material-status-badge">
                  <FontAwesomeIcon
                    icon={faCircleCheck}
                  />

                  Available
                </span>

              </div>

              <h1>
                {materialData.name ||
                  "Untitled Material"}
              </h1>

              <p>
                {isVideo
                  ? "Watch this video lesson and continue your learning."
                  : isPdf
                  ? "Read this learning document and continue your course."
                  : "Explore this learning material."}
              </p>

            </div>

          </div>

          <div className="material-header-actions">

            {materialData.content_url && (
              <Button
                type="button"
                className="material-external-btn"
                onClick={openExternal}
              >
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                />

                Open
              </Button>
            )}

          </div>

        </div>

        {/* ============================================================
            MAIN VIEWER
        ============================================================= */}

        <div className="material-main-grid">

          {/* ==========================================================
              CONTENT VIEWER
          =========================================================== */}

          <div className="material-viewer-card">

            <div className="material-viewer-header">

              <div>
                <span className="material-viewer-label">
                  NOW LEARNING
                </span>

                <h3>
                  {materialData.name ||
                    "Learning Material"}
                </h3>
              </div>

              <div className="material-viewer-type">

                <FontAwesomeIcon
                  icon={
                    isVideo
                      ? faPlay
                      : isPdf
                      ? faFilePdf
                      : faBookOpen
                  }
                />

                {materialData.content_type ||
                  "Material"}

              </div>

            </div>

            {/* ========================================================
                VIDEO
            ========================================================= */}

            {isVideo && (
              <div className="material-video-wrapper">

                <video
                  src={materialData.content_url}
                  controls
                  controlsList="nodownload"
                  className="material-video"
                  preload="metadata"
                >
                  Your browser does not support
                  video playback.
                </video>

              </div>
            )}

            {/* ========================================================
                PDF
            ========================================================= */}

            {isPdf && (
              <div className="material-pdf-wrapper">

                <iframe
                  src={getPdfViewerUrl(
                    materialData.content_url
                  )}
                  title={
                    materialData.name ||
                    "PDF Material"
                  }
                  className="material-pdf-viewer"
                  allow="autoplay"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin allow-forms"
                />

              </div>
            )}

            {/* ========================================================
                OTHER
            ========================================================= */}

            {!isVideo && !isPdf && (
              <div className="material-other-content">

                <div className="material-other-icon">
                  <FontAwesomeIcon
                    icon={faBookOpen}
                  />
                </div>

                <h3>
                  {materialData.name}
                </h3>

                <p>
                  This material type can be
                  opened using the available
                  resource.
                </p>

                {materialData.content_url && (
                  <Button
                    className="material-open-resource-btn"
                    onClick={openExternal}
                  >
                    Open Resource
                    <FontAwesomeIcon
                      icon={faArrowRight}
                    />
                  </Button>
                )}

              </div>
            )}

          </div>

          {/* ==========================================================
              SIDE INFORMATION
          =========================================================== */}

          <aside className="material-side-card">

            <div className="material-side-heading">

              <div className="material-side-heading-icon">
                <FontAwesomeIcon
                  icon={faBookOpen}
                />
              </div>

              <div>
                <span>LESSON</span>

                <h3>
                  Material Info
                </h3>
              </div>

            </div>

            {/* TYPE */}

            <div className="material-info-item">

              <div className="material-info-icon">
                <FontAwesomeIcon
                  icon={
                    isVideo
                      ? faVideo
                      : isPdf
                      ? faFilePdf
                      : faBookOpen
                  }
                />
              </div>

              <div>
                <span>Content Type</span>

                <strong>
                  {materialData.content_type ||
                    "Material"}
                </strong>
              </div>

            </div>

            {/* NAME */}

            <div className="material-info-item">

              <div className="material-info-icon">
                <FontAwesomeIcon
                  icon={faBookOpen}
                />
              </div>

              <div>
                <span>Material</span>

                <strong>
                  {materialData.name ||
                    "Untitled"}
                </strong>
              </div>

            </div>

            {/* STATUS */}

            <div className="material-info-item">

              <div className="material-info-icon">
                <FontAwesomeIcon
                  icon={faCircleCheck}
                />
              </div>

              <div>
                <span>Status</span>

                <strong className="material-available">
                  Available
                </strong>
              </div>

            </div>

            {/* OPEN */}

            {materialData.content_url && (
              <Button
                type="button"
                className="material-side-open-btn"
                onClick={openExternal}
              >
                <FontAwesomeIcon
                  icon={faExternalLinkAlt}
                />

                Open in New Tab
              </Button>
            )}

          </aside>

        </div>

        {/* ============================================================
            DESCRIPTION
        ============================================================= */}

        <section className="material-description-card">

          <div className="material-description-header">

            <div className="material-description-icon">
              <FontAwesomeIcon
                icon={faBookOpen}
              />
            </div>

            <div>
              <span>
                ABOUT THIS MATERIAL
              </span>

              <h2>
                Description
              </h2>
            </div>

          </div>

          <div
            className="material-description-content"
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(
                materialData.description ||
                  "<p>No description available for this material.</p>"
              ),
            }}
          />

        </section>

        {/* ============================================================
            BOTTOM NAVIGATION
        ============================================================= */}

        <div className="material-bottom-navigation">

          <Button
            type="button"
            className="material-bottom-back"
            onClick={() => navigate(-1)}
          >
            <FontAwesomeIcon
              icon={faArrowLeft}
            />

            <span>Back to Course</span>
          </Button>

          <div className="material-complete-message">

            <FontAwesomeIcon
              icon={faCircleCheck}
            />

            <span>
              Complete this material and
              continue learning.
            </span>

          </div>

          <Button
            type="button"
            className="material-next-btn"
            onClick={() => navigate(-1)}
          >
            <span>Continue</span>

            <FontAwesomeIcon
              icon={faArrowRight}
            />
          </Button>

        </div>

      </div>
    </div>
  );
};

export default MaterialPage;