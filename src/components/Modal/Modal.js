import React, { useEffect, useRef } from 'react';
import ToolInterface from './ToolInterface';
import { toolConfigurations } from '../../utils/toolConfigurations';

const Modal = ({ toolId, onClose }) => {
    const modalRef = useRef(null);
    const tool = toolConfigurations[toolId];

    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e) => {
            if (modalRef.current && !modalRef.current.contains(e.target)) {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        document.addEventListener('mousedown', handleClickOutside);

        // Add active class after a brief delay for animation
        setTimeout(() => {
            const overlay = document.querySelector('.modal-overlay');
            if (overlay) {
                overlay.classList.add('active');
            }
        }, 10);

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    if (!tool) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-content" ref={modalRef}>
                <div className="modal-header">
                    <h2 className="modal-title">{tool.title}</h2>
                    <button
                        className="close-btn"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ×
                    </button>
                </div>

                <ToolInterface toolId={toolId} tool={tool} />
            </div>
        </div>
    );
};

export default Modal;