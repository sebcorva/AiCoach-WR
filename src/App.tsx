import { useDraft } from './hooks/useDraft';
import { useFavoriteChampions } from './hooks/useFavoriteChampions';
import { useGeminiAI } from './hooks/useGeminiAI';
import { Header } from './components/Header';
import { TeamPanel } from './components/TeamPanel';
import { CenterPanel } from './components/CenterPanel';
import { ChampionSelectorModal } from './components/ChampionSelectorModal';
import { RecommendationCard } from './components/RecommendationCard';
import type { Role } from './types';
import './App.css';

export default function App() {
    const {
        draft,
        myRole,
        setMyRole,
        activeSelector,
        setActiveSelector,
        selectChampionForSlot,
        clearSlot,
    } = useDraft();

    const { favoriteChamps, toggleFavorite } = useFavoriteChampions();

    const {
        recommendation,
        loading,
        analysisMode,
        handleConsultAI,
        handleConsultGamePlan,
    } = useGeminiAI();

    const rolesList: { key: Role; label: string }[] = [
        { key: 'top', label: 'Top' },
        { key: 'jungle', label: 'Jungla' },
        { key: 'mid', label: 'Mid' },
        { key: 'adc', label: 'Adc' },
        { key: 'support', label: 'Soporte' },
    ];

    return (
        <div className="container">
            <Header />

            {/* DRAFTING GRID */}
            <div className="draft-grid">
                {/* EQUIPO ALIADO */}
                <TeamPanel
                    team="ally"
                    teamDraft={draft.ally}
                    rolesList={rolesList}
                    onSelectSlot={(team, role) => setActiveSelector({ team, role })}
                    onClearSlot={clearSlot}
                />

                {/* CONTROLES DEL JUGADOR */}
                <CenterPanel
                    myRole={myRole}
                    onRoleChange={setMyRole}
                    rolesList={rolesList}
                    onConsultAI={() => handleConsultAI(myRole, draft, favoriteChamps)}
                    onConsultGamePlan={() => handleConsultGamePlan(myRole, draft)}
                    loading={loading}
                    analysisMode={analysisMode}
                />

                {/* EQUIPO ENEMIGO */}
                <TeamPanel
                    team="enemy"
                    teamDraft={draft.enemy}
                    rolesList={rolesList}
                    onSelectSlot={(team, role) => setActiveSelector({ team, role })}
                    onClearSlot={clearSlot}
                />
            </div>

            {/* MODAL DE SELECCIÓN DE CAMPEÓN */}
            {activeSelector && (
                <ChampionSelectorModal
                    activeSelector={activeSelector}
                    favoriteChamps={favoriteChamps}
                    onToggleFavorite={toggleFavorite}
                    onSelectChampion={selectChampionForSlot}
                    onClose={() => setActiveSelector(null)}
                />
            )}

            {/* RESULTADO DE LA IA */}
            {recommendation && (
                <RecommendationCard
                    recommendation={recommendation}
                    analysisMode={analysisMode}
                    draft={draft}
                    myRole={myRole}
                />
            )}
        </div>
    );
}