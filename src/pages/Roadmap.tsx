/**
 * Roadmap Page
 * Main page for learning roadmap management
 * Combines RoadmapList, RoadmapGenerator, and RoadmapView components
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Layout } from '@/components/Layout';
import { useStore } from '@/store';
import { RoadmapGenerator, RoadmapList, RoadmapView } from '@/components/roadmap';
import type { LearningRoadmap } from '@/types/platform';

type ViewMode = 'list' | 'create' | 'view';

export default function Roadmap() {
  const { profile } = useStore();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedRoadmap, setSelectedRoadmap] = useState<LearningRoadmap | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRoadmapGenerated = (roadmap: LearningRoadmap) => {
    // Switch to view mode to show the newly created roadmap
    setSelectedRoadmap(roadmap);
    setViewMode('view');
    // Trigger refresh of the list
    setRefreshKey(prev => prev + 1);
  };

  const handleSelectRoadmap = (roadmap: LearningRoadmap) => {
    setSelectedRoadmap(roadmap);
    setViewMode('view');
  };

  const handleProgressUpdate = (updatedRoadmap: LearningRoadmap) => {
    setSelectedRoadmap(updatedRoadmap);
    // Trigger refresh of the list
    setRefreshKey(prev => prev + 1);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedRoadmap(null);
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Требуется авторизация
          </h2>
          <p className="text-slate-600">
            Пожалуйста, войдите в систему для доступа к программам обучения
          </p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        {viewMode !== 'list' && (
          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={handleBackToList}
            className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к списку</span>
          </motion.button>
        )}

        {/* Content */}
        <AnimatePresence mode="wait">
          {viewMode === 'list' && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RoadmapList
                key={refreshKey}
                studentId={profile.id}
                onSelectRoadmap={handleSelectRoadmap}
                onCreateNew={() => setViewMode('create')}
              />
            </motion.div>
          )}

          {viewMode === 'create' && (
            <motion.div
              key="create"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RoadmapGenerator
                studentId={profile.id}
                onRoadmapGenerated={handleRoadmapGenerated}
              />
            </motion.div>
          )}

          {viewMode === 'view' && selectedRoadmap && (
            <motion.div
              key="view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <RoadmapView
                roadmap={selectedRoadmap}
                onProgressUpdate={handleProgressUpdate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </Layout>
  );
}
