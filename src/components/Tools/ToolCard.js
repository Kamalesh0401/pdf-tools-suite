import React from 'react';

const ToolCard = ({ tool, onOpenTool, animationDelay }) => {
    return (
        <div
            className="tool-card animate-fade-in-up"
            style={{ animationDelay: `${animationDelay}s` }}
        >
            <div className="tool-icon">
                {tool.icon}
            </div>
            <h3 className="tool-title">{tool.title}</h3>
            <p className="tool-description">{tool.description}</p>
            <button
                className="btn"
                onClick={() => onOpenTool(tool.id)}
            >
                {tool.buttonText}
            </button>
        </div>
    );
};

export default ToolCard;