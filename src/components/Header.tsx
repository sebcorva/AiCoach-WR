import React from 'react';
import patchData from '../data/patchNotes.json';

const currentPatch = patchData[0];

export const Header: React.FC = () => {
    return (
        <header className="header">
            <h1>Wild Rift - Consultor de Pick</h1>
            <p>Análisis de composición e Inteligencia Artificial basada en el Parche {currentPatch.version}</p>
        </header>
    );
};
