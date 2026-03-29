import { useLayoutEffect, useRef, useState, useEffect } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { motion } from "framer-motion";

const RotatingGlobe = () => {
  const [mounted, setMounted] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Priority: Give immediate bandwidth to text & layouts, then mount heavy logic
    const timer = setTimeout(() => {
        setMounted(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  useLayoutEffect(() => {
    if (!mounted || !chartRef.current) return;
    
    // Create root element
    const root = am5.Root.new(chartRef.current);

    // Set themes
    root.setThemes([am5themes_Animated.new(root)]);

    // Create the map chart
    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "rotateY",
        projection: am5map.geoOrthographic(),
        paddingBottom: 20,
        paddingTop: 20,
        paddingLeft: 20,
        paddingRight: 20,
        wheelX: "zoom",
        wheelY: "zoom",
        pinchZoom: true
      })
    );

    // Ocean background
    const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: am5.color(0x3B82F6),
      fillOpacity: 0.05,
      strokeOpacity: 0
    });
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    // Graticule grid
    const graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      strokeOpacity: 0.1,
      stroke: am5.color(0x3B82F6)
    });

    // Country polygons
    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow
      })
    );

    polygonSeries.mapPolygons.template.setAll({
      fill: am5.color(0x3B82F6),
      fillOpacity: 0.8,
      stroke: am5.color(0xffffff),
      strokeWidth: 0.5,
      tooltipText: "{name}",
      interactive: true
    });

    polygonSeries.mapPolygons.template.states.create("hover", {
      fill: am5.color(0x2563EB),
      fillOpacity: 1
    });

    // 📍 LOCATION NODES (Cities) - Simplified
    const cities = [
      { id: "india", title: "India", latitude: 20.5937, longitude: 78.9629 },
      { id: "usa", title: "United States", latitude: 37.0902, longitude: -95.7129 },
      { id: "uk", title: "United Kingdom", latitude: 55.3781, longitude: -3.436 },
      { id: "brazil", title: "Brazil", latitude: -14.235, longitude: -51.9253 }
    ];

    const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push(() => {
      const cityContainer = am5.Container.new(root, {});
      
      cityContainer.children.push(am5.Circle.new(root, {
        radius: 3,
        fill: am5.color(0xffffff),
        stroke: am5.color(0x3B82F6),
        strokeWidth: 1.5,
        tooltipText: "{title}"
      }));

      // Simplified glow (no heavy looping animation)
      const glow = cityContainer.children.push(am5.Circle.new(root, {
        radius: 6,
        fill: am5.color(0x3B82F6),
        opacity: 0.3,
        strokeWidth: 0
      }));

      return am5.Bullet.new(root, { sprite: cityContainer });
    });

    pointSeries.data.setAll(cities);

    // ⚡ CONNECTIVITY LINES - Simple & Smooth
    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    lineSeries.mapLines.template.setAll({
      stroke: am5.color(0xffffff),
      strokeOpacity: 0.4,
      strokeWidth: 1,
      strokeDasharray: [2, 2]
    });

    const connections = [
      { from: "india", to: "usa" },
      { from: "usa", to: "uk" },
      { from: "brazil", to: "usa" }
    ];

    const lineData = connections.map(conn => {
       const from = cities.find(c => c.id === conn.from)!;
       const to = cities.find(c => c.id === conn.to)!;
       return {
         geometry: {
           type: "LineString",
           coordinates: [
             [from.longitude, from.latitude],
             [to.longitude, to.latitude]
           ]
         }
       };
    });

    lineSeries.data.setAll(lineData);

    // 🚀 ULTRA-SMOOTH CONTINUOUS ROTATION
    const animation = chart.animate({
      key: "rotationX",
      from: 0,
      to: 360,
      duration: 25000, // Balanced speed for smoothness
      loops: Infinity,
      easing: am5.ease.linear
    });

    chart.seriesContainer.events.on("dragstart", () => animation.pause());
    chart.appear(2000, 500);

    return () => { root.dispose(); };
  }, [mounted]);

  return (
    <div className="relative w-full flex flex-col items-center lg:items-end justify-center py-0 min-h-[300px] md:min-h-[550px]">
      {/* Background Glow - Pinned Right */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full bg-primary/5 blur-[100px] pointer-events-none -z-10" />
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        className="w-full aspect-square max-w-[550px] cursor-grab active:cursor-grabbing z-0"
      >
        <div ref={chartRef} style={{ width: "100%", height: "100%" }}></div>
      </motion.div>
    </div>
  );
};

export default RotatingGlobe;
