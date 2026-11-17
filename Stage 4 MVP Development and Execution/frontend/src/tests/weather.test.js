import { afterEach, describe, expect, it, vi } from 'vitest'
import { adviceFor, describe as describeWeather, todayWeather } from '../services/weather'

describe('weather service', () => {
  it.each([
    [0, 'Clear'], [1, 'Mostly clear'], [2, 'Partly cloudy'], [3, 'Cloudy'],
    [45, 'Fog'], [48, 'Fog'], [61, 'Rain'], [82, 'Rain'], [71, 'Snow'],
    [86, 'Snow'], [95, 'Thunderstorm'], [999, 'Cloudy'], [null, 'Unknown'],
  ])('maps weather code %s to %s', (code, expected) => {
    expect(describeWeather(code)).toBe(expected)
  })

  it('returns safe-work advice in mild conditions', () => {
    expect(adviceFor({ high: 25, summary: 'Clear', rainChance: 0, rainMm: 0, gust: 10 }))
      .toEqual([['ok', 'Good conditions for road work today.']])
  })

  it('warns about extreme heat, thunderstorms and strong wind', () => {
    const advice = adviceFor({
      high: 46, summary: 'Thunderstorm', rainChance: 0, rainMm: 0, gust: 55,
    })
    expect(advice).toHaveLength(3)
    expect(advice.every(([level]) => level === 'bad')).toBe(true)
  })

  it('warns about rain, moderate wind and fog', () => {
    const advice = adviceFor({
      high: 25, summary: 'Fog', rainChance: 60, rainMm: 0, gust: 40,
    })
    expect(advice).toHaveLength(3)
    expect(advice.map(([level]) => level)).toEqual(['mid', 'mid', 'mid'])
  })

  it('requests the weather using Riyadh timezone and returns normalized data', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        current: {
          temperature_2m: 31, apparent_temperature: 33, relative_humidity_2m: 40,
          weather_code: 2, wind_speed_10m: 12, is_day: 1,
        },
        daily: {
          time: ['2026-11-16'], temperature_2m_max: [35], temperature_2m_min: [22],
          precipitation_probability_max: [10], precipitation_sum: [0],
          wind_gusts_10m_max: [20], uv_index_max: [5],
          sunrise: ['2026-11-16T06:00'], sunset: ['2026-11-16T17:00'],
        },
      }),
    }))

    const result = await todayWeather(24.7136, 46.6753)
    expect(fetch).toHaveBeenCalledOnce()
    expect(fetch.mock.calls[0][0]).toContain('timezone=Asia%2FRiyadh')
    expect(result).toMatchObject({
      temp: 31, feels: 33, humidity: 40, summary: 'Partly cloudy',
      high: 35, low: 22, rainChance: 10, gust: 20,
    })
    expect(result.checkedAt).toBeInstanceOf(Date)
    expect(result.advice).toBeDefined()
  })

  it('converts network errors into a user-friendly error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')))
    await expect(todayWeather(24, 46)).rejects.toThrow(
      'Could not load the weather. Check the internet connection and refresh.'
    )
  })

  it('handles non-success weather responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }))
    await expect(todayWeather(24, 46)).rejects.toThrow(
      'The weather service is busy right now. Try Refresh in a minute.'
    )
  })
})

afterEach(() => vi.unstubAllGlobals())
