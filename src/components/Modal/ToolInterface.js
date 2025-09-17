import React, { useState, useRef } from 'react';
import FileUpload from './FileUpload';
import ProgressBar from './ProgressBar';
import Results from './Results';
import ToolOptions from './ToolOptions';
import { processFiles } from '../../utils/fileProcessors';

const ToolInterface = ({ toolId, tool }) => {
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ percentage: 0, text: '' });
    const [results, setResults] = useState([]);
    const [toolOptions, setToolOptions] = useState({});
    const fileInputRef = useRef(null);

    const handleFilesUploaded = (files) => {
        const validFiles = files.filter(file => {
            const extension = '.' + file.name.split('.').pop().toLowerCase();
            return tool.accept.includes(extension);
        });

        if (validFiles.length !== files.length) {
            alert('Some files have invalid formats. Please check the supported formats.');
        }

        setUploadedFiles(validFiles);
        setResults([]); // Clear previous results
    };

    const removeFile = (index) => {
        setUploadedFiles(files => files.filter((_, i) => i !== index));
    };

    const clearFiles = () => {
        setUploadedFiles([]);
        setResults([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const updateProgress = (percentage, text) => {
        setProgress({ percentage, text });
    };

    const handleProcess = async () => {
        if (uploadedFiles.length === 0) return;

        setIsProcessing(true);
        setProgress({ percentage: 0, text: 'Starting...' });

        try {
            const processedResults = await processFiles(
                toolId,
                uploadedFiles,
                toolOptions,
                updateProgress
            );

            setResults(processedResults);
            updateProgress(100, 'Processing complete!');

            setTimeout(() => {
                setProgress({ percentage: 0, text: '' });
            }, 2000);

        } catch (error) {
            console.error('Processing error:', error);
            updateProgress(0, `Error: ${error.message}`);
        } finally {
            setIsProcessing(false);
        }
    };

    const canProcess = uploadedFiles.length > 0 && !isProcessing;

    return (
        <div className="tool-interface">
            <p className="mb-lg text-secondary">{tool.description}</p>

            {/* Tool-specific options */}
            <ToolOptions
                toolId={toolId}
                options={toolOptions}
                onChange={setToolOptions}
                hasFiles={uploadedFiles.length > 0}
            />

            {/* File Upload */}
            <FileUpload
                tool={tool}
                onFilesUploaded={handleFilesUploaded}
                ref={fileInputRef}
            />

            {/* File List */}
            {uploadedFiles.length > 0 && (
                <div className="file-list mb-lg">
                    <div className="d-flex justify-between align-center mb-md">
                        <h4>Selected Files ({uploadedFiles.length})</h4>
                        <button
                            className="btn btn-outline btn-sm"
                            onClick={clearFiles}
                            type="button"
                        >
                            Clear All
                        </button>
                    </div>
                    {uploadedFiles.map((file, index) => (
                        <div key={index} className="file-item">
                            <div className="file-info">
                                <div className="file-name">{file.name}</div>
                                <div className="file-size">{formatFileSize(file.size)}</div>
                            </div>
                            <button
                                className="file-remove"
                                onClick={() => removeFile(index)}
                                type="button"
                            >
                                Remove
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Progress Bar */}
            {isProcessing && (
                <ProgressBar
                    percentage={progress.percentage}
                    text={progress.text}
                />
            )}

            {/* Results */}
            {results.length > 0 && (
                <Results results={results} />
            )}

            {/* Process Button */}
            <div className="mt-lg">
                <button
                    className={`btn ${isProcessing ? 'processing' : ''}`}
                    onClick={handleProcess}
                    disabled={!canProcess}
                >
                    {isProcessing ? (
                        <>
                            <div className="loading-spinner" style={{ width: '20px', height: '20px' }} />
                            Processing...
                        </>
                    ) : (
                        `Process ${tool.multiple ? 'Files' : 'File'}`
                    )}
                </button>
            </div>
        </div>
    );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default ToolInterface;