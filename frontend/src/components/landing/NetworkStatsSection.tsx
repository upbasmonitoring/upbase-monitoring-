import { motion } from "framer-motion";

const NetworkStatsSection = () => {
  const stats = [
    { value: "60+", label: "cloud services available globally", x: "20%" },
    { value: "215B", label: "cyber threats blocked each day", x: "40%" },
    { value: "20%", label: "of websites are protected by Upbase", x: "60%" },
    { value: "330+", label: "cities in 125+ countries globally", x: "80%" },
  ];

  return (
    <section className="py-32 bg-white overflow-hidden relative">
      <div className="container relative z-10">
        <div className="flex flex-col items-center mb-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <span className="text-xs font-black uppercase tracking-[0.3em] text-primary mb-4 block">The Global Backbone</span>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight text-balance">Built local, scaled universal</h2>
          </motion.div>
        </div>

        {/* The Graphic Area */}
        <div className="relative h-[450px] md:h-[550px] w-full max-w-6xl mx-auto">
          
          {/* Stats floating above with Vertical Connectors */}
          <div className="absolute top-0 left-0 w-full flex justify-between px-2 md:px-0">
            {stats.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1, duration: 0.8 }}
                viewport={{ once: true }}
                className="flex flex-col items-center text-center w-1/4 relative group"
              >
                {/* Vertical Connector Line from reference */}
                <motion.div 
                  initial={{ height: 0 }}
                  whileInView={{ height: '200px' }}
                  transition={{ delay: i * 0.1 + 0.4, duration: 1.2, ease: "easeOut" }}
                  className="absolute bottom-[-220px] left-1/2 w-[1px] bg-gradient-to-b from-primary/60 to-transparent" 
                />
                
                {/* Connector Dot */}
                <motion.div 
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="h-2 w-2 rounded-full bg-primary mb-4 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                />
                
                <span className="text-3xl md:text-5xl font-bold text-primary tracking-tighter mb-3">{stat.value}</span>
                <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-wider leading-tight max-w-[120px]">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {/* The Hemisphere Globe (Reference Style) */}
          <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[100%] md:w-[120%] aspect-square rounded-full bg-white border border-slate-100 shadow-[0_-40px_100px_rgba(59,130,246,0.08)] overflow-hidden">
             
             {/* Radial Grid effect */}
             <div className="absolute inset-0 opacity-[0.15]" 
               style={{ 
                 backgroundImage: `radial-gradient(circle at center, transparent 30%, #3b82f6 100%), 
                                   linear-gradient(to right, #3b82f611 1px, transparent 1px), 
                                   linear-gradient(to bottom, #3b82f611 1px, transparent 1px)`,
                 backgroundSize: '100% 100%, 40px 40px, 40px 40px'
               }} 
             />

             {/* Animated Dots/Cities */}
             {[...Array(30)].map((_, i) => (
               <motion.div
                 key={i}
                 animate={{ 
                   opacity: [0.2, 0.6, 0.2],
                   scale: [1, 1.5, 1] 
                 }}
                 transition={{ 
                   duration: 3 + Math.random() * 3, 
                   repeat: Infinity, 
                   delay: Math.random() * 2 
                 }}
                 className="absolute h-1 w-1 bg-primary rounded-full"
                 style={{ 
                    top: `${15 + Math.random() * 35}%`, 
                    left: `${15 + Math.random() * 70}%` 
                 }}
               />
             ))}

             {/* Connection Waves */}
             <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-full h-full">
                <svg className="w-full h-full opacity-10">
                  <motion.circle 
                    cx="50%" cy="0" r="100" 
                    fill="none" stroke="#3b82f6" strokeWidth="1"
                    animate={{ r: [100, 500], opacity: [0.5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  />
                  <motion.circle 
                    cx="50%" cy="0" r="100" 
                    fill="none" stroke="#3b82f6" strokeWidth="1"
                    animate={{ r: [100, 500], opacity: [0.5, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "linear", delay: 2 }}
                  />
                </svg>
             </div>
          </div>
          
          {/* Masking the bottom to create the "rising" effect */}
          <div className="absolute bottom-[-110px] left-0 w-full h-[150px] bg-white z-20" />
        </div>
      </div>
    </section>
  );
};

export default NetworkStatsSection;
