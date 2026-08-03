import React from 'react';
import { User, Sparkles } from 'lucide-react';
import type { Role } from '../types';

interface CenterPanelProps {
    myRole: Role;
    onRoleChange: (role: Role) => void;
    rolesList: { key: Role; label: string }[];
    onConsultAI: () => void;
    onConsultGamePlan: () => void;
    loading: boolean;
    analysisMode: 'DRAFT' | 'GAME_PLAN';
}

export const CenterPanel: React.FC<CenterPanelProps> = ({
    myRole,
    onRoleChange,
    rolesList,
    onConsultAI,
    onConsultGamePlan,
    loading,
    analysisMode,
}) => {
    return (
        <div className="center-panel">
            <h2><User size={20} /> Tu Rol</h2>
            <p>Selecciona tu línea:</p>
            <div className="role-selector">
                {rolesList.map(({ key, label }) => (
                    <button
                        key={key}
                        className={`role-btn ${myRole === key ? 'active' : ''}`}
                        onClick={() => onRoleChange(key)}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* BOTONES DE CONSULTA IA */}

            {/* migrar css del archivo App.css al archivo CenterPanel.css*/}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginTop: '15px' }}>
                <button
                    className="btn-consult"
                    onClick={onConsultAI}
                    disabled={loading}
                >
                    <Sparkles size={18} />
                    {loading && analysisMode === 'DRAFT'
                        ? ' Analizando Draft...'
                        : ' Consultar Mejor Campeón'}
                </button>

                <button
                    className="btn-consult"
                    onClick={onConsultGamePlan}
                    disabled={loading}
                    style={{ backgroundColor: '#10b981', borderColor: '#059669' }}
                >
                    <Sparkles size={18} />
                    {loading && analysisMode === 'GAME_PLAN'
                        ? ' Analizando Estrategia...'
                        : ' Plantear Partida (Game Plan)'}
                </button>
            </div>
        </div>
    );
};
