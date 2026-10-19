import { useEffect, useRef } from "react";

import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";

function MamarMap({
  onLocationSelect,
  latitude = null,
  longitude = null,
  readOnly = false,
}) {
  const mapRef = useRef(null);
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

        // NEW: show a previously selected point (used on the Services page).
        if (
          latitude !== null &&
          longitude !== null &&
          !Number.isNaN(Number(latitude)) &&
          !Number.isNaN(Number(longitude))
        ) {
          view.graphics.add({
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

          view.goTo({
            center: [Number(longitude), Number(latitude)],
            zoom: 15,
          });
        }

        // NEW: in read-only mode the user cannot place a point.
        if (readOnly) return;

        clickHandler = view.on("click", (event) => {
          const point = view.toMap({
            x: event.x,
            y: event.y,
          });

          if (!point) return;

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

  return (
    <div className="mamar-map-container">
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
