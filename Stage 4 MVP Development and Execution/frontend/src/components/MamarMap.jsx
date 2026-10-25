import { useEffect, useRef, useState } from "react";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";

function MamarMap({ onLocationSelect }) {
  const mapRef = useRef(null);
  const [drawing, setDrawing] = useState(false);
  const [points, setPoints] = useState([]);
  const pointsRef = useRef([]);
  const polygonRef = useRef(null);
  const drawingRef = useRef(false);
  const markerRef = useRef(null);
  const callbackRef = useRef(onLocationSelect);

  useEffect(() => {
    callbackRef.current = onLocationSelect;
  }, [onLocationSelect]);

  useEffect(() => {
    const mapElement = mapRef.current;

    if (!mapElement) return;

    let clickHandler;
    let cancelled = false;

    async function addPinFeature() {
      try {
        await mapElement.viewOnReady();

        if (cancelled) return;

        const view = mapElement.view;

        clickHandler = view.on("click", (event) => {
          const point = view.toMap({
            x: event.x,
            y: event.y,
          });

          if (!point) return;

          if (drawingRef.current) {
            pointsRef.current = [...pointsRef.current, point];
            setPoints([...pointsRef.current]);
            return;
          }

          const latitude = Number(point.latitude.toFixed(6));
          const longitude = Number(point.longitude.toFixed(6));

          if (markerRef.current) {
            view.graphics.remove(markerRef.current);
          }

          // Create a yellow pin without changing the original map.
          const marker = document.createElement("arcgis-graphic");

          marker.geometry = {
            type: "point",
            latitude,
            longitude,
            spatialReference: point.spatialReference,
          };

          marker.symbol = {
            type: "simple-marker",
            style: "circle",
            color: "#ffcc00",
            size: "16px",
            outline: {
              color: "#222222",
              width: 2,
            },
          };

          // Use the map's existing graphics collection.
          view.graphics.add({
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

          markerRef.current = view.graphics.getItemAt(
            view.graphics.length - 1
          );

          if (callbackRef.current) {
            callbackRef.current({
              latitude,
              longitude,
            });
          }
        });
      } catch (error) {
        console.error("Could not enable map pin:", error);
      }
    }

    addPinFeature();

    return () => {
      cancelled = true;

      if (clickHandler) {
        clickHandler.remove();
      }
    };
  }, []);

  const startDrawing = () => {
    const view = mapRef.current?.view;
    if (!view) return;
    if (markerRef.current) view.graphics.remove(markerRef.current);
    if (polygonRef.current) view.graphics.remove(polygonRef.current);
    pointsRef.current = [];
    setPoints([]);
    drawingRef.current = true;
    setDrawing(true);
  };

  const finishDrawing = async () => {
    const view = mapRef.current?.view;
    if (!view || pointsRef.current.length < 3) {
      alert("Select at least 3 points on the map.");
      return;
    }

    const { default: Polygon } = await import("@arcgis/core/geometry/Polygon.js");
    const { default: Graphic } = await import("@arcgis/core/Graphic.js");

    const polygon = new Polygon({
      rings: [pointsRef.current.map(p => [p.x, p.y])],
      spatialReference: view.spatialReference
    });

    const graphic = new Graphic({
      geometry: polygon,
      symbol: {
        type: "simple-fill",
        color: [255, 204, 0, 0.3],
        outline: { color: "#ff9900", width: 2 }
      }
    });

    view.graphics.add(graphic);
    polygonRef.current = graphic;
    drawingRef.current = false;
    setDrawing(false);

    const center = polygon.extent.center;
    callbackRef.current?.({
      latitude: Number(center.latitude.toFixed(6)),
      longitude: Number(center.longitude.toFixed(6)),
      polygon: polygon.toJSON()
    });
  };

  const cancelDrawing = () => {
    const view = mapRef.current?.view;
    if (polygonRef.current && view) view.graphics.remove(polygonRef.current);
    polygonRef.current = null;
    pointsRef.current = [];
    setPoints([]);
    drawingRef.current = false;
    setDrawing(false);
  };

  return (
    <div className="mamar-map-container">
      <div style={{display:"flex",gap:"10px",marginBottom:"10px",position:"relative",zIndex:10}}>
        <button type="button" onClick={startDrawing}>Draw Polygon</button>
        <button type="button" onClick={finishDrawing}>Finish Drawing</button>
        <button type="button" onClick={cancelDrawing}>Cancel</button>
        {drawing && <span>Points: {points.length}</span>}
      </div>
      <arcgis-map
        ref={mapRef}
        item-id="7371729f1ff240038c3a8155edebfeda"
        className="mamar-map"
      >
        <arcgis-zoom slot="top-left" />
      </arcgis-map>
    </div>
  );
}

export default MamarMap;