// Previsão do tempo pela Open-Meteo (gratuita, sem chave). Serve para a IA
// sugerir pautas que combinam com o clima: semana quente pede cerveja,
// sorvete e carvão; chuva pede caldo, delivery e massa.

export type DayWeather = { date: string; max: number; min: number; rainMm: number; rainChance: number };

async function getJson<T>(url: string, timeoutMs = 5000): Promise<T | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, next: { revalidate: 3600 } } as RequestInit);
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function forecastForCity(city: string | null | undefined, days = 14): Promise<{ place: string; days: DayWeather[] } | null> {
  const name = (city ?? "").split(/[,/-]/)[0].trim();
  if (!name) return null;
  const geo = await getJson<{ results?: { latitude: number; longitude: number; name: string; admin1?: string }[] }>(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=pt&countryCode=BR`
  );
  const g = geo?.results?.[0];
  if (!g) return null;
  const f = await getJson<{ daily?: { time: string[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_sum: number[]; precipitation_probability_max: number[] } }>(
    `https://api.open-meteo.com/v1/forecast?latitude=${g.latitude}&longitude=${g.longitude}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&timezone=America%2FSao_Paulo&forecast_days=${Math.min(16, days)}`
  );
  const d = f?.daily;
  if (!d) return null;
  return {
    place: [g.name, g.admin1].filter(Boolean).join(", "),
    days: d.time.map((date, i) => ({
      date,
      max: Math.round(d.temperature_2m_max[i]),
      min: Math.round(d.temperature_2m_min[i]),
      rainMm: Math.round((d.precipitation_sum[i] ?? 0) * 10) / 10,
      rainChance: d.precipitation_probability_max[i] ?? 0,
    })),
  };
}
