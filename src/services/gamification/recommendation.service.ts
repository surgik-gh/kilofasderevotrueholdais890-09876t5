/**
 * Recommendation Service
 * Handles personalized recommendations for achievements, quests, and goals
 * 
 * Requirements:
 * - 14.1-14.7: Personalized recommendations system
 */

import { supabase } from '../../lib/supabase';
import { achievementService, Achievement, UserAchievement } from './achievement.service';
import { questService, Quest, UserQuest } from './quest.service';
import { experienceService } from './experience.service';

// ============================================================================
// TYPES
// ============================================================================

export interface RecommendedAchievement {
  achievement: Achievement;
  userAchievement: UserAchievement;
  progressPercentage: number;
  remainingProgress: number;
  estimatedDaysToComplete: number;
  priority: number; // Higher = more recommended
}

export interface PersonalizedGoal {
  id: string;
  title: string;
  description: string;
  type: 'achievement' | 'quest' | 'level' | 'streak';
  targetValue: number;
  currentValue: number;
  progressPercentage: number;
  reward: {
    coins: number;
    xp: number;
  };
  deadline?: string;
}

export interface WeeklyGoals {
  primaryGoal: PersonalizedGoal;
  secondaryGoals: PersonalizedGoal[];
  motivationalMessage: string;
}

export interface UserActivityProfile {
  userId: string;
  favoriteSubjects: string[];
  preferredActivityType: 'lessons' | 'quizzes' | 'mixed';
  averageDailyLessons: number;
  averageDailyQuizzes: number;
  averageQuizScore: number;
  loginStreak: number;
  totalDaysActive: number;
  lastActivityDate: string;
}

export interface RecommendationError {
  code: string;
  message: string;
}

// ============================================================================
// RECOMMENDATION SERVICE
// ============================================================================

export class RecommendationService {
  /**
   * Get recommended achievements for a user
   * - Returns top 3 achievements closest to completion
   * - Prioritizes achievements based on progress and user activity
   * - Excludes already unlocked achievements
   * 
   * @param userId User ID
   * @returns Array of recommended achievements (max 3)
   * @throws Error if fetch fails
   * 
   * Requirements: 14.1
   * Property 34: Рекомендации ближайших достижений
   * Property 35: Количество рекомендаций
   */
  async getRecommendedAchievements(userId: string): Promise<RecommendedAchievement[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Get all achievements and user achievements
      const [allAchievements, userAchievements, activityProfile] = await Promise.all([
        achievementService.getAllAchievements(),
        achievementService.getUserAchievements(userId),
        this.getUserActivityProfile(userId),
      ]);

      // Filter to only locked achievements with some progress
      const lockedAchievements = userAchievements.filter(ua => !ua.unlocked);

      // Create recommendation objects
      const recommendations: RecommendedAchievement[] = [];

      for (const userAch of lockedAchievements) {
        const achievement = allAchievements.find(a => a.id === userAch.achievement_id);
        if (!achievement) continue;

        const progressPercentage = (userAch.progress / achievement.condition_value) * 100;
        const remainingProgress = achievement.condition_value - userAch.progress;

        // Calculate estimated days to complete based on user activity
        const estimatedDays = this.estimateDaysToComplete(
          achievement,
          remainingProgress,
          activityProfile
        );

        // Calculate priority score
        const priority = this.calculatePriority(
          progressPercentage,
          remainingProgress,
          estimatedDays,
          achievement.rarity
        );

        recommendations.push({
          achievement,
          userAchievement: userAch,
          progressPercentage: Math.round(progressPercentage * 100) / 100,
          remainingProgress,
          estimatedDaysToComplete: estimatedDays,
          priority,
        });
      }

      // Sort by priority (highest first) and remaining progress (lowest first)
      recommendations.sort((a, b) => {
        if (b.priority !== a.priority) {
          return b.priority - a.priority;
        }
        return a.remainingProgress - b.remainingProgress;
      });

      // Return top 3
      return recommendations.slice(0, 3);
    } catch (error) {
      if (this.isRecommendationError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to get recommended achievements: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get personalized quest recommendations
   * - Suggests quests based on user's activity patterns
   * - Prioritizes quests that match user's preferred activities
   * 
   * @param userId User ID
   * @returns Array of recommended quests
   * @throws Error if fetch fails
   * 
   * Requirements: 14.2
   */
  async getPersonalizedQuests(userId: string): Promise<Quest[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const activityProfile = await this.getUserActivityProfile(userId);
      const activeQuests = await questService.getActiveQuests(userId);

      // Filter quests based on user's preferred activity type
      const personalizedQuests = activeQuests.filter(quest => {
        const questData = quest as unknown as { quest_id: string };
        // This would need to be enhanced with actual quest data
        // For now, return all active quests
        return true;
      });

      return personalizedQuests as unknown as Quest[];
    } catch (error) {
      if (this.isRecommendationError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to get personalized quests: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get personalized weekly goals
   * - Creates a set of achievable goals for the week
   * - Based on user's activity patterns and current progress
   * - Includes one primary goal and 2-3 secondary goals
   * 
   * @param userId User ID
   * @returns Weekly goals with motivational message
   * @throws Error if fetch fails
   * 
   * Requirements: 14.3
   */
  async getWeeklyGoals(userId: string): Promise<WeeklyGoals> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const [activityProfile, recommendedAchievements, userLevel] = await Promise.all([
        this.getUserActivityProfile(userId),
        this.getRecommendedAchievements(userId),
        experienceService.getUserLevel(userId),
      ]);

      const goals: PersonalizedGoal[] = [];

      // Add achievement-based goals
      for (const rec of recommendedAchievements.slice(0, 2)) {
        goals.push({
          id: `achievement-${rec.achievement.id}`,
          title: rec.achievement.title,
          description: rec.achievement.description,
          type: 'achievement',
          targetValue: rec.achievement.condition_value,
          currentValue: rec.userAchievement.progress,
          progressPercentage: rec.progressPercentage,
          reward: {
            coins: rec.achievement.reward_coins,
            xp: rec.achievement.reward_xp,
          },
        });
      }

      // Add level-based goal if close to next level
      if (userLevel) {
        const levelProgress = (userLevel.experience_points / userLevel.experience_to_next_level) * 100;
        if (levelProgress >= 50) {
          goals.push({
            id: `level-${userLevel.level + 1}`,
            title: `Достичь уровня ${userLevel.level + 1}`,
            description: `Наберите еще ${userLevel.experience_to_next_level - userLevel.experience_points} опыта`,
            type: 'level',
            targetValue: userLevel.experience_to_next_level,
            currentValue: userLevel.experience_points,
            progressPercentage: levelProgress,
            reward: {
              coins: 100,
              xp: 0,
            },
          });
        }
      }

      // Add activity-based goals
      if (activityProfile.averageDailyLessons > 0) {
        const weeklyTarget = Math.ceil(activityProfile.averageDailyLessons * 7 * 1.2); // 20% increase
        goals.push({
          id: 'weekly-lessons',
          title: 'Создать уроки на неделе',
          description: `Создайте ${weeklyTarget} уроков на этой неделе`,
          type: 'quest',
          targetValue: weeklyTarget,
          currentValue: 0,
          progressPercentage: 0,
          reward: {
            coins: weeklyTarget * 10,
            xp: weeklyTarget * 20,
          },
          deadline: this.getEndOfWeek(),
        });
      }

      if (activityProfile.averageDailyQuizzes > 0) {
        const weeklyTarget = Math.ceil(activityProfile.averageDailyQuizzes * 7 * 1.2);
        goals.push({
          id: 'weekly-quizzes',
          title: 'Пройти викторины на неделе',
          description: `Пройдите ${weeklyTarget} викторин на этой неделе`,
          type: 'quest',
          targetValue: weeklyTarget,
          currentValue: 0,
          progressPercentage: 0,
          reward: {
            coins: weeklyTarget * 8,
            xp: weeklyTarget * 15,
          },
          deadline: this.getEndOfWeek(),
        });
      }

      // Select primary goal (highest priority)
      const primaryGoal = goals[0] || this.createDefaultGoal();
      const secondaryGoals = goals.slice(1, 4);

      // Generate motivational message
      const motivationalMessage = this.generateMotivationalMessage(
        activityProfile,
        primaryGoal
      );

      return {
        primaryGoal,
        secondaryGoals,
        motivationalMessage,
      };
    } catch (error) {
      if (this.isRecommendationError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to get weekly goals: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get user activity profile
   * - Analyzes user's historical activity
   * - Calculates averages and preferences
   * - Used for personalization
   * 
   * @param userId User ID
   * @returns User activity profile
   * @throws Error if fetch fails
   * 
   * Requirements: 14.6
   */
  async getUserActivityProfile(userId: string): Promise<UserActivityProfile> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Get user's lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from('lessons')
        .select('created_at, subject')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (lessonsError) {
        throw this.handleSupabaseError(lessonsError);
      }

      // Get user's quiz attempts
      const { data: quizAttempts, error: quizzesError } = await supabase
        .from('quiz_attempts')
        .select('created_at, score_percentage')
        .eq('student_id', userId)
        .order('created_at', { ascending: false });

      if (quizzesError) {
        throw this.handleSupabaseError(quizzesError);
      }

      // Get user's streak
      const { data: streaks, error: streaksError } = await supabase
        .from('streaks')
        .select('*')
        .eq('user_id', userId)
        .eq('streak_type', 'daily_login')
        .single();

      if (streaksError && streaksError.code !== 'PGRST116') {
        throw this.handleSupabaseError(streaksError);
      }

      // Calculate statistics
      const totalLessons = lessons?.length || 0;
      const totalQuizzes = quizAttempts?.length || 0;

      // Calculate days active
      const allDates = [
        ...(lessons || []).map(l => new Date(l.created_at)),
        ...(quizAttempts || []).map(q => new Date(q.created_at)),
      ];
      const uniqueDays = new Set(allDates.map(d => d.toDateString())).size;

      // Calculate averages
      const averageDailyLessons = uniqueDays > 0 ? totalLessons / uniqueDays : 0;
      const averageDailyQuizzes = uniqueDays > 0 ? totalQuizzes / uniqueDays : 0;

      // Calculate average quiz score
      const averageQuizScore = quizAttempts && quizAttempts.length > 0
        ? quizAttempts.reduce((sum, q) => sum + (q.score_percentage || 0), 0) / quizAttempts.length
        : 0;

      // Determine preferred activity type
      let preferredActivityType: 'lessons' | 'quizzes' | 'mixed' = 'mixed';
      if (totalLessons > totalQuizzes * 2) {
        preferredActivityType = 'lessons';
      } else if (totalQuizzes > totalLessons * 2) {
        preferredActivityType = 'quizzes';
      }

      // Get favorite subjects
      const subjectCounts: Record<string, number> = {};
      (lessons || []).forEach(lesson => {
        if (lesson.subject) {
          subjectCounts[lesson.subject] = (subjectCounts[lesson.subject] || 0) + 1;
        }
      });
      const favoriteSubjects = Object.entries(subjectCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([subject]) => subject);

      return {
        userId,
        favoriteSubjects,
        preferredActivityType,
        averageDailyLessons: Math.round(averageDailyLessons * 100) / 100,
        averageDailyQuizzes: Math.round(averageDailyQuizzes * 100) / 100,
        averageQuizScore: Math.round(averageQuizScore * 100) / 100,
        loginStreak: streaks?.current_count || 0,
        totalDaysActive: uniqueDays,
        lastActivityDate: allDates.length > 0
          ? new Date(Math.max(...allDates.map(d => d.getTime()))).toISOString()
          : new Date().toISOString(),
      };
    } catch (error) {
      if (this.isRecommendationError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to get user activity profile: ${(error as Error).message}`
      );
    }
  }

  /**
   * Suggest simple achievements for motivation
   * - Used when user hasn't unlocked achievements recently
   * - Returns easy-to-achieve achievements
   * 
   * @param userId User ID
   * @returns Array of simple achievements
   * @throws Error if fetch fails
   * 
   * Requirements: 14.4
   */
  async suggestSimpleAchievements(userId: string): Promise<RecommendedAchievement[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const recommendations = await this.getRecommendedAchievements(userId);

      // Filter to achievements that are close to completion (>50% progress)
      // or have low remaining progress
      const simpleAchievements = recommendations.filter(
        rec => rec.progressPercentage >= 50 || rec.remainingProgress <= 5
      );

      return simpleAchievements.slice(0, 3);
    } catch (error) {
      if (this.isRecommendationError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to suggest simple achievements: ${(error as Error).message}`
      );
    }
  }

  /**
   * Get subject-specific achievement recommendations
   * - Recommends achievements related to user's favorite subjects
   * 
   * @param userId User ID
   * @returns Array of subject-related achievements
   * @throws Error if fetch fails
   * 
   * Requirements: 14.5
   */
  async getSubjectSpecificRecommendations(userId: string): Promise<RecommendedAchievement[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const activityProfile = await this.getUserActivityProfile(userId);
      const recommendations = await this.getRecommendedAchievements(userId);

      // Filter to achievements related to lessons or subjects
      // (In a real implementation, achievements would have subject tags)
      const subjectRelated = recommendations.filter(rec =>
        rec.achievement.condition_type === 'lesson_created' ||
        rec.achievement.condition_type === 'subjects_studied'
      );

      return subjectRelated;
    } catch (error) {
      if (this.isRecommendationError(error)) {
        throw error;
      }
      throw this.createError(
        'FETCH_FAILED',
        `Failed to get subject-specific recommendations: ${(error as Error).message}`
      );
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Estimate days to complete an achievement
   */
  private estimateDaysToComplete(
    achievement: Achievement,
    remainingProgress: number,
    activityProfile: UserActivityProfile
  ): number {
    let dailyRate = 0;

    switch (achievement.condition_type) {
      case 'lesson_created':
        dailyRate = activityProfile.averageDailyLessons;
        break;
      case 'quiz_completed':
      case 'quiz_perfect':
        dailyRate = activityProfile.averageDailyQuizzes;
        break;
      case 'login_streak':
        dailyRate = 1; // One day at a time
        break;
      default:
        dailyRate = 0.5; // Conservative estimate
    }

    if (dailyRate === 0) {
      return 999; // Very high number if no activity
    }

    return Math.ceil(remainingProgress / dailyRate);
  }

  /**
   * Calculate priority score for an achievement
   * Higher score = higher priority
   */
  private calculatePriority(
    progressPercentage: number,
    remainingProgress: number,
    estimatedDays: number,
    rarity: string
  ): number {
    let priority = 0;

    // Progress weight (0-50 points)
    priority += progressPercentage * 0.5;

    // Remaining progress weight (0-30 points, inverse)
    priority += Math.max(0, 30 - remainingProgress);

    // Estimated days weight (0-20 points, inverse)
    priority += Math.max(0, 20 - estimatedDays);

    // Rarity bonus
    const rarityBonus: Record<string, number> = {
      common: 0,
      rare: 5,
      epic: 10,
      legendary: 15,
    };
    priority += rarityBonus[rarity] || 0;

    return Math.round(priority);
  }

  /**
   * Generate motivational message based on user activity
   */
  private generateMotivationalMessage(
    activityProfile: UserActivityProfile,
    primaryGoal: PersonalizedGoal
  ): string {
    const messages = [
      `Отличная работа! Вы активны уже ${activityProfile.totalDaysActive} дней. Продолжайте в том же духе!`,
      `Ваша серия входов: ${activityProfile.loginStreak} дней! Не прерывайте её!`,
      `Вы близки к цели "${primaryGoal.title}". Еще немного усилий!`,
      `Средний балл в викторинах: ${activityProfile.averageQuizScore.toFixed(1)}%. Отличный результат!`,
      `На этой неделе сосредоточьтесь на: ${primaryGoal.title}`,
    ];

    // Select message based on user's strongest metric
    if (activityProfile.loginStreak >= 7) {
      return messages[1];
    } else if (activityProfile.averageQuizScore >= 80) {
      return messages[3];
    } else if (primaryGoal.progressPercentage >= 70) {
      return messages[2];
    } else if (activityProfile.totalDaysActive >= 30) {
      return messages[0];
    } else {
      return messages[4];
    }
  }

  /**
   * Get end of current week (Sunday)
   */
  private getEndOfWeek(): string {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysUntilSunday = 7 - dayOfWeek;
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + daysUntilSunday);
    endOfWeek.setHours(23, 59, 59, 999);
    return endOfWeek.toISOString();
  }

  /**
   * Create a default goal when no goals are available
   */
  private createDefaultGoal(): PersonalizedGoal {
    return {
      id: 'default-goal',
      title: 'Начните обучение',
      description: 'Создайте свой первый урок или пройдите викторину',
      type: 'quest',
      targetValue: 1,
      currentValue: 0,
      progressPercentage: 0,
      reward: {
        coins: 25,
        xp: 50,
      },
    };
  }

  /**
   * Create a RecommendationError
   */
  private createError(code: string, message: string): RecommendationError {
    return { code, message };
  }

  /**
   * Check if error is a RecommendationError
   */
  private isRecommendationError(error: unknown): error is RecommendationError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to RecommendationError
   */
  private handleSupabaseError(error: { message: string; code?: string }): RecommendationError {
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Resource not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this resource');
    }

    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const recommendationService = new RecommendationService();
