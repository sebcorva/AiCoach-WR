import { useState } from 'react';
import type { Role, Champion, DraftState } from '../types';

export const useDraft = () => {
    const [draft, setDraft] = useState<DraftState>({
        ally: { top: null, jungle: null, mid: null, adc: null, support: null },
        enemy: { top: null, jungle: null, mid: null, adc: null, support: null },
    });

    const [myRole, setMyRole] = useState<Role>('mid');
    const [activeSelector, setActiveSelector] = useState<{ team: 'ally' | 'enemy'; role: Role } | null>(null);

    const selectChampionForSlot = (champion: Champion) => {
        if (!activeSelector) return;
        setDraft((prev) => ({
            ...prev,
            [activeSelector.team]: {
                ...prev[activeSelector.team],
                [activeSelector.role]: champion,
            },
        }));
        setActiveSelector(null);
    };

    const clearSlot = (team: 'ally' | 'enemy', role: Role) => {
        setDraft((prev) => ({
            ...prev,
            [team]: { ...prev[team], [role]: null },
        }));
    };

    return {
        draft,
        myRole,
        setMyRole,
        activeSelector,
        setActiveSelector,
        selectChampionForSlot,
        clearSlot,
    };
};
