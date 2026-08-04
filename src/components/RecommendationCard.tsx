import React from 'react';
import { Sparkles } from 'lucide-react';
import { ITEMS_ICONS } from '../data/items';
import type { DraftState, Role } from '../types';

interface RecommendationCardProps {
    recommendation: string;
    analysisMode: 'DRAFT' | 'GAME_PLAN';
    draft?: DraftState;
    myRole?: Role;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
    recommendation,
    analysisMode,
    draft,
    myRole,
}) => {
    const renderTextWithItemIcons = (text: string) => {
        const parseBold = (str: string, baseKey: number | string): React.ReactNode[] => {
            const boldRegex = /\*\*(.*?)\*\*/g;
            const result = [];
            let lastIndex = 0;
            let match;

            while ((match = boldRegex.exec(str)) !== null) {
                if (match.index > lastIndex) {
                    result.push(str.substring(lastIndex, match.index));
                }
                result.push(<strong key={`${baseKey}-bold-${match.index}`}>{match[1]}</strong>);
                lastIndex = boldRegex.lastIndex;
            }

            if (lastIndex < str.length) {
                result.push(str.substring(lastIndex));
            }

            return result;
        };

        const regex = /\[\[(.*?)\]\]/g;
        const parts: React.ReactNode[] = [];
        let lastIndex = 0;
        let match;

        while ((match = regex.exec(text)) !== null) {
            const matchIndex = match.index;
            const itemName = match[1];

            // Añadir el texto previo al match
            if (matchIndex > lastIndex) {
                parts.push(...parseBold(text.substring(lastIndex, matchIndex), `pre-${matchIndex}`));
            }

            // Buscar la imagen en el diccionario
            const normalizedName = itemName.toLowerCase().trim();
            let iconUrl = ITEMS_ICONS[normalizedName];
            
            if (!iconUrl) {
                const matchedKey = Object.keys(ITEMS_ICONS)
                    .sort((a, b) => b.length - a.length)
                    .find(key => normalizedName.includes(key));
                if (matchedKey) {
                    iconUrl = ITEMS_ICONS[matchedKey];
                }
            }

            if (iconUrl) {
                parts.push(
                    <span key={matchIndex} className="inline-item">
                        <img src={iconUrl} alt={itemName} className="inline-item-icon" />
                        <strong>{itemName}</strong>
                    </span>
                );
            } else {
                parts.push(<strong key={matchIndex}>{itemName}</strong>);
            }

            lastIndex = regex.lastIndex;
        }

        if (lastIndex < text.length) {
            parts.push(...parseBold(text.substring(lastIndex), `post-${lastIndex}`));
        }

        return parts;
    };

    // Helper to parse the recommendation text into cards
    const parseDraftRecommendation = (text: string) => {
        const lines = text.split('\n');
        let title = '';
        const champions: Array<{
            emoji: string;
            name: string;
            stars: string;
            summary: string;
            whyChoose: string[];
        }> = [];
        const toAvoid: string[] = [];
        let quickVerdict = '';

        let currentSection: 'header' | 'champions' | 'avoid' | 'verdict' = 'header';
        let currentChamp: typeof champions[0] | null = null;

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check for section transitions
            if (trimmed.includes('🏆 Tus Mejores Opciones') || trimmed.includes('Mejores Opciones')) {
                title = trimmed;
                currentSection = 'champions';
                continue;
            }
            if (trimmed.toLowerCase().includes('a evitar') || trimmed.includes('❌ A Evitar')) {
                if (currentChamp) {
                    champions.push(currentChamp);
                    currentChamp = null;
                }
                currentSection = 'avoid';
                continue;
            }
            if (trimmed.toLowerCase().includes('veredicto') || trimmed.includes('💡 Veredicto Rápido:')) {
                if (currentChamp) {
                    champions.push(currentChamp);
                    currentChamp = null;
                }
                currentSection = 'verdict';
                continue;
            }

            if (currentSection === 'champions') {
                // Regex matches lines like: "1. ⚔️ [Zed] ⭐⭐⭐⭐⭐ (Excellent burst)" or "1. ⚔️ Zed ⭐⭐⭐⭐⭐ (Excellent burst)"
                // Matches optional number/dot/emoji, name optionally inside brackets, stars, summary in parentheses.
                const champMatch = trimmed.match(/^\d+\.\s*([^\w\s\d\[]*)?\s*\[?([^⭐\(\n]+?)\]?\s*(⭐+)\s*\((.+?)\)/);
                if (champMatch) {
                    if (currentChamp) {
                        champions.push(currentChamp);
                    }
                    currentChamp = {
                        emoji: champMatch[1]?.trim() || '',
                        name: champMatch[2].trim(),
                        stars: champMatch[3].trim(),
                        summary: champMatch[4].trim(),
                        whyChoose: []
                    };
                } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    if (currentChamp) {
                        currentChamp.whyChoose.push(trimmed.substring(1).trim());
                    }
                } else if (trimmed.toLowerCase().startsWith('por qué elegirlo') || trimmed.toLowerCase().startsWith('por que elegirlo')) {
                    // Skip section title
                } else {
                    if (currentChamp) {
                        currentChamp.whyChoose.push(trimmed);
                    }
                }
            } else if (currentSection === 'avoid') {
                if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    toAvoid.push(trimmed.substring(1).trim());
                } else if (!trimmed.toLowerCase().includes('a evitar')) {
                    toAvoid.push(trimmed);
                }
            } else if (currentSection === 'verdict') {
                if (!trimmed.toLowerCase().includes('veredicto')) {
                    quickVerdict += (quickVerdict ? '\n' : '') + trimmed;
                }
            }
        }

        if (currentChamp) {
            champions.push(currentChamp);
        }

        return {
            title: title || '🏆 Recomendaciones de Draft',
            champions,
            toAvoid,
            quickVerdict
        };
    };

    // Helper to parse the Game Plan text into structured sections
    const parseGamePlan = (text: string) => {
        const lines = text.split('\n');
        let intro = '';
        const buildItems: Array<{ name: string; desc: string }> = [];
        const earlyGamePoints: string[] = [];
        const teamfightPoints: string[] = [];
        let goldenRule = '';

        let currentSection: 'intro' | 'lanes' | 'build' | 'early' | 'teamfights' | 'golden' = 'intro';

        for (let line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            // Check for section transitions
            if (trimmed.toLowerCase().includes('distribución de líneas') || trimmed.toLowerCase().includes('distribucion de lineas')) {
                currentSection = 'lanes';
                continue;
            }
            if (trimmed.includes('🛠️ Build') || trimmed.toLowerCase().includes('build e ítems') || trimmed.toLowerCase().includes('build e items')) {
                currentSection = 'build';
                continue;
            }
            if (trimmed.includes('🎯 Plan de Juego') || trimmed.includes('1. Early Game')) {
                currentSection = 'early';
                continue;
            }
            if (trimmed.includes('⚔️ Cómo Jugar') || trimmed.toLowerCase().includes('teamfights') || trimmed.includes('Cómo Jugar las Peleas')) {
                currentSection = 'teamfights';
                continue;
            }
            if (trimmed.includes('💡 Regla de Oro') || trimmed.toLowerCase().includes('regla de oro')) {
                currentSection = 'golden';
                continue;
            }

            if (currentSection === 'intro') {
                // Skip the title line "=== PLANTEAMIENTO DE PARTIDA COMPLETA (WILD RIFT) ==="
                if (!trimmed.startsWith('===')) {
                    intro += (intro ? '\n' : '') + trimmed;
                }
            } else if (currentSection === 'lanes') {
                // Ignore raw lines text
            } else if (currentSection === 'build') {
                // Match lines starting with -[Item Name]: or - [Item Name]: or just - Item Name:
                const match = trimmed.match(/^-\s*\[?(.*?)\]?\s*:\s*(.*)/);
                if (match) {
                    buildItems.push({
                        name: match[1].trim(),
                        desc: match[2].trim()
                    });
                } else if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    buildItems.push({
                        name: '',
                        desc: trimmed.substring(1).trim()
                    });
                }
            } else if (currentSection === 'early') {
                if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    earlyGamePoints.push(trimmed.substring(1).trim());
                } else if (!trimmed.includes('Early Game')) {
                    earlyGamePoints.push(trimmed);
                }
            } else if (currentSection === 'teamfights') {
                if (trimmed.startsWith('-') || trimmed.startsWith('•')) {
                    teamfightPoints.push(trimmed.substring(1).trim());
                } else if (!trimmed.includes('Cómo Jugar') && !trimmed.toLowerCase().includes('teamfights')) {
                    teamfightPoints.push(trimmed);
                }
            } else if (currentSection === 'golden') {
                if (!trimmed.toLowerCase().includes('regla de oro')) {
                    goldenRule += (goldenRule ? '\n' : '') + trimmed;
                }
            }
        }

        return {
            intro,
            buildItems,
            earlyGamePoints,
            teamfightPoints,
            goldenRule
        };
    };

    const isDraft = analysisMode === 'DRAFT';
    const isGamePlan = analysisMode === 'GAME_PLAN';

    const parsedDraft = isDraft ? parseDraftRecommendation(recommendation) : null;
    const hasParsedDraft = parsedDraft && parsedDraft.champions.length > 0;

    const parsedPlan = isGamePlan ? parseGamePlan(recommendation) : null;
    // We consider the plan successfully parsed if we have at least build items or game phases
    const hasParsedPlan = parsedPlan && (parsedPlan.buildItems.length > 0 || parsedPlan.earlyGamePoints.length > 0);

    const rolesOrder: Role[] = ['top', 'jungle', 'mid', 'adc', 'support'];
    const roleLabels: Record<Role, string> = {
        top: 'TOP',
        jungle: 'JG',
        mid: 'MID',
        adc: 'ADC',
        support: 'SUP'
    };

    const playerChamp = draft && myRole ? draft.ally[myRole] : null;
    const guideUrl = playerChamp
        ? `https://www.wildriftfire.com/guide/${playerChamp.id.toLowerCase().replace(/_/g, '-')}`
        : null;

    return (
        <div className="recommendation-card">
            <h2>
                <Sparkles color="#38bdf8" />
                {isDraft ? ' Recomendación de Draft' : ' Planteamiento de Partida'}
            </h2>
            
            {isDraft && hasParsedDraft && (
                <div className="recommendation-dashboard">
                    <h3 className="recommendation-title">{parsedDraft.title}</h3>
                    
                    {/* CHAMPIONS GRID (3 COLUMNS ON PC, 1 ON MOBILE) */}
                    <div className="recommendation-champions-grid">
                        {parsedDraft.champions.map((champ, index) => (
                            <div key={index} className="champ-rec-card">
                                <div className="champ-rec-header">
                                    <div className="champ-rec-name-row">
                                        <span className="champ-rec-number">{index + 1}.</span>
                                        {champ.emoji && <span className="champ-rec-emoji">{champ.emoji}</span>}
                                        <span className="champ-rec-name">{champ.name}</span>
                                    </div>
                                    <div className="champ-rec-stars">{champ.stars}</div>
                                    <div className="champ-rec-summary">"{champ.summary}"</div>
                                </div>
                                <div className="champ-rec-body">
                                    <h4>Por qué elegirlo:</h4>
                                    <ul>
                                        {champ.whyChoose.map((point, idx) => (
                                            <li key={idx}>{renderTextWithItemIcons(point)}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* A EVITAR (FULL WIDTH) */}
                    {parsedDraft.toAvoid.length > 0 && (
                        <div className="recommendation-avoid-box">
                            <h3>❌ Campeones a Evitar</h3>
                            <ul>
                                {parsedDraft.toAvoid.map((item, idx) => (
                                    <li key={idx}>{renderTextWithItemIcons(item)}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* VEREDICTO RAPIDO (FULL WIDTH) */}
                    {parsedDraft.quickVerdict && (
                        <div className="recommendation-verdict-box">
                            <h3>💡 Veredicto Rápido</h3>
                            <p>{renderTextWithItemIcons(parsedDraft.quickVerdict)}</p>
                        </div>
                    )}
                </div>
            )}

            {isGamePlan && hasParsedPlan && (
                <div className="game-plan-dashboard">
                    {/* INTRO (FULL WIDTH) */}
                    {parsedPlan.intro && (
                        <div className="game-plan-intro-box">
                            <p>{renderTextWithItemIcons(parsedPlan.intro)}</p>
                        </div>
                    )}

                    {/* DRAFT LANES / IMAGES (2 COLUMNS IN DESKTOP, 1 IN MOBILE) */}
                    {draft && (
                        <div className="game-plan-teams-grid">
                            {/* ALLY TEAM CARD */}
                            <div className="team-icons-card ally-team">
                                <h3>Equipo Aliado</h3>
                                <div className="team-icons-row">
                                    {rolesOrder.map((role) => {
                                        const champ = draft.ally[role];
                                        return (
                                            <div key={`ally-${role}`} className="champ-icon-role-item">
                                                <span className="role-abbr-badge ally">{roleLabels[role]}</span>
                                                {champ ? (
                                                    <img src={champ.iconUrl} alt={champ.name} title={champ.name} className="champ-icon-img" />
                                                ) : (
                                                    <div className="champ-icon-placeholder">?</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ENEMY TEAM CARD */}
                            <div className="team-icons-card enemy-team">
                                <h3>Equipo Enemigo</h3>
                                <div className="team-icons-row">
                                    {rolesOrder.map((role) => {
                                        const champ = draft.enemy[role];
                                        return (
                                            <div key={`enemy-${role}`} className="champ-icon-role-item">
                                                <span className="role-abbr-badge enemy">{roleLabels[role]}</span>
                                                {champ ? (
                                                    <img src={champ.iconUrl} alt={champ.name} title={champ.name} className="champ-icon-img" />
                                                ) : (
                                                    <div className="champ-icon-placeholder">?</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BUILD SECTION (FULL WIDTH) */}
                    {parsedPlan.buildItems.length > 0 && (
                        <div className="game-plan-build-card">
                            <h3>🛠️ Build e Ítems Clave</h3>
                            <div className="build-items-list">
                                {parsedPlan.buildItems.map((item, idx) => {
                                    const cleanName = item.name.replace(/\*\*|\[|\]/g, '').trim();
                                    const normalizedName = cleanName.toLowerCase().trim();
                                    let iconUrl = ITEMS_ICONS[normalizedName];
                                    
                                    if (!iconUrl) {
                                        const matchedKey = Object.keys(ITEMS_ICONS)
                                            .sort((a, b) => b.length - a.length)
                                            .find(key => normalizedName.includes(key));
                                        if (matchedKey) {
                                            iconUrl = ITEMS_ICONS[matchedKey];
                                        }
                                    }

                                    return (
                                        <div key={idx} className="build-item-row">
                                            <div className="build-item-header">
                                                {iconUrl ? (
                                                    <img src={iconUrl} alt={cleanName} className="build-item-icon-img" />
                                                ) : (
                                                    <span className="build-item-bullet">🔹</span>
                                                )}
                                                <span className="build-item-name">{cleanName || `Ítem #${idx + 1}`}</span>
                                            </div>
                                            <p className="build-item-desc">{renderTextWithItemIcons(item.desc)}</p>
                                        </div>
                                    );
                                })}
                            </div>
                            {guideUrl && (
                                <div className="build-guide-link-box">
                                    para ver una build comprobada visita:{" "}
                                    <a href={guideUrl} target="_blank" rel="noopener noreferrer" className="build-guide-link">
                                        {guideUrl}
                                    </a>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PLAN DE JUEGO (PARENT CARD WITH 2 NESTED CARDS) */}
                    <div className="game-plan-strategy-parent-card">
                        <h3>🎯 Plan de Juego por Fases</h3>
                        <div className="game-plan-strategy-grid">
                            {/* EARLY GAME CARD */}
                            <div className="strategy-phase-card early-game-card">
                                <h4>1. Early Game (Niveles 1 al 5)</h4>
                                <ul>
                                    {parsedPlan.earlyGamePoints.map((point, idx) => (
                                        <li key={idx}>{renderTextWithItemIcons(point)}</li>
                                    ))}
                                </ul>
                            </div>

                            {/* TEAMFIGHTS CARD */}
                            <div className="strategy-phase-card teamfights-card">
                                <h4>⚔️ Peleas de Equipo (Teamfights)</h4>
                                <ul>
                                    {parsedPlan.teamfightPoints.map((point, idx) => (
                                        <li key={idx}>{renderTextWithItemIcons(point)}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* REGLA DE ORO (SEPARATE CARD AT THE BOTTOM) */}
                    {parsedPlan.goldenRule && (
                        <div className="game-plan-golden-rule-card">
                            <h3>💡 Regla de Oro para esta Partida</h3>
                            <p>{renderTextWithItemIcons(parsedPlan.goldenRule)}</p>
                        </div>
                    )}
                </div>
            )}

            {/* Fallback to raw text if parsing didn't apply or wasn't resolved */}
            {((isDraft && !hasParsedDraft) || (isGamePlan && !hasParsedPlan)) && (
                <div className="recommendation-text" style={{ whiteSpace: 'pre-wrap' }}>
                    {renderTextWithItemIcons(recommendation)}
                </div>
            )}
        </div>
    );
};
