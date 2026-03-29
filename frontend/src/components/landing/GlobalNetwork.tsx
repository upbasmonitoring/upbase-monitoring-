import { useLayoutEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5map from "@amcharts/amcharts5/map";
import am5geodata_worldLow from "@amcharts/amcharts5-geodata/worldLow";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { motion } from "framer-motion";

const GlobalNetwork = () => {
  const chartRef = useRef<HTMLDivElement>(null);

  const stats = [
    { value: "500+", label: "Integrated Cloud services", x: "15%" },
    { value: "24/7", label: "Real-time threat detection", x: "38%" },
    { value: "99.9%", label: "Platform uptime guaranteed", x: "62%" },
    { value: "125+", label: "Global edge locations", x: "85%" },
  ];

  useLayoutEffect(() => {
    if (!chartRef.current) return;

    const isDark = document.documentElement.classList.contains('dark');
    const primaryColor = am5.color(0x0ea5e9); // primary blue
    const secondaryColor = am5.color(isDark ? 0x1e293b : 0xe2e8f0);
    const accentColor = am5.color(isDark ? 0xffffff : 0x000000);

    const root = am5.Root.new(chartRef.current);
    root.setThemes([am5themes_Animated.new(root)]);

    const chart = root.container.children.push(
      am5map.MapChart.new(root, {
        panX: "rotateX",
        panY: "rotateY",
        projection: am5map.geoOrthographic(),
        paddingBottom: 0,
        paddingTop: 0,
        paddingLeft: 0,
        paddingRight: 0,
        wheelX: "none",
        wheelY: "none",
      })
    );

    // Ocean / Sphere
    const backgroundSeries = chart.series.push(am5map.MapPolygonSeries.new(root, {}));
    backgroundSeries.mapPolygons.template.setAll({
      fill: primaryColor,
      fillOpacity: isDark ? 0.05 : 0.1,
      strokeOpacity: 0
    });
    backgroundSeries.data.push({
      geometry: am5map.getGeoRectangle(90, 180, -90, -180)
    });

    // Graticule (Grid)
    const graticuleSeries = chart.series.push(am5map.GraticuleSeries.new(root, {}));
    graticuleSeries.mapLines.template.setAll({
      stroke: primaryColor,
      strokeOpacity: 0.1,
      strokeWidth: 0.5
    });

    // Country Polygons
    const polygonSeries = chart.series.push(
      am5map.MapPolygonSeries.new(root, {
        geoJSON: am5geodata_worldLow
      })
    );
    polygonSeries.mapPolygons.template.setAll({
      fill: isDark ? am5.color(0x0f172a) : primaryColor,
      fillOpacity: isDark ? 0.8 : 1,
      stroke: isDark ? am5.color(0x1e293b) : am5.color(0xffffff),
      strokeWidth: 0.5,
      strokeOpacity: 0.5
    });

    // Points
    const pointSeries = chart.series.push(am5map.MapPointSeries.new(root, {}));
    pointSeries.bullets.push(() => {
      const container = am5.Container.new(root, {});
      container.children.push(am5.Circle.new(root, {
        radius: 2,
        fill: am5.color(0xffffff),
        stroke: primaryColor,
        strokeWidth: 1
      }));
      return am5.Bullet.new(root, { sprite: container });
    });

    // Add many points
    const pointsData = [];
    for(let i=0; i<40; i++) {
        pointsData.push({
            latitude: Math.random() * 140 - 70,
            longitude: Math.random() * 360 - 180
        });
    }
    pointSeries.data.setAll(pointsData);

    // Arcs
    const lineSeries = chart.series.push(am5map.MapLineSeries.new(root, {}));
    lineSeries.mapLines.template.setAll({
      stroke: primaryColor,
      strokeOpacity: isDark ? 0.2 : 0.3,
      strokeWidth: 1
    });

    const connections = [];
    for(let i=0; i<15; i++) {
        const from = pointsData[Math.floor(Math.random() * pointsData.length)];
        const to = pointsData[Math.floor(Math.random() * pointsData.length)];
        connections.push({
            geometry: {
                type: "LineString",
                coordinates: [[from.longitude, from.latitude], [to.longitude, to.latitude]]
            }
        });
    }
    lineSeries.data.setAll(connections);

    // Animation
    chart.animate({
      key: "rotationX",
      from: 0,
      to: 360,
      duration: 60000,
      loops: Infinity
    });

    return () => root.dispose();
  }, []);

  return (
    <section className="py-24 bg-background overflow-hidden relative border-t border-border">
      <div className="container relative z-10">
        
        {/* Cinematic Horizon Section - Showing only the upper part of the earth */}
        <div className="relative h-[400px] md:h-[500px] w-full max-w-7xl mx-auto">
          
          {/* Stats perfectly aligned with the wide curve below */}
          <div className="absolute top-0 left-0 w-full flex justify-between px-2 md:px-0">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                className="flex flex-col items-center text-center w-1/4 relative group"
              >
                {/* Long Vertical Connector - Reaches the high horizon line */}
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: '180px' }}
                  transition={{ delay: i * 0.1 + 0.3, duration: 1.2, ease: "easeOut" }}
                  className="absolute bottom-[-200px] left-1/2 w-[1px] bg-gradient-to-b from-primary/40 to-transparent" 
                />
                
                {/* Navigation Pin */}
                <div className="h-2 w-2 rounded-full bg-primary mb-4 shadow-[0_0_10px_rgba(0,163,255,0.3)]" />
                
                <h3 className="text-3xl md:text-5xl font-bold text-primary tracking-tighter mb-2">{stat.value}</h3>
                <p className="text-[10px] md:text-xs text-muted-foreground/60 font-bold uppercase tracking-[0.2em] leading-tight max-w-[140px]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* The Massive Horizon - Showing ONLY the top edge of the Earth */}
          <div className="absolute bottom-[-900px] md:bottom-[-1100px] left-1/2 -translate-x-1/2 w-[250%] md:w-[200%] aspect-square">
             <div ref={chartRef} className="w-full h-full scale-[1.1] contrast-[1.1]" />
             
             {/* Gradient overlay to hide everything except the upper curve */}
             <div className="absolute inset-0 bg-gradient-to-b from-background/0 via-background/80 to-background pointer-events-none" 
                  style={{ background: 'radial-gradient(circle at top, transparent 20%, hsl(var(--background)) 50%)' }} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default GlobalNetwork;
