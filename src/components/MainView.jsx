// MainView.jsx
import React, { useEffect, useRef } from 'react';
import ControlPanel from './ControlPanel';
import CanvasManager from '../Utils/CanvasManager.js';
import '../styles/MainView.css';

const MainView = ({
    layerConfigs,
    onLayerConfigChange,
    isConnected,
    isTokenHolder,
    onSaveConfig,
    isSaving,
    blendModes
}) => {
    const canvasRefs = {
        1: useRef(null),
        2: useRef(null)
    };
    
    const managerRefs = useRef({});
    const resizeTimeoutRef = useRef(null);

    // Initial setup
    useEffect(() => {
        // Initialize canvas managers
        Object.keys(canvasRefs).forEach(layerId => {
            const canvas = canvasRefs[layerId].current;
            if (!canvas) return;
            
            managerRefs.current[layerId] = new CanvasManager(canvas, layerId);
            managerRefs.current[layerId].setImage(`/assets/layer${layerId}.webp`);
        });

        // Handle resize
        const handleResize = () => {
            if (resizeTimeoutRef.current) {
                window.cancelAnimationFrame(resizeTimeoutRef.current);
            }
            
            resizeTimeoutRef.current = window.requestAnimationFrame(() => {
                Object.values(managerRefs.current).forEach(manager => {
                    if (manager) {
                        manager.resize();
                    }
                });
            });
        };

        window.addEventListener('resize', handleResize, { passive: true });

        // Start animations
        Object.keys(layerConfigs).forEach(layerId => {
            const manager = managerRefs.current[layerId];
            if (manager) {
                manager.animate(layerConfigs[layerId]);
            }
        });

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            if (resizeTimeoutRef.current) {
                window.cancelAnimationFrame(resizeTimeoutRef.current);
            }
            Object.values(managerRefs.current).forEach(manager => {
                if (manager) {
                    manager.stop();
                }
            });
            managerRefs.current = {};
        };
    }, []);

    // Update animations when configs change
    useEffect(() => {
        Object.keys(layerConfigs).forEach(layerId => {
            const manager = managerRefs.current[layerId];
            if (manager) {
                manager.stop();
                manager.animate(layerConfigs[layerId]);
            }
        });
    }, [layerConfigs]);

    return (
        <div className="main-view">
            <div id="canvas-container">
                <div className="grid-overlay"></div>
                {[1, 2].map(layerId => (
                    <canvas
                        key={layerId}
                        ref={canvasRefs[layerId]}
                        className="canvas"
                        style={{
                            zIndex: layerId,
                            mixBlendMode: layerConfigs[layerId].blendMode
                        }}
                    />
                ))}
                <img src="/assets/entity.webp" alt="Entity" className="entity-logo" />
            </div>

            <ControlPanel
                layerConfigs={layerConfigs}
                onLayerConfigChange={onLayerConfigChange}
                isConnected={isConnected}
                isTokenHolder={isTokenHolder}
                onSaveConfig={onSaveConfig}
                isSaving={isSaving}
                blendModes={blendModes}
            />
        </div>
    );
};

export default MainView;