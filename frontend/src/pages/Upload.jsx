import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { resumeAPI } from '../services/api';
import toast from 'react-hot-toast';
import { HiOutlineCloudUpload, HiOutlineDocument, HiOutlineCheckCircle, HiOutlineXCircle, HiOutlineEye } from 'react-icons/hi';

export default function Upload() {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [results, setResults] = useState([]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Some files were rejected. Only PDF and DOCX files under 10MB are accepted.');
    }
    setFiles(prev => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setResults([]);

    try {
      const response = await resumeAPI.upload(files);
      setResults(response.results || []);
      setFiles([]);

      if (response.success_count > 0) {
        toast.success(`${response.success_count} resume(s) uploaded successfully!`);
      }
      if (response.failed_count > 0) {
        toast.error(`${response.failed_count} resume(s) failed to process.`);
      }
    } catch (err) {
      toast.error(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="animate-fadeIn">
      <div className="page-header">
        <h1>Upload Resumes</h1>
        <p>Upload candidate resumes for parsing and indexing</p>
      </div>

      {/* Dropzone */}
      <div {...getRootProps()} className={`dropzone ${isDragActive ? 'active' : ''}`} style={{ marginBottom: '1.5rem' }}>
        <input {...getInputProps()} />
        <div className="dropzone-icon"><HiOutlineCloudUpload /></div>
        <h3>{isDragActive ? 'Drop files here...' : 'Drag & drop resumes here'}</h3>
        <p>or browse files</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--text-tertiary)' }}>
          Supported formats: PDF, DOCX • Max 10MB per file
        </p>
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="card mb-xl">
          <div className="card-header">
            <div className="card-title">Selected Files ({files.length})</div>
            <button className="btn btn-primary" onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <><div className="spinner spinner-sm" style={{ borderTopColor: '#fff', marginBottom: 0 }} /> Processing...</>
              ) : (
                <><HiOutlineCloudUpload /> Upload & Process</>
              )}
            </button>
          </div>
          {files.map((file, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <HiOutlineDocument style={{ color: 'var(--accent-primary)', fontSize: '1.25rem' }} />
                <div>
                  <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{file.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {(file.size / 1024).toFixed(1)} KB • {file.name.split('.').pop().toUpperCase()}
                  </div>
                </div>
              </div>
              <button className="btn btn-ghost btn-sm" onClick={() => removeFile(i)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Results */}
      {results.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div className="card-title">Processing Results</div>
          </div>
          {results.map((result, i) => (
            <div key={i} className="animate-fadeInUp" style={{ padding: '1rem 0', borderBottom: '1px solid var(--border)', animationDelay: `${i * 100}ms` }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {result.status === 'success' ? (
                    <HiOutlineCheckCircle style={{ color: 'var(--success)', fontSize: '1.5rem', flexShrink: 0 }} />
                  ) : (
                    <HiOutlineXCircle style={{ color: 'var(--danger)', fontSize: '1.5rem', flexShrink: 0 }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem' }}>
                      {result.status === 'success' ? result.candidate?.name : result.filename}
                    </div>
                    {result.status === 'success' ? (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        {result.candidate?.email} • {result.skills_found?.length || 0} skills found
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.8125rem', color: 'var(--danger)' }}>{result.error}</div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {result.status === 'success' && (
                    <>
                      <div className="skill-badges">
                        {(result.skills_found || []).slice(0, 4).map((s, j) => (
                          <span key={j} className="skill-badge">{s}</span>
                        ))}
                        {(result.skills_found || []).length > 4 && (
                          <span className="badge badge-neutral">+{result.skills_found.length - 4}</span>
                        )}
                      </div>
                      <Link to={`/candidates/${result.candidate?.id}`} className="btn btn-secondary btn-sm">
                        <HiOutlineEye /> View
                      </Link>
                    </>
                  )}
                  <span className={`badge ${result.status === 'success' ? 'badge-success' : 'badge-danger'}`}>
                    {result.status === 'success' ? 'Processed ✓' : 'Failed ✗'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
