const API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

exports.handler = async (event) => {
    const corsHeaders = {
        "Access-Control-Allow-Origin": "*", // O el dominio de tu CloudFront en producción
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Allow-Methods": "POST,OPTIONS"
    };

    // Manejar CORS Preflight
    if (event.requestContext && event.requestContext.http && event.requestContext.http.method === "OPTIONS") {
        return {
            statusCode: 200,
            headers: corsHeaders,
            body: ""
        };
    }

    try {
        if (!event.body) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "Request body is missing" })
            };
        }

        const body = JSON.parse(event.body);
        const promptText = body.promptText;

        if (!promptText) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ message: "promptText is required" })
            };
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ message: "GEMINI_API_KEY is not configured on Lambda environment variables" })
            };
        }

        // Modelos soportados y vigentes en la API de Google Gen AI
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-1.5-flash"
        ];

        let resultText = "";
        let lastError = null;

        for (const model of models) {
            try {
                // 1. Intentar con Google Search Grounding (Búsqueda en Google)
                const response = await fetch(`${API_URL}/${model}:generateContent?key=${apiKey}`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
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
                    })
                });

                const data = await response.json();
                if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
                    resultText = data.candidates[0].content.parts[0].text;
                    break;
                } else {
                    throw new Error(data.error ? data.error.message : "Fallo al generar contenido");
                }
            } catch (err) {
                console.warn(`Modelo ${model} con Search falló. Reintentando sin Grounding...`, err);
                try {
                    // 2. Fallback sin Search Grounding
                    const response = await fetch(`${API_URL}/${model}:generateContent?key=${apiKey}`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: promptText }] }],
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
                        })
                    });

                    const data = await response.json();
                    if (response.ok && data.candidates && data.candidates[0].content.parts[0].text) {
                        resultText = data.candidates[0].content.parts[0].text;
                        break;
                    } else {
                        throw new Error(data.error ? data.error.message : "Fallo en el fallback");
                    }
                } catch (fallbackErr) {
                    console.error(`Modelo ${model} falló completamente en fallback.`, fallbackErr);
                    lastError = fallbackErr;
                }
            }
        }

        if (!resultText) {
            throw lastError || new Error("No se pudo conectar a ningún modelo de Gemini disponible.");
        }

        return {
            statusCode: 200,
            headers: corsHeaders,
            body: JSON.stringify({ text: resultText })
        };
    } catch (error) {
        console.error("Lambda Error:", error);
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ message: error.message || "Internal Server Error" })
        };
    }
};
