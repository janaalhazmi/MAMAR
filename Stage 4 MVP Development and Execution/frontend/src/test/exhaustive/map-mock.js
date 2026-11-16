import React from 'react'

const h = React.createElement
const SHAPES = [
  {
    latitude: 24.7136, longitude: 46.6753, area: 1200.5,
    polygon: { rings: [[[46.6, 24.7], [46.7, 24.7], [46.7, 24.8], [46.6, 24.7]]], spatialReference: { wkid: 4326 } },
  },
  { latitude: 24.7, longitude: 46.6, area: 0, polygon: null },
  null,
  {},
  { latitude: 24.8, longitude: 46.7, area: 50, polygon: [[46.6, 24.7], [46.7, 24.8]] },
]
let n = 0

// بديل لخريطة ArcGIS: زر يستدعي onLocationSelect بأشكال بيانات مختلفة،
// ويوفر نفس دوال الـ ref (startDrawing / finishDrawing ...).
export const MockMap = React.forwardRef(function MockMap(props, ref) {
  const [, setTick] = React.useState(0)
  React.useImperativeHandle(ref, () => ({
    startDrawing: () => true,
    finishDrawing: () => { n += 1; props.onLocationSelect?.(SHAPES[0]) },
    cancelDrawing: () => { props.onLocationSelect?.(null) },
    startEditing: () => { n += 1; return n % 2 === 0 },
    finishEditing: () => { props.onLocationSelect?.(SHAPES[1]) },
  }))
  return h('div', { 'data-testid': 'map-mock' },
    h('button', {
      type: 'button',
      onClick: () => { n += 1; props.onLocationSelect?.(SHAPES[n % SHAPES.length]); setTick((x) => x + 1) },
    }, 'map pick'))
})
