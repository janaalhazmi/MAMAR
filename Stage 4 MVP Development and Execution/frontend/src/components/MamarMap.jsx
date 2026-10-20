import { useEffect, useRef, useState } from "react";

import Graphic from "@arcgis/core/Graphic.js";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";
import "@arcgis/map-components/components/arcgis-sketch";

function MamarMap({
  onLocationSelect,
  onPolygonSelect,
  latitude = null,
  longitude = null,
  readOnly = false,
<<<<<<< HEAD
  height = "100%",
  workZone = null,
  projectPoints = null,
=======
  enablePolygon = false,
>>>>>>> a23cbe8 (Update provider projects and project details)
}) {
  const mapRef = useRef(null);
  const sketchRef = useRef(null);
  const markerRef = useRef(null);
<<<<<<< HEAD
  const drawingGraphicsRef = useRef([]);
  const callbackRef = useRef(onLocationSelect);
  const areaCallbackRef = useRef(onAreaSelect);
  const drawModeRef = useRef(false);
  const drawingPointsRef = useRef([]);
  const workZoneRef = useRef(workZone);
  const projectPointsRef = useRef(projectPoints);
  const savedZoneRef = useRef(null);
  const projectGraphicsRef = useRef([]);
=======
  const workZoneLayerRef = useRef(null);
  const currentPolygonRef = useRef(null);
>>>>>>> a23cbe8 (Update provider projects and project details)

  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);
  const committedGeometryRef = useRef(null);

  const locationCallbackRef = useRef(onLocationSelect);
  const polygonCallbackRef = useRef(onPolygonSelect);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [canDelete, setCanDelete] = useState(false);

  useEffect(() => {
    locationCallbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    polygonCallbackRef.current = onPolygonSelect;
  }, [onPolygonSelect]);

  const updateButtons = () => {
    setCanUndo(undoStackRef.current.length > 0);
    setCanRedo(redoStackRef.current.length > 0);
    setCanDelete(currentPolygonRef.current !== null);
  };

  const sendPolygon = (geometry) => {
    if (!geometry || !polygonCallbackRef.current) return;

    polygonCallbackRef.current({
      rings: geometry.rings,
      spatialReference:
        geometry.spatialReference?.toJSON?.() ??
        geometry.spatialReference,
    });
  };

  const restoreGeometry = (geometry) => {
    const layer = workZoneLayerRef.current;

    if (!layer || !geometry) return;

    if (currentPolygonRef.current) {
      currentPolygonRef.current.geometry = geometry.clone();
    } else {
      const graphic = new Graphic({
        geometry: geometry.clone(),
        symbol: {
          type: "simple-fill",
          color: [255, 204, 0, 0.25],
          outline: {
            color: [255, 204, 0, 1],
            width: 3,
          },
        },
      });

      layer.add(graphic);
      currentPolygonRef.current = graphic;
    }

    committedGeometryRef.current = geometry.clone();
    sendPolygon(geometry);
  };

  const handleCustomUndo = () => {
    const previous = undoStackRef.current.pop();

    if (!previous) return;

    if (committedGeometryRef.current) {
      redoStackRef.current.push(
        committedGeometryRef.current.clone()
      );
    } else {
      redoStackRef.current.push(null);
    }

    if (previous === null) {
      if (currentPolygonRef.current) {
        workZoneLayerRef.current?.remove(
          currentPolygonRef.current
        );
      }

      currentPolygonRef.current = null;
      committedGeometryRef.current = null;
    } else {
      restoreGeometry(previous);
    }

    updateButtons();
  };

  const handleCustomRedo = () => {
    const next = redoStackRef.current.pop();

    if (next === undefined) return;

    undoStackRef.current.push(
      committedGeometryRef.current
        ? committedGeometryRef.current.clone()
        : null
    );

    if (next === null) {
      if (currentPolygonRef.current) {
        workZoneLayerRef.current?.remove(
          currentPolygonRef.current
        );
      }

      currentPolygonRef.current = null;
      committedGeometryRef.current = null;
    } else {
      restoreGeometry(next);
    }

    updateButtons();
  };

  const handleDeletePolygon = () => {
    if (!currentPolygonRef.current) return;

    undoStackRef.current.push(
      committedGeometryRef.current
        ? committedGeometryRef.current.clone()
        : null
    );

    redoStackRef.current = [];

    workZoneLayerRef.current?.remove(
      currentPolygonRef.current
    );

    currentPolygonRef.current = null;
    committedGeometryRef.current = null;

    updateButtons();
  };

  useEffect(() => {
    workZoneRef.current = workZone;
  }, [workZone]);

  useEffect(() => {
    projectPointsRef.current = projectPoints;
  }, [projectPoints]);

  useEffect(() => {
    const mapElement = mapRef.current;
    const sketchElement = sketchRef.current;

    if (!mapElement) return;

    let clickHandler = null;
    let createHandler = null;
    let updateHandler = null;
    let cancelled = false;

    async function setupMap() {
      try {
        await mapElement.viewOnReady();

        if (cancelled) return;

        const view = mapElement.view;

        if (
          latitude !== null &&
          longitude !== null &&
          !Number.isNaN(Number(latitude)) &&
          !Number.isNaN(Number(longitude))
        ) {
          const existingMarker = view.graphics.add({
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
          });

          markerRef.current = existingMarker;

          await view.goTo({
            center: [
              Number(longitude),
              Number(latitude),
            ],
            zoom: 15,
          });
        }

<<<<<<< HEAD
        // Saved work zone (Review / Services maps) and project points (dashboard)
        await renderSavedZone(view);
        await renderProjectPoints(view);

        if (cancelled || readOnly) return;

        clickHandler = view.on("click", (event) => {
          const point = view.toMap({
            x: event.x,
            y: event.y,
=======
        if (enablePolygon && sketchElement) {
          const workZoneLayer = new GraphicsLayer({
            title: "MAMAR Work Zone",
>>>>>>> a23cbe8 (Update provider projects and project details)
          });

          workZoneLayerRef.current = workZoneLayer;
          view.map.add(workZoneLayer);

          await sketchElement.componentOnReady();

          sketchElement.view = view;
          sketchElement.layer = workZoneLayer;
          sketchElement.availableCreateTools = ["polygon"];
          sketchElement.creationMode = "update";

          sketchElement.polygonSymbol = {
            type: "simple-fill",
            color: [255, 204, 0, 0.25],
            outline: {
              color: [255, 204, 0, 1],
              width: 3,
            },
          };

          sketchElement.defaultUpdateOptions = {
            tool: "reshape",
            enableRotation: false,
            enableScaling: true,
            multipleSelectionEnabled: false,
          };

          createHandler = (event) => {
            const detail = event.detail;

            if (
              detail?.state !== "complete" ||
              !detail?.graphic ||
              detail.graphic.geometry?.type !== "polygon"
            ) {
              return;
            }

            if (
              currentPolygonRef.current &&
              currentPolygonRef.current !== detail.graphic
            ) {
              workZoneLayer.remove(
                currentPolygonRef.current
              );
            }

            undoStackRef.current.push(
              committedGeometryRef.current
                ? committedGeometryRef.current.clone()
                : null
            );

            redoStackRef.current = [];

            currentPolygonRef.current = detail.graphic;
            committedGeometryRef.current =
              detail.graphic.geometry.clone();

            sendPolygon(detail.graphic.geometry);
            updateButtons();
          };

          updateHandler = (event) => {
            const detail = event.detail;

            if (
              detail?.state !== "complete" ||
              !detail?.graphics?.length
            ) {
              return;
            }

            const graphic = detail.graphics[0];

            if (graphic.geometry?.type !== "polygon") {
              return;
            }

            if (committedGeometryRef.current) {
              undoStackRef.current.push(
                committedGeometryRef.current.clone()
              );
            }

            redoStackRef.current = [];

            currentPolygonRef.current = graphic;
            committedGeometryRef.current =
              graphic.geometry.clone();

            sendPolygon(graphic.geometry);
            updateButtons();
          };

          sketchElement.addEventListener(
            "arcgisCreate",
            createHandler
          );

          sketchElement.addEventListener(
            "arcgisUpdate",
            updateHandler
          );
        }

        if (!readOnly) {
          clickHandler = view.on("click", (event) => {
            if (
              enablePolygon &&
              sketchElement?.activeTool
            ) {
              return;
            }

            const point = view.toMap({
              x: event.x,
              y: event.y,
            });

            if (!point) return;

            const selectedLatitude = Number(
              point.latitude.toFixed(6)
            );

            const selectedLongitude = Number(
              point.longitude.toFixed(6)
            );

            if (markerRef.current) {
              view.graphics.remove(markerRef.current);
            }

            const marker = view.graphics.add({
              geometry: point,
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

            markerRef.current = marker;

            if (locationCallbackRef.current) {
              locationCallbackRef.current({
                latitude: selectedLatitude,
                longitude: selectedLongitude,
              });
            }
          });
        }
      } catch (error) {
        console.error(
          "Could not initialize MAMAR map:",
          error
        );
      }
    }

    setupMap();

    return () => {
      cancelled = true;

      clickHandler?.remove();

      if (sketchElement && createHandler) {
        sketchElement.removeEventListener(
          "arcgisCreate",
          createHandler
        );
      }

      if (sketchElement && updateHandler) {
        sketchElement.removeEventListener(
          "arcgisUpdate",
          updateHandler
        );
      }

      const layer = workZoneLayerRef.current;

      if (layer && mapElement.view?.map) {
        mapElement.view.map.remove(layer);
      }

      workZoneLayerRef.current = null;
    };
<<<<<<< HEAD

    view.graphics.add(marker);
    markerRef.current = marker;
  }, [latitude, longitude]);

  // Redraw when the saved zone / project points change after the map is ready
  const workZoneKey = JSON.stringify(workZone ?? null);
  const projectPointsKey = JSON.stringify(projectPoints ?? null);

  useEffect(() => {
    const view = viewRef.current;

    if (view) renderSavedZone(view);
  }, [workZoneKey]);

  useEffect(() => {
    const view = viewRef.current;

    if (view) renderProjectPoints(view);
  }, [projectPointsKey]);

  function isValidPoint(point) {
    return (
      point &&
      Number.isFinite(Number(point.latitude)) &&
      Number.isFinite(Number(point.longitude))
    );
  }

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

    view.graphics.add({
      geometry: {
        type: "polygon",
        rings: [ring],
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

    // view.graphics autocasts plain objects, so keep the stored instance
    const graphic = view.graphics.getItemAt(view.graphics.length - 1);

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

      view.graphics.add({
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

      const marker = view.graphics.getItemAt(view.graphics.length - 1);

      markers.push(marker);
      projectGraphicsRef.current.push(marker);

      if (point.name) {
        view.graphics.add({
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

        projectGraphicsRef.current.push(
          view.graphics.getItemAt(view.graphics.length - 1)
        );
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
=======
  }, [
    latitude,
    longitude,
    readOnly,
    enablePolygon,
  ]);
>>>>>>> a23cbe8 (Update provider projects and project details)

  return (
    <div className="mamar-map-container">
      {enablePolygon && !readOnly && (
        <div className="work-zone-history-tools">
          <button
            type="button"
            onClick={handleCustomUndo}
            disabled={!canUndo}
            title="Undo"
          >
            ↶
          </button>

          <button
            type="button"
            onClick={handleCustomRedo}
            disabled={!canRedo}
            title="Redo"
          >
            ↷
          </button>

          <button
            type="button"
            onClick={handleDeletePolygon}
            disabled={!canDelete}
            title="Delete Work Zone"
          >
            ✕
          </button>
        </div>
      )}

      <arcgis-map
        ref={mapRef}
        item-id="7371729f1ff240038c3a8155edebfeda"
        className="mamar-map"
      >
        <arcgis-zoom slot="top-left" />

        {enablePolygon && !readOnly && (
          <arcgis-sketch
            ref={sketchRef}
            slot="top-right"
            creation-mode="update"
            hide-delete-button
            hide-duplicate-button
            hide-undo-redo-menu
            hide-selection-tools-lasso-selection
            hide-selection-tools-rectangle-selection
            hide-settings-menu
            hide-snapping-controls
            hide-labels-toggle
            hide-selection-count-label
            hide-tooltips-toggle
          />
        )}
      </arcgis-map>
    </div>
  );
}

export default MamarMap;
