import React, { useState, forwardRef } from 'react';

const FileUpload = forwardRef(({ tool, onFilesUploaded }, ref) => {
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragEnter = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Only set drag over to false if we're leaving the upload area entirely
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);

        const files = Array.from(e.dataTransfer.files);
        handleFiles(files);
    };

    const handleFileSelect = (e) => {
        const files = Array.from(e.target.files);
        handleFiles(files);
    };

    const handleFiles = (files) => {
        if (!tool.multiple && files.length > 1) {
            alert('This tool accepts only one file at a time.');
            return;
        }

        onFilesUploaded(files);
    };

    const openFileDialog = () => {
        if (ref && ref.current) {
            ref.current.click();
        }
    };

    const acceptedFormats = tool.accept.replace(/\./g, '').toUpperCase().split(',');

    return (
        <div className="upload-section mb-lg">
            <div
                className={`upload-area ${isDragOver ? 'dragover' : ''}`}
                onDragEnter={handleDragEnter}
                onDragLeave={handleDragLeave}
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={openFileDialog}
            >
                <div className="upload-icon">📁</div>
                <div className="upload-text">
                    Click to select {tool.multiple ? 'files' : 'a file'} or drag and drop here
                </div>
                <div className="upload-hint">
                    Supports: {acceptedFormats.join(', ')}
                </div>

                {tool.multiple && (
                    <div className="upload-hint mt-sm">
                        You can select multiple files at once
                    </div>
                )}
            </div>

            <input
                ref={ref}
                type="file"
                accept={tool.accept}
                multiple={tool.multiple}
                onChange={handleFileSelect}
                style={{ display: 'none' }}
            />

            <div className="upload-info mt-md text-center">
                <small style={{ color: 'var(--text-muted)' }}>
                    Maximum recommended file size: 50MB per file
                    <br />
                    All processing happens in your browser - files never leave your device
                </small>
            </div>
        </div>
    );
});

FileUpload.displayName = 'FileUpload';

export default FileUpload;