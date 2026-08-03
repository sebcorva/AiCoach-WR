import React from 'react';
import { Shield, Sword } from 'lucide-react';
import type { Role, Champion } from '../types';

interface TeamPanelProps {
    team: 'ally' | 'enemy';
    teamDraft: Record<Role, Champion | null>;
    rolesList: { key: Role; label: string }[];
    onSelectSlot: (team: 'ally' | 'enemy', role: Role) => void;
    onClearSlot: (team: 'ally' | 'enemy', role: Role) => void;
}

export const TeamPanel: React.FC<TeamPanelProps> = ({
    team,
    teamDraft,
    rolesList,
    onSelectSlot,
    onClearSlot,
}) => {
    const isAlly = team === 'ally';

    return (
        <div className={`team-panel ${team}`}>
            <h2>
                {isAlly ? <Shield size={20} /> : <Sword size={20} />}
                {isAlly ? ' Equipo Aliado' : ' Equipo Enemigo'}
            </h2>
            {rolesList.map(({ key, label }) => {
                const champ = teamDraft[key];

                return (
                    <div key={key} className="slot">
                        <span className="slot-label">{label}</span>
                        {champ ? (
                            <div className="selected-champ" onClick={() => onClearSlot(team, key)}>
                                <img src={champ.iconUrl} alt={champ.name} />
                                <span>{champ.name}</span>
                            </div>
                        ) : (
                            <button
                                className="btn-select"
                                onClick={() => onSelectSlot(team, key)}
                            >
                                + Elegir
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
