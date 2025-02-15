import React, { useState, useRef } from 'react';
import '../styles/ControlPanel.css';

const ControlPanel = ({
    layerConfigs,
    onLayerConfigChange,
    isConnected,
    isTokenHolder,
    onSaveConfig,
    isSaving,
    blendModes
}) => {
    const [activeTab, setActiveTab] = useState('layer1');
    const [isMinimized, setIsMinimized] = useState(true);
    const [dragState, setDragState] = useState({
        isDragging: false,
        currentX: 20,
        currentY: 20,
        initialX: 0,
        initialY:    0,
        xOffset: 20,
        yOffset: 20
    });
    
    const panelRef = useRef(null);
    const headerRef = useRef(null);

    const handleDragStart = (e) => {
        if (e.target === headerRef.current || headerRef.current.contains(e.target)) {
            setDragState(prev => ({
                ...prev,
                isDragging: true,
                initialX: e.clientX - prev.xOffset,
                initialY: e.clientY - prev.yOffset
            }));
        }
    };

    const handleDrag = (e) => {
        if (dragState.isDragging) {
            e.preventDefault();
            const currentX = e.clientX - dragState.initialX;
            const currentY = e.clientY - dragState.initialY;

            setDragState(prev => ({
                ...prev,
                currentX,
                currentY,
                xOffset: currentX,
                yOffset: currentY
            }));

            if (panelRef.current) {
                panelRef.current.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }
    };

    const handleDragEnd = () => {
        setDragState(prev => ({
            ...prev,
            isDragging: false,
            initialX: prev.currentX,
            initialY: prev.currentY
        }));
    };

    const handleSliderChange = (e) => {
        const { name, value } = e.target;
        const layerId = activeTab === 'layer1' ? 1 : 2;
        onLayerConfigChange(layerId, name, parseFloat(value));
    };

    const renderLayerControls = (layerId) => {
        const config = layerConfigs[layerId];
        return (
            <div className="controls-container">
                <div className="slider-group">
                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">SPEED</span>
                            <span className="slider-value">
                                {Number(config.speed).toFixed(3)}
                            </span>
                        </div>
                        <input
                            type="range"
                            name="speed"
                            min="0"
                            max="0.5"
                            step="0.005"
                            value={config.speed}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">SIZE</span>
                            <span className="slider-value">
                                {Number(config.size).toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            name="size"
                            min="0.3"
                            max="2.0"
                            step="0.1"
                            value={config.size}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">X AXIS</span>
                            <span className="slider-value">
                                {Number(config.xaxis).toFixed(0)}
                            </span>
                        </div>
                        <input
                            type="range"
                            name="xaxis"
                            min="10"
                            max="3000"
                            step="10"
                            value={config.xaxis}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">Y AXIS</span>
                            <span className="slider-value">
                                {Number(config.yaxis).toFixed(0)}
                            </span>
                        </div>
                        <input
                            type="range"
                            name="yaxis"
                            min="10"
                            max="3000"
                            step="10"
                            value={config.yaxis}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">DRIFT</span>
                            <span className="slider-value">
                                {Number(config.drift).toFixed(1)}
                            </span>
                        </div>
                        <input
                            type="range"
                            name="drift"
                            min="0"
                            max="1"
                            step="0.1"
                            value={config.drift}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">DRIFT SPEED</span>
                            <span className="slider-value">
                                {Number(config.driftSpeed).toFixed(2)}
                            </span>
                        </div>
                        <input
                            type="range"
                            name="driftSpeed"
                            min="0.1"
                            max="2.0"
                            step="0.1"
                            value={config.driftSpeed}
                            onChange={handleSliderChange}
                        />
                    </div>

                    <div className="slider-container">
                        <div className="slider-header">
                            <span className="slider-label">BLEND MODE</span>
                        </div>
                        <select 
                            className="blend-mode-select"
                            name="blendMode"
                            value={config.blendMode}
                            onChange={(e) => onLayerConfigChange(layerId, 'blendMode', e.target.value)}
                        >
                            {blendModes.map(mode => (
                                <option key={mode} value={mode}>
                                    {mode.split('-').map(word => 
                                        word.charAt(0).toUpperCase() + word.slice(1)
                                    ).join(' ')}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="direction-control">
                        <button 
                            className="direction-button"
                            onClick={() => onLayerConfigChange(layerId, 'direction', -config.direction)}
                        >
                            ⟳ Change Direction
                        </button>
                    </div>

                    {isTokenHolder && (
                        <div className="save-configuration">
                            <button 
                                className={`save-button ${isSaving ? 'saving' : ''}`}
                                onClick={onSaveConfig}
                                disabled={isSaving || !isConnected}
                            >
                                {isSaving ? 'Saving...' : 'Save to Profile'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div 
            ref={panelRef}
            className={`control-panel ${isMinimized ? 'minimized' : ''}`}
            onMouseDown={handleDragStart}
            onMouseMove={handleDrag}
            onMouseUp={handleDragEnd}
            onMouseLeave={handleDragEnd}
            style={{
                transform: `translate(${dragState.xOffset}px, ${dragState.yOffset}px)`
            }}
        >
            <div ref={headerRef} className="panel-header">
                <span>Controls</span>
                <button 
                    className="minimize-button"
                    onClick={() => setIsMinimized(!isMinimized)}
                >
                    {isMinimized ? '○' : '−'}
                </button>
            </div>

            <div className={`panel-content ${isMinimized ? 'hidden' : ''}`}>
                <div className="tab-navigation">
                    <button 
                        className={`tab-button ${activeTab === 'layer1' ? 'active' : ''}`}
                        onClick={() => setActiveTab('layer1')}
                    >
                        Layer 1
                    </button>
                    <button 
                        className={`tab-button ${activeTab === 'layer2' ? 'active' : ''}`}
                        onClick={() => setActiveTab('layer2')}
                    >
                        Layer 2
                    </button>
                </div>

                {activeTab === 'layer1' && renderLayerControls(1)}
                {activeTab === 'layer2' && renderLayerControls(2)}

                {!isConnected ? (
                    <div className="connection-prompt">
                        Connect your Universal Profile to save settings
                    </div>
                ) : !isTokenHolder ? (
                    <div className="connection-prompt token-warning">
                        Token required to save settings
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default ControlPanel;