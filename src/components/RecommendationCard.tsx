import React from 'react';
import { Sparkles } from 'lucide-react';

interface RecommendationCardProps {
    recommendation: string;
    analysisMode: 'DRAFT' | 'GAME_PLAN';
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
    recommendation,
    analysisMode,
}) => {
    return (
        <div className="recommendation-card">
            <h2>
                <Sparkles color="#38bdf8" />
                {analysisMode === 'DRAFT' ? ' Recomendación de Draft' : ' Planteamiento de Partida'}
            </h2>
            <div className="recommendation-text" style={{ whiteSpace: 'pre-wrap' }}>
                {recommendation}
            </div>
        </div>
    );
};
