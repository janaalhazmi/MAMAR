import { describe, expect, it, vi } from 'vitest'
import * as fieldWorker from '../services/FieldWorker/FieldWorker.js'

describe('Field worker domain logic', () => {
  it('formats distances in metres and kilometres', () => {
    expect(fieldWorker.formatDistance(null)).toBe('–')
    expect(fieldWorker.formatDistance(49.6)).toBe('50 m')
    expect(fieldWorker.formatDistance(1500)).toBe('1.5 km')
  })

  it('calculates zero and non-zero GPS distances', () => {
    const point = { latitude: 24.7136, longitude: 46.6753 }
    expect(fieldWorker.distanceInMeters(point, point)).toBeCloseTo(0, 5)
    const oneKmNorth = { latitude: 24.7226, longitude: 46.6753 }
    expect(fieldWorker.distanceInMeters(point, oneKmNorth)).toBeGreaterThan(900)
    expect(fieldWorker.distanceInMeters(point, oneKmNorth)).toBeLessThan(1100)
  })

  it('returns no planned location without coordinates or a work zone', () => {
    expect(fieldWorker.getPlannedLocation(1, null)).toBeNull()
    expect(fieldWorker.getPlannedLocation(1, { latitude: null, longitude: null })).toBeNull()
  })

  it('normalizes coordinates and work-zone data for the planned location', () => {
    const workZone = { rings: [[[1, 2], [2, 3], [3, 4]]] }
    expect(fieldWorker.getPlannedLocation(7, { latitude: '24.7', longitude: '46.6', work_zone: workZone }))
      .toEqual({ latitude: 24.7, longitude: 46.6, workZone })
    expect(fieldWorker.getPlannedLocation(7, { latitude: null, longitude: null, work_zone: workZone }))
      .toEqual({ latitude: null, longitude: null, workZone })
  })

  it('rejects protected field-worker operations when no session exists', async () => {
    await expect(fieldWorker.getFieldWorkerDashboard()).rejects.toThrow(/sign in/i)
    await expect(fieldWorker.getFieldExecution(1)).rejects.toThrow(/sign in/i)
    await expect(fieldWorker.updateSiteStatus(1, 'Paused')).rejects.toThrow(/sign in/i)
    await expect(fieldWorker.siteCheckIn(1)).rejects.toThrow(/sign in/i)
    await expect(fieldWorker.getDevice('QR-1')).rejects.toThrow(/sign in/i)
  })

  it('validates photo counts before attempting upload', async () => {
    await expect(fieldWorker.uploadSitePhotos(1, [])).rejects.toThrow(/at least one photo/i)
    const tooMany = Array.from({ length: 11 }, () => ({ file: new File(['x'], 'x.jpg', { type: 'image/jpeg' }) }))
    await expect(fieldWorker.uploadSitePhotos(1, tooMany)).rejects.toThrow(/up to 10 photos/i)
  })

  it('captures browser geolocation and normalizes accuracy', async () => {
    const getCurrentPosition = vi.fn((success) => success({ coords: { latitude: 24.7, longitude: 46.6, accuracy: 7.7 } }))
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } })
    await expect(fieldWorker.captureCurrentLocation(null)).resolves.toEqual({ latitude: 24.7, longitude: 46.6, accuracy: 8 })
    expect(getCurrentPosition).toHaveBeenCalledWith(expect.any(Function), expect.any(Function), expect.objectContaining({ enableHighAccuracy: true, maximumAge: 0 }))
  })

  it('turns geolocation permission errors into actionable messages', async () => {
    const getCurrentPosition = vi.fn((_success, error) => error({ code: 1 }))
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition } })
    await expect(fieldWorker.captureCurrentLocation(null)).rejects.toThrow(/permission was denied/i)
  })

  it('reports unsupported geolocation environments', async () => {
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined })
    await expect(fieldWorker.captureCurrentLocation(null)).rejects.toThrow(/does not support location/i)
  })

  it('exports the expected attendance and site status constants', () => {
    expect(fieldWorker.MAX_DISTANCE_METERS).toBe(50)
    expect(fieldWorker.SITE_STATUSES).toEqual(['Not Started', 'Work in Progress', 'Paused', 'Completed'])
  })
})
