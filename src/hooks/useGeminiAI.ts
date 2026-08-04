import { useState } from 'react';
import { fetchGeminiResponse, getRecentGeneralChanges, getRelevantChampionChanges, getRelevantItemChanges } from '../services/gemini';
import { CHAMPIONS } from '../data/champions.ts';
import type { DraftState, Role } from '../types';

export const useGeminiAI = () => {
    const [recommendation, setRecommendation] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [analysisMode, setAnalysisMode] = useState<'DRAFT' | 'GAME_PLAN'>('DRAFT');

    const callGeminiAI = async (promptText: string) => {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            alert('Configura la variable VITE_GEMINI_API_KEY en tu archivo .env');
            return;
        }

        setLoading(true);
        setRecommendation('');

        try {
            const textOutput = await fetchGeminiResponse(promptText, apiKey);
            setRecommendation(textOutput);
        } catch (err: any) {
            console.error(err);
            setRecommendation('❌ Error al consultar la IA: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleConsultAI = (myRole: Role, draft: DraftState, favoriteChamps: string[]) => {
        if (draft.ally[myRole] !== null) {
            const errorMsg = `❌ Error: Ya has seleccionado un campeón para la posición de ${myRole.toUpperCase()} en tu equipo aliado. No puedes solicitar una recomendación para esta misma línea.`;
            setRecommendation(errorMsg);
            return;
        }

        setAnalysisMode('DRAFT');

        const myMainPool = CHAMPIONS
            .filter(c => favoriteChamps.includes(c.id))
            .map(c => c.name)
            .join(', ');

        const validRoleChampions = CHAMPIONS
            .filter(c => c.roles.includes(myRole))
            .map(c => c.name)
            .join(', ');

        const allyTeamNames = Object.entries(draft.ally)
            .map(([r, c]) => `${r.toUpperCase()}: ${c ? c.name : 'No seleccionado'}`)
            .join(', ');

        const enemyTeamNames = Object.entries(draft.enemy)
            .map(([r, c]) => `${r.toUpperCase()}: ${c ? c.name : 'No seleccionado'}`)
            .join(', ');

        const availableChampionsList = CHAMPIONS.map(c => c.name).join(', ');
        const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });

        const generalChanges = getRecentGeneralChanges(2);
        const champChanges = getRelevantChampionChanges([
            ...Object.values(draft.ally).map(c => c?.name || ''),
            ...Object.values(draft.enemy).map(c => c?.name || '')
        ]);
        const itemChanges = getRelevantItemChanges();

        const patchNotesText = (generalChanges || champChanges || itemChanges)
            ? `
=== DESTACADOS DE PARCHES RECIENTES ===
${generalChanges}

=== CAMBIOS RECIENTES DE CAMPEONES EN ESTA PARTIDA ===
${champChanges}

=== CAMBIOS RECIENTES DE OBJETOS EN ESTAS VERSIONES ===
${itemChanges}
`
            : '';

        const promptText = `
=== FECHA ACTUAL Y PARCHE VIGENTE ===
Fecha de hoy: ${currentDate}
Utiliza tu herramienta de búsqueda web (Google Search Grounding) para buscar cuál es el último parche oficial y vigente de Wild Rift en base a la fecha de hoy, y adapta tus recomendaciones de campeones y explicaciones estrictamente a dicho parche y metajuego.

=== MI CHAMPION POOL / CAMPEONES QUE SÉ JUGAR ===
[${myMainPool || 'No hay favoritos seleccionados, usar lista general'}]

=== CAMPEONES DISPONIBLES PARA LA POSICIÓN ${myRole.toUpperCase()} ===
[${validRoleChampions}]

=== CAMPEONES PERMITIDOS EN ESTA PARTIDA ===
[${availableChampionsList}]

=== COMPOSICIÓN DE LA PARTIDA ===
EQUIPO ALIADO: ${allyTeamNames}
EQUIPO ENEMIGO: ${enemyTeamNames}
LÍNEA A ANALIZAR: ${myRole.toUpperCase()}
${patchNotesText}

INSTRUCCIONES DE FORMATO OBLIGATORIO:
Responde EXACTAMENTE con la siguiente estructura en Markdown, usando emojis, estrellas (⭐⭐⭐⭐⭐) y negritas. NO agregues ni quites secciones.
🏆 Tus Mejores Opciones de ${myRole.toUpperCase()}

1.[NOMBRE DEL CAMPEÓN #1] ⭐⭐⭐⭐⭐ ([Frase corta de resumen])
Por qué elegirlo:
- [Punto clave 1 explicando interacción directa contra campeones enemigos concretos y sus habilidades].
- [Punto clave 2 explicando sinergia con el equipo aliado o rol en la partida].

2.[NOMBRE DEL CAMPEÓN #2] ⭐⭐⭐⭐⭐ ([Frase corta de resumen])
Por qué elegirlo:
- [Punto clave 1].
- [Punto clave 2].

3.[NOMBRE DEL CAMPEÓN #3] ⭐⭐⭐⭐ ([Frase corta de resumen])
Por qué elegirlo:
- [Punto clave 1].
- [Punto clave 2].

❌ A Evitar
- [Campeón que NO debe picar y por qué contra esta compo].
- [Campeón que NO debe picar y por qué contra esta compo].

💡 Veredicto Rápido:
[Resumen de 2-3 líneas comparando cuándo elegir la Opción #1 vs la Opción #2].

INSTRUCCIONES DE SELECCIÓN (ESTRICTO):
1. REGLA INQUEBRANTABLE: Tus recomendaciones DEBEN salir EXCLUSIVAMENTE de la lista de campeones permitidos anterior. 
2. Si un campeón NO está escrito textualmente en la lista de arriba (por ejemplo: Sejuani, K'Sante, Azir, etc.), TIENES PROHIBIDO MENCIONARLO.
3. **PRIORIDAD ALTA:** Intenta recomendar las mejores opciones de MI CHAMPION POOL siempre que hagan buen sentido táctico contra la composición enemiga.
4. Si ninguno de mi pool es viable contra esta composición, sugiere los mejores de la lista general de permitidos y aclara que es una sugerencia fuera de mi pool.
5. Mantén el formato con emojis y estructura acordada.
6. Menciona explícitamente nombres de los campeones enemigos y sus habilidades clave para justificar las selecciones
`.trim();

        callGeminiAI(promptText);
    };

    const handleConsultGamePlan = (myRole: Role, draft: DraftState) => {
        const allAllySelected = Object.values(draft.ally).every(c => c !== null);
        const allEnemySelected = Object.values(draft.enemy).every(c => c !== null);

        if (!allAllySelected || !allEnemySelected) {
            const errorMsg = '❌ Error: Debes completar la selección de todos los campeones (5 aliados y 5 enemigos) antes de solicitar el Planteamiento de Partida (Game Plan).';
            setRecommendation(errorMsg);
            return;
        }

        setAnalysisMode('GAME_PLAN');

        const allyTeamNames = Object.entries(draft.ally)
            .map(([r, c]) => `${r.toUpperCase()}: ${c ? c.name : 'No seleccionado'}`)
            .join(', ');

        const enemyTeamNames = Object.entries(draft.enemy)
            .map(([r, c]) => `${r.toUpperCase()}: ${c ? c.name : 'No seleccionado'}`)
            .join(', ');

        const myChampionName = draft.ally[myRole]?.name || 'No seleccionado aún';
        const currentDate = new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
        const generalChanges = getRecentGeneralChanges(2);
        const champChanges = getRelevantChampionChanges([
            ...Object.values(draft.ally).map(c => c?.name || ''),
            ...Object.values(draft.enemy).map(c => c?.name || '')
        ]);
        const itemChanges = getRelevantItemChanges();

        const patchNotesText = (generalChanges || champChanges || itemChanges)
            ? `

`
            : '';

        const promptText = `
=== FECHA ACTUAL Y PARCHE VIGENTE ===
Fecha de hoy: ${currentDate}
Utiliza tu herramienta de búsqueda web (Google Search Grounding) para buscar cuál es el último parche oficial y vigente de Wild Rift en base a la fecha de hoy, y adapta tus recomendaciones de campeones y explicaciones estrictamente a dicho parche y metajuego.

=== PLANTEAMIENTO DE PARTIDA COMPLETA (WILD RIFT) ===
- Mi Línea: ${myRole.toUpperCase()}
- Mi Campeón Elegido: ${myChampionName}
- Composición Aliada: ${allyTeamNames}
- Composición Enemiga: ${enemyTeamNames}
${patchNotesText}

INSTRUCCIONES DE FORMATO OBLIGATORIO:
Responde EXACTAMENTE utilizando el formato de Markdown, emojis y tono estratégico que se muestra en la siguiente plantilla de ejemplo. NO agregues ni quites secciones. Asume que la partida ya va a empezar con los campeones seleccionados.

¡Selección impecable sacando a ${myChampionName}! Viendo la pantalla de carga final, el rival confirmó una composición [menciona una característica clave del equipo enemigo, ej. repleta de daño AP / con mucho CC / de alto escalado] que tu kit va a aprovechar.

Distribución de líneas:
• Equipo Enemigo: [Lista los 5 campeones enemigos especificando su línea entre paréntesis, ej: Top/Barón, JG, Mid, ADC, Support]
• Tu Equipo: [Lista los 5 campeones aliados especificando su línea entre paréntesis]

🛠️ Build e Ítems Clave
-[Nombre Ítem 1]: [Explicación detallada de por qué este primer ítem nuclear/clave es vital contra las amenazas del equipo enemigo actual].
-[Nombre Ítem 2]: [Explicación detallada del segundo ítem clave de tu núcleo].
-[Nombre Ítem 3]: [Explicación del tercer ítem clave o defensivo temprano necesario para esta partida].
-[Botas y Encantamiento]: [Especificar qué tipo de botas comprar, qué encantamiento activo elegir (ej. Estasis, Gloria, Fisión) y por qué].
-[Opciones para el 5° Ítem]: [Dar opciones y explicaciones de qué ítems situacionales comprar en el quinto slot].
-[Opciones para el 6° Ítem]: [Dar opciones y explicaciones de qué ítems situacionales comprar para cerrar la build en el sexto slot].

🎯 Plan de Juego por Fases

1. Early Game (Niveles 1 al 5)
-[Punto Clave 1 sobre la Fase de Líneas / Limpieza]: Estrategia específica contra el rival directo de tu línea o jungla enemigo.
-[Punto Clave 2 sobre Ganks / Rotaciones]: A qué línea gankear o qué objetivos priorizar en los primeros 5 minutos.

⚔️ Cómo Jugar las Peleas de Equipo (Teamfights)
-[Prioridad de Objetivos]: [LISTA EN MAYÚSCULAS DE OBJETIVOS PRIORITARIOS ➔ OBJETIVOS SECUNDARIOS]
-[Encabezado con mecánica o habilidad del enemigo a tener en cuenta]: Explicación de cómo reaccionar o mitigar las mayores amenazas del rival.
-[Instrucción de Posicionamiento / Inicio de Pelea]:** Cómo iniciar, cuándo entrar (ej: entrar 2 segundos después, flanquear, hacer peel) y en quién enfocar el daño.
-[Precaución Específica]:** Un peligro puntual al que debes prestar atención durante las peleas masivas.

💡 Regla de Oro para esta Partida
[Un resumen motivador de 2 o 3 líneas con la clave táctica definitiva para ganar esta partida específica].
    `.trim();

        callGeminiAI(promptText);
    };

    return {
        recommendation,
        loading,
        analysisMode,
        handleConsultAI,
        handleConsultGamePlan,
    };
};
