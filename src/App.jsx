// App.jsx
import React, { useState, useEffect } from 'react';
import { createClientUPProvider } from '@lukso/up-provider';
import { ERC725 } from '@erc725/erc725.js';
import { ethers } from 'ethers';
import MainView from './components/MainView';
import './styles/App.css';

// Initialize provider
const provider = createClientUPProvider();

// Constants
const RPC_URL = 'https://rpc.mainnet.lukso.network';
const TOKEN_ADDRESS = '0xF3359BEf0f5F563714b3e1c2294BEb38F66E976b';

const BLEND_MODES = [
    "normal", "multiply", "screen", "overlay", "darken", 
    "lighten", "color-dodge", "color-burn", "hard-light", 
    "soft-light", "difference", "exclusion", "hue", 
    "saturation", "color", "luminosity"
];

const DEFAULT_LAYER_CONFIG = {
    speed: 0.02,
    size: 0.3,
    xaxis: 1000,
    yaxis: 1000,
    drift: 0,
    driftSpeed: 0.1,
    direction: 1,
    angle: 0,
    blendMode: 'normal',
    driftState: {
        x: 0,
        y: 0,
        startTime: Date.now(),
        enabled: false
    }
};

// Schema for ERC725Y data
const CONFIG_KEY = 'LayerConfigurations';
const schema = [{
    name: CONFIG_KEY,
    key: ethers.keccak256(ethers.toUtf8Bytes(CONFIG_KEY)),
    keyType: 'Singleton',
    valueType: 'string',
    valueContent: 'String'
}];

function App() {
    const [isConnected, setIsConnected] = useState(false);
    const [isTokenHolder, setIsTokenHolder] = useState(false);
    const [layerConfigs, setLayerConfigs] = useState({
        1: { ...DEFAULT_LAYER_CONFIG },
        2: { ...DEFAULT_LAYER_CONFIG }
    });
    const [contextConfigurations, setContextConfigurations] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Check token ownership using ERC725
    const checkTokenOwnership = async (address) => {
        try {
            console.log("Checking token ownership for address:", address);
            
            const abi = [
                "function balanceOf(address tokenOwner) view returns (uint256)"
            ];

            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const tokenContract = new ethers.Contract(TOKEN_ADDRESS, abi, provider);
            
            const balance = await tokenContract.balanceOf(address);
            const hasToken = balance > BigInt(0);
            
            console.log("Token balance:", balance.toString());
            console.log("Has token:", hasToken);
            
            return hasToken;
        } catch (error) {
            console.error('Error checking token ownership:', error);
            return false;
        }
    };

    // Load configurations from UP metadata
    const loadConfigurations = async (address) => {
        try {
            console.log('Loading configurations for address:', address);
            
            const abi = [
                "function getData(bytes32 key) view returns (bytes memory)"
            ];
            
            const provider = new ethers.JsonRpcProvider(RPC_URL);
            const upContract = new ethers.Contract(address, abi, provider);
            
            const key = ethers.keccak256(ethers.toUtf8Bytes(CONFIG_KEY));
            const data = await upContract.getData(key);
            
            if (data && data !== '0x') {
                try {
                    const decodedString = ethers.toUtf8String(data);
                    const parsedValue = JSON.parse(decodedString);
                    
                    console.log('Loaded configuration:', parsedValue);
                    
                    return {
                        1: {
                            ...DEFAULT_LAYER_CONFIG,
                            ...parsedValue.layer1
                        },
                        2: {
                            ...DEFAULT_LAYER_CONFIG,
                            ...parsedValue.layer2
                        }
                    };
                } catch (decodeError) {
                    console.error('Error decoding configuration:', decodeError);
                }
            }
            return null;
        } catch (error) {
            console.error('Error loading configurations:', error);
            return null;
        }
    };

    // Save configurations to UP metadata
    const saveConfigurations = async () => {
        if (!isConnected || !isTokenHolder) return;

        try {
            setIsSaving(true);
            console.log('Starting save process...');

            const configData = {
                layer1: layerConfigs[1],
                layer2: layerConfigs[2]
            };

            const erc725 = new ERC725(
                schema,
                provider.accounts[0],
                new ethers.BrowserProvider(provider),
                {
                    ipfsGateway: 'https://api.universalprofile.cloud/ipfs'
                }
            );

            const encodedData = erc725.encodeData([{
                keyName: CONFIG_KEY,
                value: JSON.stringify(configData)
            }]);

            // Get the UP contract and Key Manager contract
            const upContract = new ethers.Contract(
                provider.accounts[0],
                [
                    "function execute(uint256 operationType, address to, uint256 value, bytes memory data) external returns (bytes memory)",
                    "function setData(bytes32 key, bytes value) external",
                    "function owner() external view returns (address)"
                ],
                await new ethers.BrowserProvider(provider).getSigner()
            );

            console.log('Preparing transaction data...');
            const setDataPayload = upContract.interface.encodeFunctionData(
                "setData",
                [encodedData.keys[0], encodedData.values[0]]
            );

            console.log('Sending transaction...');
            const tx = await upContract.execute(
                1, // OPERATION_CALL
                provider.accounts[0], // target is the UP itself
                0, // no value transfer
                setDataPayload
            );
            console.log('Transaction sent:', tx.hash);
            
            await tx.wait();
            console.log('Configuration saved successfully!');
        } catch (error) {
            console.error('Error saving configurations:', error);
        } finally {
            setIsSaving(false);
        }
    };

    // Handler for layer configuration changes
    const handleLayerConfigChange = (layerId, name, value) => {
        setLayerConfigs(prev => ({
            ...prev,
            [layerId]: {
                ...prev[layerId],
                [name]: value
            }
        }));
    };

    // Handle UP provider account changes
    const handleAccountsChanged = async (accounts) => {
        const connected = accounts.length > 0;
        setIsConnected(connected);
        
        if (connected) {
            const hasToken = await checkTokenOwnership(accounts[0]);
            setIsTokenHolder(hasToken);
            
            if (hasToken) {
                const configs = await loadConfigurations(accounts[0]);
                if (configs) {
                    setLayerConfigs(configs);
                }
            }
        } else {
            setIsTokenHolder(false);
        }
    };

    // Handle context account changes
    const handleContextAccountsChanged = async (contextAccounts) => {
        if (contextAccounts.length > 0) {
            const configs = await loadConfigurations(contextAccounts[0]);
            setContextConfigurations(configs);
            
            if (
                contextAccounts[0] !== provider.accounts[0] && 
                configs && 
                !isTokenHolder
            ) {
                setLayerConfigs(configs);
            }
        } else {
            setContextConfigurations(null);
        }
    };

    // Initial setup
    useEffect(() => {
        const initializeProvider = async () => {
            try {
                const accounts = provider.accounts;
                const contextAccounts = provider.contextAccounts;
                
                if (accounts.length > 0) {
                    const hasToken = await checkTokenOwnership(accounts[0]);
                    setIsTokenHolder(hasToken);
                    setIsConnected(true);

                    if (hasToken) {
                        const configs = await loadConfigurations(accounts[0]);
                        if (configs) {
                            setLayerConfigs(configs);
                        }
                    }
                }

                if (contextAccounts.length > 0) {
                    await handleContextAccountsChanged(contextAccounts);
                }
            } catch (error) {
                console.error('Failed to initialize provider:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeProvider();

        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('contextAccountsChanged', handleContextAccountsChanged);

        return () => {
            provider.removeListener('accountsChanged', handleAccountsChanged);
            provider.removeListener('contextAccountsChanged', handleContextAccountsChanged);
        };
    }, []);

    // Load initial config if needed
    useEffect(() => {
        const loadInitialConfig = async () => {
            try {
                const response = await fetch('/src/JSON/config.json');
                const initialConfig = await response.json();
                if (!contextConfigurations && !isTokenHolder) {
                    setLayerConfigs(initialConfig.layers);
                }
            } catch (error) {
                console.error('Failed to load initial config:', error);
            }
        };

        loadInitialConfig();
    }, [contextConfigurations, isTokenHolder]);

    if (isLoading) {
        return <div className="app">Loading...</div>;
    }

    return (
        <div className="app">
            <div className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
                {isConnected ? (
                    isTokenHolder ? (
                        <span className="connected">Connected with Token Access</span>
                    ) : (
                        <span className="connected">Connected to Universal Profile</span>
                    )
                ) : (
                    <span className="disconnected">Not connected to Universal Profile</span>
                )}
            </div>
            
            <MainView
                layerConfigs={layerConfigs}
                onLayerConfigChange={handleLayerConfigChange}
                isConnected={isConnected}
                isTokenHolder={isTokenHolder}
                onSaveConfig={saveConfigurations}
                isSaving={isSaving}
                blendModes={BLEND_MODES}
            />
        </div>
    );
}

export default App;
