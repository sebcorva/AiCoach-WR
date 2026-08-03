import { useState, useEffect } from 'react';

export const useFavoriteChampions = () => {
    const [favoriteChamps, setFavoriteChamps] = useState<string[]>(() => {
        const saved = localStorage.getItem('wr_favorite_champions');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('wr_favorite_champions', JSON.stringify(favoriteChamps));
    }, [favoriteChamps]);

    const toggleFavorite = (champId: string) => {
        setFavoriteChamps(prev =>
            prev.includes(champId)
                ? prev.filter(id => id !== champId)
                : [...prev, champId]
        );
    };

    return {
        favoriteChamps,
        toggleFavorite,
    };
};
