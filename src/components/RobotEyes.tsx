import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

interface RobotEyesProps {
  isThinking?: boolean;
  celebrating?: boolean;
}

export function RobotEyes({ isThinking = false, celebrating = false }: RobotEyesProps) {
  const [pupilPosition, setPupilPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      // Limit movement range
      const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 20);
      const angle = Math.atan2(deltaY, deltaX);
      
      setPupilPosition({
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] hidden lg:block"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative"
      >
        {/* Main container - iOS 26 Liquid Glass */}
        <motion.div
          animate={celebrating ? {
            y: [0, -20, 0, -10, 0],
            rotate: [0, -5, 5, -3, 3, 0],
            scale: [1, 1.1, 1]
          } : isThinking ? { 
            boxShadow: [
              '0 8px 32px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              '0 8px 32px rgba(99, 102, 241, 0.25), 0 0 0 2px rgba(99, 102, 241, 0.2)',
              '0 8px 32px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
            ]
          } : {}}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="relative bg-gradient-to-br from-white/40 via-white/25 to-white/10 backdrop-blur-2xl rounded-full px-6 py-3 border border-white/30 shadow-2xl"
          style={{
            boxShadow: isThinking 
              ? undefined 
              : '0 8px 32px rgba(99, 102, 241, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Inner glow */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
          
          {/* Liquid shine effect */}
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <motion.div
              animate={isThinking ? { left: ['-100%', '100%'] } : {}}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 -left-full w-[200%] h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg]"
            />
          </div>

          {/* Eyes container */}
          <div className="flex items-center gap-6">
            {/* Left Eye */}
            <div className="relative w-10 h-10">
              {/* Eye background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-900/80 to-slate-900/95 shadow-inner overflow-hidden">
                {/* Glass reflection */}
                <div className="absolute top-1 left-2 w-3 h-2 rounded-full bg-white/10" />
              </div>
              
              {/* Pupil with tracking */}
              <motion.div
                animate={{ 
                  x: pupilPosition.x * 0.5,
                  y: pupilPosition.y * 0.5
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-lg relative">
                  {/* Eye highlight */}
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/80" />
                </div>
              </motion.div>
              
              {/* Thinking dots */}
              {isThinking && !celebrating && (
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                </motion.div>
              )}
              
              {/* Happy eyes when celebrating */}
              {celebrating && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 bg-indigo-400 rounded-full" style={{ borderRadius: '50% 50% 0 0' }} />
              )}
            </div>

            {/* Right Eye */}
            <div className="relative w-10 h-10">
              {/* Eye background */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-b from-slate-900/80 to-slate-900/95 shadow-inner overflow-hidden">
                {/* Glass reflection */}
                <div className="absolute top-1 left-2 w-3 h-2 rounded-full bg-white/10" />
              </div>
              
              {/* Pupil with tracking */}
              <motion.div
                animate={{ 
                  x: pupilPosition.x * 0.5,
                  y: pupilPosition.y * 0.5
                }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4"
              >
                <div className="w-full h-full rounded-full bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 shadow-lg relative">
                  {/* Eye highlight */}
                  <div className="absolute top-0.5 left-0.5 w-1.5 h-1.5 rounded-full bg-white/80" />
                </div>
              </motion.div>

              {/* Thinking dots */}
              {isThinking && !celebrating && (
                <motion.div
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                  className="absolute -top-6 left-1/2 -translate-x-1/2 flex gap-1"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                </motion.div>
              )}
              
              {/* Happy eyes when celebrating */}
              {celebrating && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-2 bg-indigo-400 rounded-full" style={{ borderRadius: '50% 50% 0 0' }} />
              )}
            </div>
          </div>

          {/* Status indicator */}
          {isThinking && !celebrating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className="text-xs font-medium text-primary-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Думаю...
              </span>
            </motion.div>
          )}
          
          {celebrating && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
            >
              <span className="text-xs font-medium text-green-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-yellow-500" />
                Молодец!
              </span>
            </motion.div>
          )}
        </motion.div>

        {/* Hover tooltip */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ opacity: 1, scale: 1 }}
          className="absolute -bottom-14 left-1/2 -translate-x-1/2 pointer-events-none"
        >
          <span className="text-xs text-slate-500 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm whitespace-nowrap flex items-center gap-1">
            Alies AI 👋
          </span>
        </motion.div>
      </motion.div>
    </div>
  );
}
