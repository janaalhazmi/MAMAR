import {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
} from "react";

import SketchViewModel from "@arcgis/core/widgets/Sketch/SketchViewModel.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-search";

const MamarMap = forwardRef(function MamarMap({ onLocationSelect }, ref) {
  const mapRef = useRef(null);
  const sketchRef = useRef(null);
  const callbackRef = useRef(onLocationSelect);

  // Keep the latest callback without reinitializing the map.
  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Initialize the map and polygon drawing functionality.
  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) return;

    let sketch = null;
    let sketchHandle = null;
    let graphicsLayer = null;
    let cancelled = false;

    async function initializeMap() {
      try {
        await mapElement.viewOnReady();

        if (cancelled) return;

        const view = mapElement.view;

        graphicsLayer = new GraphicsLayer({
          title: "Project Work Zone",
        });

        view.map.add(graphicsLayer);

        sketch = new SketchViewModel({
          view,
          layer: graphicsLayer,

          polygonSymbol: {
            type: "simple-fill",
            color: [255, 204, 0, 0.35],

            outline: {
              color: [255, 180, 0],
              width: 2,
            },
          },

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

          const polygon = event.graphic?.geometry;

          if (!polygon) return;

          const center = polygon.centroid;

          if (!center) return;

          const latitude = Number(center.latitude.toFixed(6));
          const longitude = Number(center.longitude.toFixed(6));

          const area = Math.abs(
            geometryEngine.geodesicArea(polygon, "square-meters")
          );

          if (callbackRef.current) {
            callbackRef.current({
              latitude,
              longitude,
              area: Number(area.toFixed(2)),
              polygon: polygon.toJSON(),
            });
          }
        });

        // Drawing starts only when the user clicks Draw Work Zone.
      } catch (error) {
        console.error("Could not initialize polygon drawing:", error);
      }
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (sketchHandle) {
        sketchHandle.remove();
      }

      if (sketch) {
        sketch.destroy();
      }

      if (graphicsLayer && mapElement.view?.map) {
        mapElement.view.map.remove(graphicsLayer);
      }

      sketchRef.current = null;
    };
  }, []);

  // Start drawing a new work zone.
  const startDrawing = () => {
    const sketch = sketchRef.current;

    if (!sketch) {
      console.warn("Map drawing tools are not ready yet.");
      return;
    }

    sketch.cancel();
    sketch.layer.removeAll();

    if (callbackRef.current) {
      callbackRef.current(null);
    }

    sketch.create("polygon");
  };

  // Finish the current polygon.
  const finishDrawing = () => {
    const sketch = sketchRef.current;

    if (!sketch) return;

    if (sketch.state === "active") {
      sketch.complete();
    }
  };

  // Cancel drawing and clear the work zone.
  const cancelDrawing = () => {
    const sketch = sketchRef.current;

    if (!sketch) return;

    sketch.cancel();
    sketch.layer.removeAll();

    if (callbackRef.current) {
      callbackRef.current(null);
    }
  };

  // Allow buttons in ProjectLocationPage to control drawing.
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
  <arcgis-search slot="top-right" />
</arcgis-map>
    </div>
  );
});

export default MamarMap;