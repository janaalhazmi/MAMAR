import { useEffect, useRef, useState } from "react";

import Graphic from "@arcgis/core/Graphic.js";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-search";

function isValidPoint(point) {
  return (
    point &&
    Number.isFinite(Number(point.latitude)) &&
    Number.isFinite(Number(point.longitude))
  );
}

function createMarker(latitude, longitude, spatialReference) {
  return new Graphic({
    geometry: {
      type: "point",
      latitude: Number(latitude),
      longitude: Number(longitude),
      ...(spatialReference ? { spatialReference } : {}),
    },
    symbol: {
      type: "simple-marker",
      style: "circle",
      color: "#ffcc00",
      size: "16px",
      outline: {
        color: "#222222",
        width: 2,
      },
    },
  });
}

function MamarMap({
  onLocationSelect,
  onAreaSelect,
  latitude = null,
  longitude = null,
  readOnly = false,
  height = "100%",
  workZone = null,
  projectPoints = null,
}) {
  const mapRef = useRef(null);
  const viewRef = useRef(null);

  const markerRef = useRef(null);
  const drawingGraphicsRef = useRef([]);
  const callbackRef = useRef(onLocationSelect);
  const areaCallbackRef = useRef(onAreaSelect);
  const drawModeRef = useRef(false);
  const drawingPointsRef = useRef([]);
  const workZoneRef = useRef(workZone);
  const projectPointsRef = useRef(projectPoints);
  const savedZoneRef = useRef(null);
  const projectGraphicsRef = useRef([]);

  const [drawMode, setDrawMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [hasArea, setHasArea] = useState(false);

  // Keep the latest values in refs without reinitializing the map.
  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    areaCallbackRef.current = onAreaSelect;
  }, [onAreaSelect]);

  useEffect(() => {
    drawModeRef.current = drawMode;
  }, [drawMode]);

  useEffect(() => {
    workZoneRef.current = workZone;
  }, [workZone]);

  useEffect(() => {
    projectPointsRef.current = projectPoints;
  }, [projectPoints]);

  // Initialize the map once.
  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) return;

    let clickHandle = null;
    let cancelled = false;

    async function initializeMap() {
      try {
        await mapElement.viewOnReady();

        if (cancelled) return;

        const view = mapElement.view;
        viewRef.current = view;

        if (isValidPoint({ latitude, longitude })) {
          const marker = createMarker(latitude, longitude);

          view.graphics.add(marker);
          markerRef.current = marker;

          await view.goTo({
            center: [Number(longitude), Number(latitude)],
            zoom: 15,
          });
        }

        // Saved work zone (Review / Services maps) and project points (dashboard)
        await renderSavedZone(view);
        await renderProjectPoints(view);

        if (cancelled || readOnly) return;

        clickHandle = view.on("click", (event) => {
          const point = event.mapPoint;

          if (!point) return;

          const selectedPoint = {
            latitude: Number(point.latitude.toFixed(6)),
            longitude: Number(point.longitude.toFixed(6)),
          };

          // Drawing a work zone: every click adds a boundary point.
          if (drawModeRef.current) {
            const updatedPoints = [...drawingPointsRef.current, selectedPoint];

            drawingPointsRef.current = updatedPoints;
            setDrawingPoints(updatedPoints);

            renderDrawing(view, updatedPoints);

            return;
          }

          // Otherwise: pick a single project location.
          if (markerRef.current) {
            view.graphics.remove(markerRef.current);
          }

          const marker = createMarker(
            selectedPoint.latitude,
            selectedPoint.longitude,
            point.spatialReference
          );

          view.graphics.add(marker);
          markerRef.current = marker;

          if (callbackRef.current) {
            callbackRef.current(selectedPoint);
          }
        });
      } catch (error) {
        console.error("Could not initialize MAMAR map:", error);
      }
    }

    initializeMap();

    return () => {
      cancelled = true;

      if (clickHandle) {
        clickHandle.remove();
      }

      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Move the marker when latitude / longitude props change.
  useEffect(() => {
    const view = viewRef.current;

    if (!view || !isValidPoint({ latitude, longitude })) return;

    view
      .goTo({
        center: [Number(longitude), Number(latitude)],
        zoom: 15,
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          console.error("Could not move map:", error);
        }
      });

    if (markerRef.current) {
      view.graphics.remove(markerRef.current);
    }

    const marker = createMarker(latitude, longitude);

    view.graphics.add(marker);
    markerRef.current = marker;
  }, [latitude, longitude]);

  // Redraw when the saved zone / project points change after the map is ready.
  const workZoneKey = JSON.stringify(workZone ?? null);
  const projectPointsKey = JSON.stringify(projectPoints ?? null);

  useEffect(() => {
    const view = viewRef.current;

    if (view) renderSavedZone(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workZoneKey]);

  useEffect(() => {
    const view = viewRef.current;

    if (view) renderProjectPoints(view);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectPointsKey]);

  // Shows a previously drawn work zone (read-only display, no editing).
  async function renderSavedZone(view) {
    if (savedZoneRef.current) {
      view.graphics.remove(savedZoneRef.current);
      savedZoneRef.current = null;
    }

    const zone = workZoneRef.current;

    if (!Array.isArray(zone) || zone.length < 3 || !zone.every(isValidPoint)) {
      return;
    }

    const ring = zone.map((point) => [
      Number(point.longitude),
      Number(point.latitude),
    ]);

    ring.push(ring[0]);

    const graphic = new Graphic({
      geometry: {
        type: "polygon",
        rings: [ring],
        spatialReference: { wkid: 4326 },
      },
      symbol: {
        type: "simple-fill",
        color: [255, 204, 0, 0.18],
        outline: {
          color: "#ffcc00",
          width: 2,
        },
      },
    });

    view.graphics.add(graphic);
    savedZoneRef.current = graphic;

    try {
      await view.goTo(graphic.geometry.extent.clone().expand(1.8));
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Could not zoom to work zone:", error);
      }
    }
  }

  // Shows one labelled marker per project (dashboard map).
  async function renderProjectPoints(view) {
    projectGraphicsRef.current.forEach((graphic) => {
      view.graphics.remove(graphic);
    });

    projectGraphicsRef.current = [];

    const points = (projectPointsRef.current || []).filter(isValidPoint);

    if (points.length === 0) return;

    const markers = [];

    points.forEach((point) => {
      const geometry = {
        type: "point",
        latitude: Number(point.latitude),
        longitude: Number(point.longitude),
      };

      const marker = new Graphic({
        geometry,
        symbol: {
          type: "simple-marker",
          style: "circle",
          color: point.color || "#f2b01e",
          size: "14px",
          outline: {
            color: "#ffffff",
            width: 2,
          },
        },
        popupTemplate: {
          title: point.name || "Project",
          content: [point.status, point.location].filter(Boolean).join(" · "),
        },
      });

      view.graphics.add(marker);
      markers.push(marker);
      projectGraphicsRef.current.push(marker);

      if (point.name) {
        const label = new Graphic({
          geometry,
          symbol: {
            type: "text",
            text: point.name,
            color: "#111827",
            haloColor: "#ffffff",
            haloSize: "2px",
            verticalAlignment: "bottom",
            yoffset: 10,
            font: {
              size: 11,
              weight: "bold",
            },
          },
        });

        view.graphics.add(label);
        projectGraphicsRef.current.push(label);
      }
    });

    try {
      await view.goTo(
        markers.length === 1 ? { target: markers[0], zoom: 14 } : markers
      );

      if (markers.length > 1) {
        view.scale = view.scale * 1.4;
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Could not zoom to project points:", error);
      }
    }
  }

  function clearDrawingGraphics(view) {
    drawingGraphicsRef.current.forEach((graphic) => {
      view.graphics.remove(graphic);
    });

    drawingGraphicsRef.current = [];
  }

  function renderDrawing(view, points) {
    clearDrawingGraphics(view);

    const graphics = [];

    points.forEach((point) => {
      graphics.push(
        new Graphic({
          geometry: {
            type: "point",
            latitude: point.latitude,
            longitude: point.longitude,
          },
          symbol: {
            type: "simple-marker",
            color: "#ffcc00",
            size: "8px",
            outline: {
              color: "#222222",
              width: 1,
            },
          },
        })
      );
    });

    if (points.length >= 2) {
      graphics.push(
        new Graphic({
          geometry: {
            type: "polyline",
            paths: [points.map((p) => [p.longitude, p.latitude])],
            spatialReference: { wkid: 4326 },
          },
          symbol: {
            type: "simple-line",
            color: "#ffcc00",
            width: 3,
          },
        })
      );
    }

    if (points.length >= 3) {
      graphics.push(
        new Graphic({
          geometry: {
            type: "polygon",
            rings: [
              [
                ...points.map((p) => [p.longitude, p.latitude]),
                [points[0].longitude, points[0].latitude],
              ],
            ],
            spatialReference: { wkid: 4326 },
          },
          symbol: {
            type: "simple-fill",
            color: [255, 204, 0, 0.18],
            outline: {
              color: "#ffcc00",
              width: 2,
            },
          },
        })
      );
    }

    graphics.forEach((graphic) => {
      view.graphics.add(graphic);
      drawingGraphicsRef.current.push(graphic);
    });
  }

  function startDrawing() {
    const view = viewRef.current;

    if (!view) return;

    clearDrawingGraphics(view);

    drawingPointsRef.current = [];
    setDrawingPoints([]);
    setHasArea(false);
    setDrawMode(true);

    if (areaCallbackRef.current) {
      areaCallbackRef.current([]);
    }
  }

  function finishDrawing() {
    const view = viewRef.current;
    const points = drawingPointsRef.current;

    if (!view || points.length < 3) return;

    renderDrawing(view, points);

    const area = points.map((point) => ({
      latitude: point.latitude,
      longitude: point.longitude,
    }));

    setDrawMode(false);
    setHasArea(true);

    if (areaCallbackRef.current) {
      areaCallbackRef.current(area);
    }
  }

  function clearDrawing() {
    const view = viewRef.current;

    if (view) {
      clearDrawingGraphics(view);
    }

    drawingPointsRef.current = [];
    setDrawingPoints([]);
    setHasArea(false);
    setDrawMode(false);

    if (areaCallbackRef.current) {
      areaCallbackRef.current([]);
    }
  }

  return (
    <div
      className="mamar-map-container"
      style={{
        width: "100%",
        height,
        position: "relative",
      }}
    >
      {!readOnly && (
        <div className="mamar-map-tools">
          {!drawMode && !hasArea && (
            <button
              type="button"
              className="mamar-map-tool-button"
              onClick={startDrawing}
            >
              Draw Work Zone
            </button>
          )}

          {drawMode && (
            <>
              <span className="mamar-map-drawing-hint">
                Click to add boundary points ({drawingPoints.length})
              </span>

              <button
                type="button"
                className="mamar-map-tool-button"
                onClick={finishDrawing}
                disabled={drawingPoints.length < 3}
              >
                Finish Drawing
              </button>

              <button
                type="button"
                className="mamar-map-tool-button secondary"
                onClick={clearDrawing}
              >
                Cancel
              </button>
            </>
          )}

          {hasArea && !drawMode && (
            <>
              <span className="mamar-map-drawing-hint">Work zone saved</span>

              <button
                type="button"
                className="mamar-map-tool-button"
                onClick={startDrawing}
              >
                Redraw Area
              </button>

              <button
                type="button"
                className="mamar-map-tool-button secondary"
                onClick={clearDrawing}
              >
                Clear Area
              </button>
            </>
          )}
        </div>
      )}

      <arcgis-map
        ref={mapRef}
        item-id="7371729f1ff240038c3a8155edebfeda"
        className="mamar-map"
        style={{ width: "100%", height: "100%" }}
      >
        <arcgis-zoom slot="top-left" />
        <arcgis-search slot="top-right" />
      </arcgis-map>
    </div>
  );
}

export default MamarMap;
