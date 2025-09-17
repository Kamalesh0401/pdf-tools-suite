import React from 'react';
import JSZip from 'jszip';

const Results = ({ results }) => {
    const downloadFile = (index) => {
        const result = results[index];
        const url = URL.createObjectURL(result.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadAllAsZip = async () => {
        const zip = new JSZip();

        results.forEach(result => {
            zip.file(result.name, result.blob);
        });

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const url = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'processed-files.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="results mb-lg">
            <h3 className="mb-md">
                Processing Complete! ({results.length} file{results.length !== 1 ? 's' : ''})
            </h3>

            {results.map((result, index) => (
                <div key={index} className="result-item">
                    <div className="result-info">
                        <div className="result-name">{result.name}</div>
                        <div className="result-details">
                            {formatFileSize(result.size)}
                            {result.info && ` • ${result.info}`}
                        </div>
                    </div>
                    <button
                        className="download-btn"
                        onClick={() => downloadFile(index)}
                    >
                        📥 Download
                    </button>
                </div>
            ))}

            {results.length > 1 && (
                <div className="mt-md text-center">
                    <button
                        className="btn btn-secondary"
                        onClick={downloadAllAsZip}
                    >
                        📦 Download All as ZIP
                    </button>
                </div>
            )}
        </div>
    );
};

export default Results;