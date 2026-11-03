import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-search";

// Yellow work zone polygon style
const POLYGON_SYMBOL = {
  type: "simple-fill",
  color: [255, 204, 0, 0.35],
  outline: {
    color: [255, 180, 0, 1],
    width: 2,
  },
};

function normalizePolygon(value) {
  if (!value) return null;

  // Support workZone objects containing a polygon property.
  const geometry = value.polygon ?? value;

  // Support an array of coordinate pairs.
  if (Array.isArray(geometry)) {
    return {
      rings: [geometry],
      spatialReference: { wkid: 4326 },
    };
  }

  // Support ArcGIS polygon JSON.
  if (geometry?.rings) {
    return geometry;
  }

  return null;
}

const MamarMap = forwardRef(function MamarMap(
  {
    onLocationSelect,
    polygon = null,
    workZone = null,
    latitude = null,
    longitude = null,
    readOnly = false,
  },
  ref
) {
  const mapRef = useRef(null);
  const sketchRef = useRef(null);
  const graphicsLayerRef = useRef(null);
  const callbackRef = useRef(onLocationSelect);

  // Keep latest callback without rebuilding the map.
  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Keep latest location data available for map initialization.
  const initialDataRef = useRef({
    polygon,
    workZone,
    latitude,
    longitude,
    readOnly,
  });

  // Initialize map only once.
  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) return;

    let cancelled = false;
    let sketch = null;
    let sketchHandle = null;
    let graphicsLayer = null;

    async function initializeMap() {
      try {
        await mapElement.viewOnReady();

        if (cancelled) return;

        const view = mapElement.view;

        graphicsLayer = new GraphicsLayer({
          title: "Project Work Zone",
        });

        view.map.add(graphicsLayer);
        graphicsLayerRef.current = graphicsLayer;

        const initial = initialDataRef.current;

        const savedGeometry = normalizePolygon(
          initial.polygon ?? initial.workZone
        );

        if (savedGeometry) {
          const savedPolygon = Polygon.fromJSON(savedGeometry);

          const graphic = new Graphic({
            geometry: savedPolygon,
            symbol: POLYGON_SYMBOL,
          });

          graphicsLayer.add(graphic);

          if (savedPolygon.extent) {
            await view.goTo(
              savedPolygon.extent.expand(1.5),
              { animate: false }
            );
          }
        } else if (
          initial.latitude != null &&
          initial.longitude != null
        ) {
          await view.goTo(
            {
              center: [
                Number(initial.longitude),
                Number(initial.latitude),
              ],
              zoom: 15,
            },
            { animate: false }
          );
        }

        if (cancelled || initial.readOnly) return;

        sketch = new SketchViewModel({
          view,
          layer: graphicsLayer,

          polygonSymbol: POLYGON_SYMBOL,

          defaultCreateOptions: {
            mode: "click",
          },

          defaultUpdateOptions: {
            enableRotation: false,
            enableScaling: false,
          },
        });

        sketchRef.current = sketch;

        sketchHandle = sketch.on("create", (event) => {
          if (event.state !== "complete") return;

          const completedPolygon = event.graphic?.geometry;

          if (!completedPolygon) return;

          const center = completedPolygon.centroid;

          if (!center) return;

          const latitude = Number(
            center.latitude.toFixed(6)
          );

          const longitude = Number(
            center.longitude.toFixed(6)
          );

          const calculatedArea = geometryEngine.geodesicArea(
            completedPolygon,
            "square-meters"
          );

          const area = Math.abs(calculatedArea);

          callbackRef.current?.({
            latitude,
            longitude,
            area: Number(area.toFixed(2)),
            polygon: completedPolygon.toJSON(),
          });
        });
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Could not initialize MAMAR map:",
            error
          );
        }
      }
    }

    initializeMap();

    return () => {
      cancelled = true;

      sketchHandle?.remove();

      if (sketch) {
        sketch.destroy();
      }

      if (graphicsLayer && mapElement.view?.map) {
        mapElement.view.map.remove(graphicsLayer);
      }

      sketchRef.current = null;
      graphicsLayerRef.current = null;
    };
  }, []);

  // Start drawing a new polygon.
  const startDrawing = () => {
    const sketch = sketchRef.current;

    if (!sketch || readOnly) {
      console.warn("Map drawing tools are not ready.");
      return;
    }

    sketch.cancel();

    // Remove previous work zone before drawing again.
    sketch.layer.removeAll();

    callbackRef.current?.(null);

    sketch.create("polygon");
  };

  // Finish the current polygon.
  const finishDrawing = () => {
    const sketch = sketchRef.current;

    if (!sketch || readOnly) return;

    if (sketch.state === "active") {
      sketch.complete();
    }
  };

  // Cancel drawing and clear the polygon.
  const cancelDrawing = () => {
    const sketch = sketchRef.current;

    if (!sketch || readOnly) return;

    sketch.cancel();
    sketch.layer.removeAll();

    callbackRef.current?.(null);
  };

  // Allow ProjectLocationPage buttons to control drawing.
  useImperativeHandle(ref, () => ({
    startDrawing,
    finishDrawing,
    cancelDrawing,
  }));

  return (
    <div className="mamar-map-container">
      <arcgis-map
        ref={mapRef}
        item-id="7371729f1ff240038c3a8155edebfeda"
        className="mamar-map"
      >
        <arcgis-zoom slot="top-left" />

        {!readOnly && (
          <arcgis-search slot="top-right" />
        )}
      </arcgis-map>
    </div>
  );
});

export default MamarMap;