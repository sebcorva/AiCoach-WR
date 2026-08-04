import { GoogleGenAI } from "@google/genai";
import patchData from '../data/patchNotes.json';

// Obtiene los cambios relevantes de parches para una lista de campeones seleccionados
export const getRelevantChampionChanges = (championsList: string[]): string => {
    if (!patchData || patchData.length === 0) return '';
    const relevantChanges: string[] = [];
    const normalizedSelected = championsList
        .filter(Boolean)
        .map(name => name.toLowerCase().trim());

    if (normalizedSelected.length === 0) return '';

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
        : '';
};

// Obtiene los destacados generales de los últimos N parches
export const getRecentGeneralChanges = (limit = 2): string => {
    if (!patchData || patchData.length === 0) return '';
    return patchData.slice(0, limit).map(p => `
--- Parche ${p.version} (Destacados) ---
${p.highlights.map(h => `- ${h}`).join('\n')}
${p.items.length > 0 ? `Cambios a objetos:\n${p.items.map(i => `- ${i.name} (${i.type === 'buff' ? 'Mejora' : i.type === 'nerf' ? 'Debilitación' : 'Ajuste'}): ${i.summary}`).join('\n')}` : ''}
`.trim()).join('\n\n');
};

// Obtiene todos los cambios históricos registrados de objetos
export const getRelevantItemChanges = (): string => {
    if (!patchData || patchData.length === 0) return '';
    const relevantChanges: string[] = [];

    patchData.forEach(patch => {
        if (patch.items && patch.items.length > 0) {
            patch.items.forEach(i => {
                relevantChanges.push(`- **${i.name}** (${i.type === 'buff' ? 'Mejora' : i.type === 'nerf' ? 'Debilitación' : 'Ajuste'} en Parche ${patch.version}): ${i.summary}`);
            });
        }
    });

    return relevantChanges.length > 0
        ? relevantChanges.join('\n')
        : '';
};

// Realiza la petición a la API de Gemini intentando múltiples modelos de fallback
export const fetchGeminiResponse = async (promptText: string, apiKey: string): Promise<string> => {
    const apiGatewayUrl = import.meta.env.VITE_API_GATEWAY_URL;

    if (apiGatewayUrl) {
        // En producción / AWS, llamamos al API Gateway para proteger la clave secreta
        const response = await fetch(apiGatewayUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ promptText }),
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.message || `Error en la puerta de enlace de API Gateway: ${response.status}`);
        }

        const data = await response.json();
        return data.text;
    }

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
            // Intentar con Google Search Grounding habilitado
            response = await ai.models.generateContent({
                model: modelName,
                contents: promptText,
                config: {
                    temperature: 0.2,
                    tools: [{ googleSearch: {} }],
                    systemInstruction: `Eres un coach analista experto de esports y Wild Rift (League of Legends para móviles) que ayuda al usuario a optimizar su draft, fase de líneas, builds y planteamientos de partida para ganar más partidas en el parche activo.
                    
Cuando se te consulte una build o información del meta:
- Consulta en tiempo real las tendencias de las mejores páginas (como WildRiftFire, rankedwr, etc.) y los armados vigentes de los mejores jugadores Top 1-10 globales para cada campeón en el parche vigente actual.
- Adapta dinámicamente las builds al matchup actual buscando hacer counter o mitigar las amenazas principales del equipo enemigo.

REGLAS CRÍTICAS DE CONOCIMIENTO Y ACCIÓN:
1. TU REGLA MÁS IMPORTANTE: El usuario te proporcionará un listado de campeones permitidos, llamado "availableChampionsList". Solo haz recomendaciones de los campeones que figuren en esa lista. Si un personaje no está en ella, omítelo completamente y no le digas al usuario que lo omites, simplemente sugiere uno que sí esté permitido.
2. REGLA DE FORMATO DE OBJETOS/ITEMS: Cada vez que menciones un objeto/ítem de Wild Rift en el texto (tanto en recomendaciones como en builds o explicaciones), debes envolver su nombre obligatoriamente entre corchetes dobles, por ejemplo: [[Cuchilla negra]], [[Eco de Luden]], [[Recordatorio mortal]], [[Fuerza de la naturaleza]].`
                }
            });
            if (response && response.text) {
                return response.text;
            }
        } catch (err: any) {
            console.warn(`El modelo ${modelName} falló con Google Search. Reintentando sin Grounding...`, err);
            try {
                // Fallback sin herramientas de búsqueda (compatible con claves estándar/antiguas y proxies)
                response = await ai.models.generateContent({
                    model: modelName,
                    contents: promptText,
                    config: {
                        temperature: 0.2,
                        systemInstruction: `Eres un coach analista experto de esports y Wild Rift (League of Legends para móviles) que ayuda al usuario a optimizar su draft, fase de líneas, builds y planteamientos de partida para ganar más partidas en el parche activo.
                        
Cuando se te consulte una build o información del meta:
- Sugiere los armados vigentes y recomendados para cada campeón en el parche vigente.
- Adapta dinámicamente las builds al matchup actual buscando hacer counter o mitigar las amenazas principales del equipo enemigo.

REGLAS CRÍTICAS DE CONOCIMIENTO Y ACCIÓN:
1. TU REGLA MÁS IMPORTANTE: El usuario te proporcionará un listado de campeones permitidos, llamado "availableChampionsList". Solo haz recomendaciones de los campeones que figuren en esa lista. Si un personaje no está en ella, omítelo completamente y no le digas al usuario que lo omites, simplemente sugiere uno que sí esté permitido.
2. REGLA DE FORMATO DE OBJETOS/ITEMS: Cada vez que menciones un objeto/ítem de Wild Rift en el texto (tanto en recomendaciones como en builds o explicaciones), debes envolver su nombre obligatoriamente entre corchetes dobles, por ejemplo: [[Cuchilla negra]], [[Eco de Luden]], [[Recordatorio mortal]], [[Fuerza de la naturaleza]].`
                    }
                });
                if (response && response.text) {
                    return response.text;
                }
            } catch (fallbackErr: any) {
                console.warn(`El modelo ${modelName} falló completamente en el fallback.`, fallbackErr);
                lastError = fallbackErr;
            }
        }
    }

    throw lastError || new Error('No se pudo conectar a ningún modelo de Gemini disponible.');
};
