import { useEffect, useRef, useState } from "react";

import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine.js";
import * as webMercatorUtils from "@arcgis/core/geometry/support/webMercatorUtils.js";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-search";
import "@arcgis/map-components/components/arcgis-sketch";

const POLYGON_SYMBOL = {
  type: "simple-fill",
  color: [255, 204, 0, 0.35],
  outline: {
    color: [255, 180, 0],
    width: 2,
  },
};

// Turn a finished polygon into the data the page needs.
function describePolygon(polygon) {
  const center = polygon?.centroid;

  if (!center) return null;

  const area = Math.abs(
    geometryEngine.geodesicArea(polygon, "square-meters")
  );

  // Boundary points as [lon, lat], without the closing duplicate.
  const geographic = polygon.spatialReference?.isWebMercator
    ? webMercatorUtils.webMercatorToGeographic(polygon)
    : polygon;

  const ring = (geographic.rings?.[0] || []).map(([x, y]) => [
    Number(x.toFixed(6)),
    Number(y.toFixed(6)),
  ]);

  if (
    ring.length > 1 &&
    ring[0][0] === ring[ring.length - 1][0] &&
    ring[0][1] === ring[ring.length - 1][1]
  ) {
    ring.pop();
  }

  return {
    latitude: Number(center.latitude.toFixed(6)),
    longitude: Number(center.longitude.toFixed(6)),
    area: Number(area.toFixed(2)),
    polygon: polygon.toJSON(),
    workZone: ring,
  };
}

/*
 * Drawing uses Esri's own <arcgis-sketch> component.
 *
 * Props:
 *  - onLocationSelect(data | null): called when a polygon is finished or
 *    edited ({ latitude, longitude, area, polygon, workZone }) and with
 *    null when it is deleted or a new one is started.
 *  - latitude / longitude: moves the map to this point when they change.
 *  - workZone: array of [lon, lat] points, shown in readOnly mode.
 *  - readOnly: hides the sketch tools.
 *  - height: CSS height of the container (default "100%").
 */
function MamarMap({
  onLocationSelect,
  latitude = null,
  longitude = null,
  workZone = null,
  readOnly = false,
  height = "100%",
}) {
  const mapRef = useRef(null);
  const sketchRef = useRef(null);
  const layerRef = useRef(null);
  const callbackRef = useRef(onLocationSelect);

  const [ready, setReady] = useState(false);

  // Keep the latest callback without reinitializing the map.
  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  // Add the layer that holds the work zone once the map is ready.
  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) return;

    let cancelled = false;
    let graphicsLayer = null;

    mapElement
      .viewOnReady()
      .then(() => {
        if (cancelled) return;

        graphicsLayer = new GraphicsLayer({ title: "Project Work Zone" });
        mapElement.view.map.add(graphicsLayer);
        layerRef.current = graphicsLayer;

        setReady(true);
      })
      .catch((error) => {
        console.error("Could not initialize the map:", error);
      });

    return () => {
      cancelled = true;

      if (graphicsLayer && mapElement.view?.map) {
        mapElement.view.map.remove(graphicsLayer);
      }

      layerRef.current = null;
    };
  }, []);

  // Connect Esri's Sketch component to the layer and listen to its events.
  useEffect(() => {
    const sketch = sketchRef.current;
    const layer = layerRef.current;

    if (!ready || readOnly || !sketch || !layer) return;

    sketch.layer = layer;
    sketch.availableCreateTools = ["polygon"];
    sketch.creationMode = "single";

    const handleCreate = (event) => {
      const { state, graphic } = event.detail || {};

      // Keep a single work zone: clear the old one when a new one starts.
      if (state === "start") {
        layer.graphics.forEach((existing) => {
          if (existing !== graphic) layer.remove(existing);
        });

        if (callbackRef.current) callbackRef.current(null);
        return;
      }

      if (state !== "complete") return;

      const data = describePolygon(graphic?.geometry);

      if (data && callbackRef.current) callbackRef.current(data);
    };

    const handleUpdate = (event) => {
      const { state, graphics } = event.detail || {};

      if (state !== "complete") return;

      const data = describePolygon(graphics?.[0]?.geometry);

      if (data && callbackRef.current) callbackRef.current(data);
    };

    const handleDelete = () => {
      if (callbackRef.current) callbackRef.current(null);
    };

    sketch.addEventListener("arcgisCreate", handleCreate);
    sketch.addEventListener("arcgisUpdate", handleUpdate);
    sketch.addEventListener("arcgisDelete", handleDelete);

    return () => {
      sketch.removeEventListener("arcgisCreate", handleCreate);
      sketch.removeEventListener("arcgisUpdate", handleUpdate);
      sketch.removeEventListener("arcgisDelete", handleDelete);
    };
  }, [ready, readOnly]);

  const zoneKey = JSON.stringify(workZone || []);
  const hasReadOnlyZone =
    readOnly && Array.isArray(workZone) && workZone.length >= 3;

  // Move the map to the searched location.
  useEffect(() => {
    const mapElement = mapRef.current;

    if (
      !mapElement ||
      hasReadOnlyZone ||
      !Number.isFinite(latitude) ||
      !Number.isFinite(longitude)
    ) {
      return;
    }

    let cancelled = false;

    mapElement
      .viewOnReady()
      .then(() => {
        if (cancelled) return;

        return mapElement.view.goTo({
          center: [longitude, latitude],
          zoom: 15,
        });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [latitude, longitude, hasReadOnlyZone]);

  // Read-only mode: show a saved work zone.
  useEffect(() => {
    const layer = layerRef.current;
    const mapElement = mapRef.current;

    if (!ready || !layer || !hasReadOnlyZone) return;

    layer.removeAll();

    const graphic = new Graphic({
      geometry: new Polygon({
        rings: [[...workZone, workZone[0]]],
        spatialReference: { wkid: 4326 },
      }),
      symbol: POLYGON_SYMBOL,
    });

    layer.add(graphic);

    mapElement?.view?.goTo(graphic).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, zoneKey, hasReadOnlyZone]);

  return (
    <div className="mamar-map-container" style={{ height }}>
      <arcgis-map
        ref={mapRef}
        item-id="7371729f1ff240038c3a8155edebfeda"
        className="mamar-map"
      >
        <arcgis-zoom slot="top-left" />
        <arcgis-search slot="top-right" />
        {!readOnly && <arcgis-sketch ref={sketchRef} slot="top-right" />}
      </arcgis-map>
    </div>
  );
}

export default MamarMap;
