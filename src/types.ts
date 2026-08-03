export type Role = 'top' | 'jungle' | 'mid' | 'adc' | 'support';

export interface Champion {
    id: string;
    name: string;
    roles: Role[];
    iconUrl: string;
}

export interface DraftState {
    ally: Record<Role, Champion | null>;
    enemy: Record<Role, Champion | null>;
}
