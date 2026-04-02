const Groq = require('groq-sdk');
const cache = require('./cacheService');

const SYSTEM_PROMPT = `Tu es un analyste football expert spécialisé dans les paris sportifs.
Tu analyses les données statistiques de matchs de football pour produire des prédictions
précises et des recommandations de valeur.

Tu dois TOUJOURS :
- Baser tes analyses sur les données fournies, pas sur ta connaissance générale
- Donner des probabilités réalistes (éviter les extrêmes type 95%)
- Identifier les facteurs clés qui influencent le résultat
- Mentionner les incertitudes (blessures, forme instable, etc.)
- Structurer ta réponse en JSON valide avec les champs :
  summary, win_probability (home/draw/away), key_players (array de 3),
  recommendation, confidence_level, confidence_reason

Réponds UNIQUEMENT en JSON, sans markdown, sans texte avant ou après.`;

let groqClient = null;

function getGroqClient() {
  if (!groqClient) {
    if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'ta_clé_groq_ici') {
      throw new Error('GROQ_API_KEY not configured');
    }
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
  }
  return groqClient;
}

function buildAnalysisPrompt(matchData) {
  const { fixture, homeTeam, awayTeam, homeStats, awayStats, h2h, players, injuries } = matchData;

  const formatForm = (stats) => {
    if (!stats?.form) return 'N/A';
    return stats.form.slice(-5).split('').join(' ');
  };

  const formatGoals = (stats) => {
    if (!stats?.goals) return 'N/A';
    return `Scored: ${stats.goals.for?.total?.total || 0} / Conceded: ${stats.goals.against?.total?.total || 0}`;
  };

  const formatH2H = (h2hMatches) => {
    if (!h2hMatches?.length) return 'No H2H data available';
    return h2hMatches.slice(0, 5).map(m => {
      const home = m.teams?.home;
      const away = m.teams?.away;
      const goals = m.goals;
      return `${home?.name} ${goals?.home ?? '?'} - ${goals?.away ?? '?'} ${away?.name} (${m.fixture?.date?.slice(0, 10)})`;
    }).join('\n');
  };

  const formatTopPlayers = (playerData) => {
    if (!playerData?.length) return 'No player data available';
    const allPlayers = [];
    for (const team of playerData) {
      for (const player of (team.players || [])) {
        const s = player.statistics?.[0];
        if (s) {
          allPlayers.push({
            name: player.player?.name,
            team: team.team?.name,
            goals: s.goals?.total || 0,
            assists: s.goals?.assists || 0,
            shots: s.shots?.total || 0,
            shotsOn: s.shots?.on || 0,
          });
        }
      }
    }
    return allPlayers
      .sort((a, b) => (b.goals + b.assists) - (a.goals + a.assists))
      .slice(0, 6)
      .map(p => `${p.name} (${p.team}): ${p.goals}G ${p.assists}A, ${p.shots} shots (${p.shotsOn} on target)`)
      .join('\n');
  };

  const formatInjuries = (inj) => {
    if (!inj?.length) return 'No injury data';
    return inj.map(i => `${i.player?.name} (${i.team?.name}): ${i.player?.reason}`).join('\n');
  };

  return `Analyse ce match de football et génère une prédiction complète :

MATCH: ${homeTeam?.name || 'Équipe domicile'} vs ${awayTeam?.name || 'Équipe extérieur'}
DATE: ${fixture?.date ? new Date(fixture.date).toLocaleString('fr-FR') : 'N/A'}
LIEU: ${fixture?.venue?.name || 'N/A'}, ${fixture?.venue?.city || ''}
COMPÉTITION: ${fixture?.league?.name || 'N/A'}

FORME RÉCENTE (5 derniers matchs):
- ${homeTeam?.name}: ${formatForm(homeStats)}
- ${awayTeam?.name}: ${formatForm(awayStats)}

STATISTIQUES SAISON:
- ${homeTeam?.name}: ${formatGoals(homeStats)}
  Clean sheets: ${homeStats?.clean_sheet?.total || 0}
  Possession moy: ${homeStats?.fixtures?.played?.total ? 'N/A' : 'N/A'}%
- ${awayTeam?.name}: ${formatGoals(awayStats)}
  Clean sheets: ${awayStats?.clean_sheet?.total || 0}

H2H (5 dernières confrontations):
${formatH2H(h2h)}

TOP JOUEURS:
${formatTopPlayers(players)}

BLESSURES / INDISPONIBILITÉS:
${formatInjuries(injuries)}

Génère une analyse JSON avec :
- summary: résumé contextuel (3-4 phrases en français)
- win_probability: { home: number, draw: number, away: number } (doit totaliser 100)
- key_players: array de 3 objets { name, team, reason }
- recommendation: conseil de pari clair en français
- confidence_level: "Low" | "Medium" | "High"
- confidence_reason: justification du niveau de confiance en français`;
}

async function generateAnalysis(fixtureId, matchData) {
  // Check cache first
  const cached = cache.getCachedAnalysis(fixtureId);
  if (cached) {
    console.log(`[Cache HIT] AI analysis for fixture ${fixtureId}`);
    return { ...cached, fromCache: true };
  }

  const client = getGroqClient();
  const prompt = buildAnalysisPrompt(matchData);

  console.log(`[Groq] Generating analysis for fixture ${fixtureId}...`);

  const completion = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
  });

  const raw = completion.choices[0]?.message?.content || '{}';

  let parsed;
  try {
    // Strip potential markdown fences
    const clean = raw.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch (err) {
    console.error('[Groq] Failed to parse JSON response:', raw.slice(0, 200));
    throw new Error('Groq returned invalid JSON. Try again.');
  }

  // Normalize win_probability to sum to 100
  if (parsed.win_probability) {
    const { home = 0, draw = 0, away = 0 } = parsed.win_probability;
    const total = home + draw + away;
    if (total > 0 && Math.abs(total - 100) > 1) {
      parsed.win_probability = {
        home: Math.round((home / total) * 100),
        draw: Math.round((draw / total) * 100),
        away: 100 - Math.round((home / total) * 100) - Math.round((draw / total) * 100),
      };
    }
  }

  // Cache the result
  cache.setCachedAnalysis(fixtureId, parsed);

  return { ...parsed, fromCache: false };
}

// Streaming version (SSE)
async function generateAnalysisStream(fixtureId, matchData, onChunk) {
  const client = getGroqClient();
  const prompt = buildAnalysisPrompt(matchData);

  const stream = await client.chat.completions.create({
    model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.3,
    max_tokens: 1500,
    stream: true,
  });

  let fullText = '';
  for await (const chunk of stream) {
    const delta = chunk.choices[0]?.delta?.content || '';
    fullText += delta;
    if (onChunk) onChunk(delta);
  }

  try {
    const clean = fullText.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(clean);
    cache.setCachedAnalysis(fixtureId, parsed);
    return parsed;
  } catch {
    return null;
  }
}

module.exports = { generateAnalysis, generateAnalysisStream };
