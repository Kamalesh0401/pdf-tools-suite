import React from 'react';

const ToolOptions = ({ toolId, options, onChange, hasFiles }) => {
    const updateOption = (key, value) => {
        onChange(prev => ({
            ...prev,
            [key]: value
        }));
    };

    if (!hasFiles) return null;

    const renderSplitOptions = () => (
        <div className="tool-options mb-lg">
            <h4 className="mb-md">Split Options</h4>
            <div className="option-group">
                <label className="option-label">
                    <input
                        type="radio"
                        name="splitType"
                        value="pages"
                        checked={options.splitType !== 'range'}
                        onChange={(e) => updateOption('splitType', 'pages')}
                    />
                    <span className="ml-sm">Split into individual pages</span>
                </label>
            </div>

            <div className="option-group">
                <label className="option-label">
                    <input
                        type="radio"
                        name="splitType"
                        value="range"
                        checked={options.splitType === 'range'}
                        onChange={(e) => updateOption('splitType', 'range')}
                    />
                    <span className="ml-sm">Extract page range</span>
                </label>

                {options.splitType === 'range' && (
                    <div className="range-inputs mt-sm">
                        <div className="d-flex gap-md align-center">
                            <div>
                                <label htmlFor="fromPage">From page:</label>
                                <input
                                    id="fromPage"
                                    type="number"
                                    min="1"
                                    value={options.fromPage || 1}
                                    onChange={(e) => updateOption('fromPage', parseInt(e.target.value) || 1)}
                                    className="ml-sm"
                                    style={{ width: '80px' }}
                                />
                            </div>
                            <div>
                                <label htmlFor="toPage">To page:</label>
                                <input
                                    id="toPage"
                                    type="number"
                                    min="1"
                                    value={options.toPage || 1}
                                    onChange={(e) => updateOption('toPage', parseInt(e.target.value) || 1)}
                                    className="ml-sm"
                                    style={{ width: '80px' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    const renderImageOptions = () => (
        <div className="tool-options mb-lg">
            <h4 className="mb-md">Image Options</h4>

            <div className="option-group mb-md">
                <label htmlFor="imageFormat">Output Format:</label>
                <select
                    id="imageFormat"
                    value={options.imageFormat || 'png'}
                    onChange={(e) => updateOption('imageFormat', e.target.value)}
                    className="ml-sm"
                >
                    <option value="png">PNG (Higher quality)</option>
                    <option value="jpeg">JPEG (Smaller size)</option>
                </select>
            </div>

            <div className="option-group">
                <label htmlFor="imageQuality">Quality:</label>
                <div className="d-flex align-center gap-md">
                    <input
                        id="imageQuality"
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.1"
                        value={options.imageQuality || 0.9}
                        onChange={(e) => updateOption('imageQuality', parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span className="quality-value">
                        {Math.round((options.imageQuality || 0.9) * 100)}%
                    </span>
                </div>
            </div>

            <div className="option-group mt-md">
                <label htmlFor="imageScale">Resolution Scale:</label>
                <div className="d-flex align-center gap-md">
                    <input
                        id="imageScale"
                        type="range"
                        min="1"
                        max="3"
                        step="0.5"
                        value={options.imageScale || 2}
                        onChange={(e) => updateOption('imageScale', parseFloat(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span className="scale-value">
                        {options.imageScale || 2}x
                    </span>
                </div>
            </div>
        </div>
    );

    const renderCompressionOptions = () => (
        <div className="tool-options mb-lg">
            <h4 className="mb-md">Compression Options</h4>

            <div className="option-group">
                <label htmlFor="compressionLevel">Compression Level:</label>
                <div className="d-flex align-center gap-md">
                    <input
                        id="compressionLevel"
                        type="range"
                        min="1"
                        max="3"
                        step="1"
                        value={options.compressionLevel || 2}
                        onChange={(e) => updateOption('compressionLevel', parseInt(e.target.value))}
                        style={{ flex: 1 }}
                    />
                    <span className="compression-value">
                        {['Low', 'Medium', 'High'][options.compressionLevel - 1] || 'Medium'}
                    </span>
                </div>
                <small className="text-muted mt-sm d-block">
                    Higher compression = smaller file size but may reduce quality
                </small>
            </div>
        </div>
    );

    const renderWordToPdfOptions = () => (
        <div className="tool-options mb-lg">
            <h4 className="mb-md">PDF Options</h4>

            <div className="option-group mb-md">
                <label htmlFor="pageSize">Page Size:</label>
                <select
                    id="pageSize"
                    value={options.pageSize || 'A4'}
                    onChange={(e) => updateOption('pageSize', e.target.value)}
                    className="ml-sm"
                >
                    <option value="A4">A4</option>
                    <option value="A3">A3</option>
                    <option value="A5">A5</option>
                    <option value="Letter">Letter</option>
                    <option value="Legal">Legal</option>
                </select>
            </div>

            <div className="option-group">
                <label htmlFor="margin">Margins:</label>
                <select
                    id="margin"
                    value={options.margin || 'normal'}
                    onChange={(e) => updateOption('margin', e.target.value)}
                    className="ml-sm"
                >
                    <option value="narrow">Narrow</option>
                    <option value="normal">Normal</option>
                    <option value="wide">Wide</option>
                </select>
            </div>
        </div>
    );

    switch (toolId) {
        case 'split-pdf':
            return renderSplitOptions();
        case 'pdf-to-images':
            return renderImageOptions();
        case 'compress-pdf':
            return renderCompressionOptions();
        case 'word-to-pdf':
            return renderWordToPdfOptions();
        default:
            return null;
    }
};

export default ToolOptions;