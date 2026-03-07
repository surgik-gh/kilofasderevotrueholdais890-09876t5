import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { lessonService } from '../services/lesson.service';
import { isSupabaseConfigured } from '../lib/supabase';

/**
 * Custom hook for lesson operations with optimistic updates
 */
export function useLessons() {
  const {
    profile,
    lessons,
    lessonAssignments,
    setLessons,
    addLesson,
    updateLesson,
    deleteLesson,
    setLessonAssignments,
    setLoading,
    setError,
  } = useStore();

  const [isLoadingLessons, setIsLoadingLessons] = useState(false);
  const [lessonError, setLessonError] = useState<string | null>(null);

  // Load lessons
  useEffect(() => {
    if (!isSupabaseConfigured() || !profile) return;

    loadLessons();
  }, [profile?.id]);

  const loadLessons = async () => {
    if (!profile) return;

    setIsLoadingLessons(true);
    setLessonError(null);

    try {
      // Load lessons based on role
      if (profile.role === 'student') {
        const assigned = await lessonService.getAssignedLessons(profile.id);
        setLessons(assigned);
      } else if (profile.role === 'teacher') {
        // Load lessons created by teacher
        const { data } = await lessonService.getLessonsByCreator(profile.id);
        if (data) setLessons(data);
      } else {
        // Load all lessons for admin/parent
        const { data } = await lessonService.getAllLessons();
        if (data) setLessons(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load lessons';
      setLessonError(message);
      console.error('Failed to load lessons:', error);
    } finally {
      setIsLoadingLessons(false);
    }
  };

  const createLesson = async (data: {
    title: string;
    subject: string;
    content: string;
    schoolId?: string;
  }) => {
    if (!profile) throw new Error('Not authenticated');

    setLoading(true);
    setError(null);
    
    try {
      const lesson = await lessonService.createLesson({
        title: data.title,
        subject: data.subject,
        content: data.content,
        creator_id: profile.id,
        creator_role: profile.role === 'teacher' ? 'teacher' : 'student',
        school_id: data.schoolId || profile.school_id,
      });

      addLesson(lesson);
      return lesson;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create lesson';
      setError(message);
      console.error('Failed to create lesson:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateLessonData = async (lessonId: string, updates: {
    title?: string;
    content?: string;
  }) => {
    // Optimistic update
    updateLesson(lessonId, updates);

    try {
      const updated = await lessonService.updateLesson(lessonId, updates);
      updateLesson(lessonId, updated);
      return updated;
    } catch (error) {
      // Reload on error to revert
      await loadLessons();
      throw error;
    }
  };

  const deleteLessonData = async (lessonId: string) => {
    // Optimistic update
    deleteLesson(lessonId);

    try {
      await lessonService.deleteLesson(lessonId);
    } catch (error) {
      // Reload on error to revert
      await loadLessons();
      throw error;
    }
  };

  const assignLesson = async (lessonId: string, studentIds: string[]) => {
    if (!profile || profile.role !== 'teacher') {
      throw new Error('Only teachers can assign lessons');
    }

    try {
      await lessonService.assignLessonToStudents(lessonId, studentIds);
      // Reload to get updated assignments
      await loadLessons();
    } catch (error) {
      console.error('Failed to assign lesson:', error);
      throw error;
    }
  };

  const getLesson = async (lessonId: string) => {
    try {
      return await lessonService.getLesson(lessonId);
    } catch (error) {
      console.error('Failed to get lesson:', error);
      throw error;
    }
  };

  const getLessonProgress = async (lessonId: string, studentId: string) => {
    try {
      return await lessonService.getLessonProgress(lessonId, studentId);
    } catch (error) {
      console.error('Failed to get lesson progress:', error);
      throw error;
    }
  };

  return {
    lessons,
    lessonAssignments,
    isLoadingLessons,
    lessonError,
    createLesson,
    updateLesson: updateLessonData,
    deleteLesson: deleteLessonData,
    assignLesson,
    getLesson,
    getLessonProgress,
    refreshLessons: loadLessons,
  };
}
