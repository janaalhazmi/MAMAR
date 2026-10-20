import { useEffect, useRef, useState } from "react";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";

function MamarMap({
  onLocationSelect,
  onAreaSelect,
  latitude = null,
  longitude = null,
  readOnly = false,
  height = "100%",
}) {
  const mapRef = useRef(null);
  const viewRef = useRef(null);
  const markerRef = useRef(null);
  const drawingGraphicsRef = useRef([]);
  const callbackRef = useRef(onLocationSelect);
  const areaCallbackRef = useRef(onAreaSelect);
  const drawModeRef = useRef(false);
  const drawingPointsRef = useRef([]);

  const [drawMode, setDrawMode] = useState(false);
  const [drawingPoints, setDrawingPoints] = useState([]);
  const [hasArea, setHasArea] = useState(false);

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
    const mapElement = mapRef.current;

    if (!mapElement) return;

    let clickHandler;
    let cancelled = false;

    async function initializeMap() {
      try {
        await mapElement.viewOnReady();

        if (cancelled) return;

        const view = mapElement.view;
        viewRef.current = view;

        if (
          latitude !== null &&
          longitude !== null &&
          Number.isFinite(Number(latitude)) &&
          Number.isFinite(Number(longitude))
        ) {
          const marker = {
            geometry: {
              type: "point",
              latitude: Number(latitude),
              longitude: Number(longitude),
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
          };

          view.graphics.add(marker);
          markerRef.current = marker;

          await view.goTo({
            center: [Number(longitude), Number(latitude)],
            zoom: 15,
          });
        }

        if (cancelled || readOnly) return;

        clickHandler = view.on("click", (event) => {
          const point = view.toMap({
            x: event.x,
            y: event.y,
          });

          if (!point) return;

          const selectedPoint = {
            latitude: Number(point.latitude.toFixed(6)),
            longitude: Number(point.longitude.toFixed(6)),
          };

          if (drawModeRef.current) {
            const updatedPoints = [
              ...drawingPointsRef.current,
              selectedPoint,
            ];

            drawingPointsRef.current = updatedPoints;
            setDrawingPoints(updatedPoints);

            renderDrawing(view, updatedPoints);

            return;
          }

          if (markerRef.current) {
            view.graphics.remove(markerRef.current);
          }

          const marker = {
            geometry: {
              type: "point",
              latitude: selectedPoint.latitude,
              longitude: selectedPoint.longitude,
              spatialReference: point.spatialReference,
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
          };

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

      if (clickHandler) {
        clickHandler.remove();
      }

      viewRef.current = null;
    };
  }, []);

  useEffect(() => {
    const view = viewRef.current;

    if (
      !view ||
      latitude === null ||
      longitude === null ||
      !Number.isFinite(Number(latitude)) ||
      !Number.isFinite(Number(longitude))
    ) {
      return;
    }

    view.goTo({
      center: [Number(longitude), Number(latitude)],
      zoom: 15,
    }).catch((error) => {
      if (error.name !== "AbortError") {
        console.error("Could not move map:", error);
      }
    });

    if (markerRef.current) {
      view.graphics.remove(markerRef.current);
    }

    const marker = {
      geometry: {
        type: "point",
        latitude: Number(latitude),
        longitude: Number(longitude),
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
    };

    view.graphics.add(marker);
    markerRef.current = marker;
  }, [latitude, longitude]);

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
      graphics.push({
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
      });
    });

    if (points.length >= 2) {
      graphics.push({
        geometry: {
          type: "polyline",
          paths: [
            points.map((point) => [
              point.longitude,
              point.latitude,
            ]),
          ],
          spatialReference: { wkid: 4326 },
        },
        symbol: {
          type: "simple-line",
          color: "#ffcc00",
          width: 3,
        },
      });
    }

    if (points.length >= 3) {
      graphics.push({
        geometry: {
          type: "polygon",
          rings: [
            [
              ...points.map((point) => [
                point.longitude,
                point.latitude,
              ]),
              [
                points[0].longitude,
                points[0].latitude,
              ],
            ],
          ],
          spatialReference: { wkid: 4326 },
        },
        symbol: {
          type: "simple-fill",
          color: [255, 204, 0, 45],
          outline: {
            color: "#ffcc00",
            width: 2,
          },
        },
      });
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
              <span className="mamar-map-drawing-hint">
                Work zone saved
              </span>

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
      </arcgis-map>
    </div>
  );
}

export default MamarMap;