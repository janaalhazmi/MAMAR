import { useEffect, useRef } from "react";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer.js";
import Graphic from "@arcgis/core/Graphic.js";
import Polygon from "@arcgis/core/geometry/Polygon.js";
import "@arcgis/map-components/components/arcgis-map";
import "@arcgis/map-components/components/arcgis-zoom";

const COLORS = { active: [34, 139, 74], draft: [245, 184, 0], completed: [90, 110, 160], cancelled: [180, 60, 50] };

// All projects with a location on one map of Riyadh, colored by status.
export default function AdminMap({ projects }) {
  const mapRef = useRef(null);
  const layerRef = useRef(null);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return undefined;
    let cancelled = false;
    element.viewOnReady().then(() => {
      if (cancelled) return;
      const layer = new GraphicsLayer({ title: "Work zones" });
      element.view.map.add(layer);
      layerRef.current = layer;
      element.view.goTo({ center: [46.6753, 24.7136], zoom: 10 }, { animate: false }).catch(() => {});
      draw(layer, projects);
    });
    return () => { cancelled = true; };
    // The map is built once; the projects are drawn by the next effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (layerRef.current) draw(layerRef.current, projects);
  }, [projects]);

  return (
    <div className="admin-map">
      <arcgis-map ref={mapRef} item-id="7371729f1ff240038c3a8155edebfeda" className="mamar-map">
        <arcgis-zoom slot="top-left" />
      </arcgis-map>
    </div>
  );
}

function draw(layer, projects) {
  layer.removeAll();
  projects.forEach((project) => {
    const color = COLORS[project.project_status] || COLORS.draft;
    const popupTemplate = {
      title: project.project_name,
      content: `${project.location || ""}<br>Status: ${project.project_status} · Site: ${project.site_status}<br>Contractor: ${project.contractor || "-"}<br>Provider: ${project.provider || "-"}`,
    };
    layer.add(new Graphic({
      geometry: { type: "point", longitude: project.longitude, latitude: project.latitude },
      symbol: { type: "simple-marker", color, size: 12, outline: { color: [255, 255, 255], width: 2 } },
      popupTemplate,
    }));
    const rings = project.work_zone?.polygon?.rings || project.work_zone?.rings;
    if (rings) {
      try {
        layer.add(new Graphic({
          geometry: Polygon.fromJSON({ rings, spatialReference: { wkid: 4326 } }),
          symbol: { type: "simple-fill", color: [...color, 0.25], outline: { color, width: 2 } },
          popupTemplate,
        }));
      } catch {
        // A work zone saved in another format is shown as the point only.
      }
    }
  });
}
