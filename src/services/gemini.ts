import { GoogleGenAI } from "@google/genai";
import patchData from '../data/patchNotes.json';

// Obtiene los cambios relevantes de parches para una lista de campeones seleccionados
export const getRelevantChampionChanges = (championsList: string[]): string => {
    const relevantChanges: string[] = [];
    const normalizedSelected = championsList
        .filter(Boolean)
        .map(name => name.toLowerCase().trim());

    if (normalizedSelected.length === 0) return 'No hay campeones seleccionados en el draft.';

    patchData.forEach(patch => {
        const matchingChamps = patch.champions.filter(c =>
            normalizedSelected.includes(c.name.toLowerCase().trim())
        );

        if (matchingChamps.length > 0) {
            matchingChamps.forEach(c => {
                relevantChanges.push(`- **${c.name}** (${c.type === 'buff' ? 'Mejora' : c.type === 'nerf' ? 'Debilitación' : 'Ajuste'} en Parche ${patch.version}): ${c.summary}`);
            });
        }
    });

    return relevantChanges.length > 0
        ? relevantChanges.join('\n')
        : 'No se encontraron cambios recientes para los campeones seleccionados.';
};

// Obtiene los destacados generales de los últimos N parches
export const getRecentGeneralChanges = (limit = 2): string => {
    return patchData.slice(0, limit).map(p => `
--- Parche ${p.version} (Destacados) ---
${p.highlights.map(h => `- ${h}`).join('\n')}
${p.items.length > 0 ? `Cambios a objetos:\n${p.items.map(i => `- ${i.name} (${i.type === 'buff' ? 'Mejora' : i.type === 'nerf' ? 'Debilitación' : 'Ajuste'}): ${i.summary}`).join('\n')}` : ''}
`.trim()).join('\n\n');
};

// Realiza la petición a la API de Gemini intentando múltiples modelos de fallback
export const fetchGeminiResponse = async (promptText: string, apiKey: string): Promise<string> => {
    const modelsToTry = [
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.5-flash-lite',
        'gemini-1.5-flash'
    ];

    const ai = new GoogleGenAI({ apiKey });
    let response = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
        try {
            response = await ai.models.generateContent({
                model: modelName,
                contents: promptText,
                config: {
                    systemInstruction: `Eres un coach que apoya al usuario a mejorar su draft y modo de juego para el juego de celular "Wild Rift" con el objetivo de mejorar y ganar más partidas.

REGLAS CRÍTICAS DE CONOCIMIENTO:
TU REGLA MÁS IMPORTANTE: El usuario te proporcionará un listado campeones permitidos, llamada "availableChampionsList" solo haz recomendaciones de esos campeones.
Si un personaje no está en la lista del prompt, omite esa recomendacion y no le digas al usuario que lo omitiras o que no esta disponible solo indicale el campeon que recomiendas.`
                }
            });
            if (response && response.text) {
                return response.text;
            }
        } catch (err: any) {
            console.warn(`El modelo ${modelName} no está disponible, intentando fallback...`, err);
            lastError = err;
        }
    }

    throw lastError || new Error('No se pudo conectar a ningún modelo de Gemini disponible.');
};
