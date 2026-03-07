import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), viteSingleFile()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['framer-motion', 'recharts'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Feature chunks
          'gamification': [
            './src/components/gamification/achievements/AchievementCard.tsx',
            './src/components/gamification/achievements/AchievementGrid.tsx',
            './src/components/gamification/challenges/ChallengeCard.tsx',
            './src/components/gamification/quests/QuestCard.tsx',
            './src/services/gamification/achievement.service.ts',
            './src/services/gamification/challenge.service.ts',
            './src/services/gamification/quest.service.ts',
          ],
          'admin': [
            './src/components/admin/AdminAnalytics.tsx',
            './src/components/admin/AdminSchoolManagement.tsx',
            './src/components/admin/AdminContentModeration.tsx',
          ],
          'analytics': [
            './src/components/analytics/ProgressAnalytics.tsx',
            './src/components/analytics/SubjectProgressChart.tsx',
            './src/services/analytics.service.ts',
          ],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
