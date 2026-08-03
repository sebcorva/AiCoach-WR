import React from 'react';
import { CHAMPIONS } from '../data/champions.ts';
import type { Champion, Role } from '../types';

interface ChampionSelectorModalProps {
    activeSelector: { team: 'ally' | 'enemy'; role: Role };
    favoriteChamps: string[];
    onToggleFavorite: (champId: string) => void;
    onSelectChampion: (champion: Champion) => void;
    onClose: () => void;
}

export const ChampionSelectorModal: React.FC<ChampionSelectorModalProps> = ({
    activeSelector,
    favoriteChamps,
    onToggleFavorite,
    onSelectChampion,
    onClose,
}) => {
    return (
        // migrar css 
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h3>
                    Selecciona Campeón para {activeSelector.team === 'ally' ? 'Aliado' : 'Enemigo'} ({activeSelector.role.toUpperCase()})
                </h3>

                <div className="champions-list">
                    {CHAMPIONS
                        .filter((champ) => champ.roles.includes(activeSelector.role))
                        .map((champ) => {
                            const isFav = favoriteChamps.includes(champ.id);

                            return (
                                <div
                                    key={champ.id}
                                    className={`champ-card ${isFav ? 'is-favorite' : ''}`}
                                    onClick={() => onSelectChampion(champ)}
                                    style={{ position: 'relative' }}
                                >

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onToggleFavorite(champ.id);
                                        }}
                                        title={isFav ? "Quitar de mis mains" : "Marcar como mi main"}
                                        style={{
                                            position: 'absolute',
                                            top: '4px',
                                            right: '4px',
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            color: isFav ? '#f59e0b' : '#94a3b8',
                                            fontSize: '14px',
                                            cursor: 'pointer',
                                            width: '24px',
                                            height: '24px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 2,
                                        }}
                                    >
                                        {isFav ? '★' : '☆'}
                                    </button>

                                    <img src={champ.iconUrl} alt={champ.name} />
                                    <span>{champ.name}</span>
                                </div>
                            );
                        })
                    }
                </div>
                <button className="btn-close" onClick={onClose}>Cerrar</button>
            </div>
        </div>
    );
};
