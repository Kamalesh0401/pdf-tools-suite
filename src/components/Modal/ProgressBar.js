import React from 'react';

const ProgressBar = ({ percentage, text }) => {
    return (
        <div className="progress-container mb-lg">
            <div className="progress-bar">
                <div
                    className="progress-fill"
                    style={{ width: `${Math.max(0, Math.min(100, percentage))}%` }}
                />
            </div>
            <div className="progress-text">
                {text || `Processing... ${Math.round(percentage)}%`}
            </div>
        </div>
    );
};

export default ProgressBar;