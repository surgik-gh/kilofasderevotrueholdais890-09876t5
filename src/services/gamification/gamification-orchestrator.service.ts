/**
 * Gamification Orchestrator Service
 * Coordinates all gamification systems and handles platform event triggers
 * 
 * Requirements:
 * - 15.1-15.7: Integration with existing platform
 * - Coordinates achievements, experience, quests, challenges, milestones, and streaks
 */

import { achievementService, ConditionType } from './achievement.service';
import { experienceService } from './experience.service';
import { questService, QuestConditionType } from './quest.service';
import { milestoneService, MilestoneCategory } from './milestone.service';
import { streakService, StreakType } from './streak.service';
import type { UserAchievement } from './achievement.service';
import type { UserQuest } from './quest.service';
import type { UserMilestone } from './milestone.service';

// ============================================================================
// TYPES
// ============================================================================

export interface GamificationResult {
  achievements_unlocked: UserAchievement[];
  quests_completed: UserQuest[];
  milestones_achieved: UserMilestone[];
  level_up: boolean;
  new_level?: number;
  total_coins_earned: number;
  total_xp_earned: number;
  notifications: GamificationNotification[];
}

export interface GamificationNotification {
  type: 'achievement' | 'level_up' | 'quest' | 'milestone' | 'streak';
  title: string;
  message: string;
  icon?: string;
  animation?: string;
}

export interface GamificationError {
  code: string;
  message: string;
}

// ============================================================================
// GAMIFICATION ORCHESTRATOR SERVICE
// ============================================================================

export class GamificationOrchestratorService {
  /**
   * Handle lesson creation event
   * - Awards 50 XP
   * - Updates achievements for lesson_created
   * - Updates quests for create_lessons
   * - Updates milestones for lessons_created
   * - Updates lesson_creation streak
   * - Returns combined gamification result
   * 
   * @param userId User ID
   * @returns Gamification result with all updates
   * @throws Error if processing fails
   * 
   * Requirements: 15.1, 2.1
   */
  async onLessonCreated(userId: string): Promise<GamificationResult> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const result: GamificationResult = {
        achievements_unlocked: [],
        quests_completed: [],
        milestones_achieved: [],
        level_up: false,
        total_coins_earned: 0,
        total_xp_earned: 0,
        notifications: [],
      };

      // 1. Award experience points
      const xpAmount = 50;
      const oldLevel = await experienceService.getUserLevel(userId);
      const newLevel = await experienceService.addExperience(userId, xpAmount, 'lesson_created');
      
      result.total_xp_earned += xpAmount;
      
      // Check for level up
      if (newLevel.level > oldLevel.level) {
        result.level_up = true;
        result.new_level = newLevel.level;
        
        // Add level up notification
        result.notifications.push({
          type: 'level_up',
          title: 'Level Up!',
          message: `You reached level ${newLevel.level}!`,
          animation: 'level_up',
        });

        // Check for level achievements
        const levelAchievements = await achievementService.checkAchievements(
          userId,
          'level_reached' as ConditionType,
          newLevel.level
        );
        
        result.achievements_unlocked.push(...levelAchievements);
        
        // Add achievement notifications
        for (let i = 0; i < levelAchievements.length; i++) {
          result.notifications.push({
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You earned an achievement for reaching level ${newLevel.level}!`,
          });
        }
      }

      // 2. Update lesson creation streak
      const updatedStreak = await streakService.updateStreak(userId, 'lesson_creation' as StreakType);
      
      // Check for streak achievements
      if (updatedStreak.current_count === 7 || updatedStreak.current_count === 30 || updatedStreak.current_count === 100) {
        const streakAchievements = await achievementService.checkAchievements(
          userId,
          'login_streak' as ConditionType,
          updatedStreak.current_count
        );
        
        result.achievements_unlocked.push(...streakAchievements);
        
        result.notifications.push({
          type: 'streak',
          title: 'Streak Milestone!',
          message: `${updatedStreak.current_count} day lesson creation streak!`,
        });
      }

      // 3. Check achievements for lesson_created
      // Get total lessons count
      const { count: lessonsCount } = await this.getLessonsCount(userId);
      
      const achievements = await achievementService.checkAchievements(
        userId,
        'lesson_created' as ConditionType,
        lessonsCount
      );
      
      result.achievements_unlocked.push(...achievements);
      
      // Add achievement notifications
      for (let i = 0; i < achievements.length; i++) {
        result.notifications.push({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You earned a new achievement!`,
        });
      }

      // 4. Update quests for create_lessons
      const completedQuests = await questService.checkQuestCompletion(
        userId,
        'create_lessons' as QuestConditionType,
        1
      );
      
      result.quests_completed.push(...completedQuests);
      
      // Add quest notifications
      for (let i = 0; i < completedQuests.length; i++) {
        result.notifications.push({
          type: 'quest',
          title: 'Quest Completed!',
          message: `You completed a quest!`,
        });
      }

      // 5. Check milestones for lessons_created
      const milestones = await milestoneService.checkMilestones(
        userId,
        'lessons_created' as MilestoneCategory,
        lessonsCount
      );
      
      result.milestones_achieved.push(...milestones);
      
      // Add milestone notifications
      for (let i = 0; i < milestones.length; i++) {
        result.notifications.push({
          type: 'milestone',
          title: 'Milestone Achieved!',
          message: `You reached an important milestone!`,
        });
      }

      // Calculate total coins earned from achievements and milestones
      result.total_coins_earned = this.calculateTotalCoins(
        result.achievements_unlocked,
        result.milestones_achieved
      );

      return result;
    } catch (error) {
      if (this.isGamificationError(error)) {
        throw error;
      }
      throw this.createError('PROCESS_FAILED', `Failed to process lesson creation: ${(error as Error).message}`);
    }
  }

  /**
   * Handle quiz completion event
   * - Awards XP based on score (score% * 100)
   * - Awards bonus 50 XP for perfect score (100%)
   * - Updates achievements for quiz_completed and quiz_perfect
   * - Updates quests for complete_quizzes and quiz_score_above
   * - Updates milestones for quizzes_completed
   * - Updates quiz_completion streak
   * - Returns combined gamification result
   * 
   * @param userId User ID
   * @param score Quiz score percentage (0-100)
   * @returns Gamification result with all updates
   * @throws Error if processing fails
   * 
   * Requirements: 15.2, 2.2, 2.3
   */
  async onQuizCompleted(userId: string, score: number): Promise<GamificationResult> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    if (score < 0 || score > 100) {
      throw this.createError('INVALID_SCORE', 'Score must be between 0 and 100');
    }

    try {
      const result: GamificationResult = {
        achievements_unlocked: [],
        quests_completed: [],
        milestones_achieved: [],
        level_up: false,
        total_coins_earned: 0,
        total_xp_earned: 0,
        notifications: [],
      };

      // 1. Award experience points
      let xpAmount = Math.floor(score); // score% * 100 / 100 = score
      
      // Bonus XP for perfect score
      if (score === 100) {
        xpAmount += 50;
      }
      
      const oldLevel = await experienceService.getUserLevel(userId);
      const newLevel = await experienceService.addExperience(userId, xpAmount, 'quiz_completed');
      
      result.total_xp_earned += xpAmount;
      
      // Check for level up
      if (newLevel.level > oldLevel.level) {
        result.level_up = true;
        result.new_level = newLevel.level;
        
        result.notifications.push({
          type: 'level_up',
          title: 'Level Up!',
          message: `You reached level ${newLevel.level}!`,
          animation: 'level_up',
        });

        // Check for level achievements
        const levelAchievements = await achievementService.checkAchievements(
          userId,
          'level_reached' as ConditionType,
          newLevel.level
        );
        
        result.achievements_unlocked.push(...levelAchievements);
      }

      // 2. Update quiz completion streak
      const updatedStreak = await streakService.updateStreak(userId, 'quiz_completion' as StreakType);
      
      if (updatedStreak.current_count === 7 || updatedStreak.current_count === 30 || updatedStreak.current_count === 100) {
        result.notifications.push({
          type: 'streak',
          title: 'Streak Milestone!',
          message: `${updatedStreak.current_count} day quiz completion streak!`,
        });
      }

      // 3. Check achievements for quiz_completed
      const { count: quizzesCount } = await this.getQuizzesCount(userId);
      
      const quizAchievements = await achievementService.checkAchievements(
        userId,
        'quiz_completed' as ConditionType,
        quizzesCount
      );
      
      result.achievements_unlocked.push(...quizAchievements);

      // 4. Check achievements for quiz_perfect (if score is 100%)
      if (score === 100) {
        const { count: perfectCount } = await this.getPerfectQuizzesCount(userId);
        
        const perfectAchievements = await achievementService.checkAchievements(
          userId,
          'quiz_perfect' as ConditionType,
          perfectCount
        );
        
        result.achievements_unlocked.push(...perfectAchievements);
      }
      
      // Add achievement notifications
      for (let i = 0; i < result.achievements_unlocked.length; i++) {
        result.notifications.push({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You earned a new achievement!`,
        });
      }

      // 5. Update quests for complete_quizzes
      const completedQuests = await questService.checkQuestCompletion(
        userId,
        'complete_quizzes' as QuestConditionType,
        1
      );
      
      result.quests_completed.push(...completedQuests);

      // 6. Update quests for quiz_score_above (if score meets threshold)
      if (score >= 80) {
        const scoreQuests = await questService.checkQuestCompletion(
          userId,
          'quiz_score_above' as QuestConditionType,
          1
        );
        
        result.quests_completed.push(...scoreQuests);
      }
      
      // Add quest notifications
      for (let i = 0; i < result.quests_completed.length; i++) {
        result.notifications.push({
          type: 'quest',
          title: 'Quest Completed!',
          message: `You completed a quest!`,
        });
      }

      // 7. Check milestones for quizzes_completed
      const milestones = await milestoneService.checkMilestones(
        userId,
        'quizzes_completed' as MilestoneCategory,
        quizzesCount
      );
      
      result.milestones_achieved.push(...milestones);
      
      // Add milestone notifications
      for (let i = 0; i < milestones.length; i++) {
        result.notifications.push({
          type: 'milestone',
          title: 'Milestone Achieved!',
          message: `You reached an important milestone!`,
        });
      }

      // Calculate total coins earned
      result.total_coins_earned = this.calculateTotalCoins(
        result.achievements_unlocked,
        result.milestones_achieved
      );

      return result;
    } catch (error) {
      if (this.isGamificationError(error)) {
        throw error;
      }
      throw this.createError('PROCESS_FAILED', `Failed to process quiz completion: ${(error as Error).message}`);
    }
  }

  /**
   * Handle login event
   * - Updates daily_login streak
   * - Checks achievements for login_streak
   * - Checks daily quests
   * - Returns combined gamification result
   * 
   * @param userId User ID
   * @returns Gamification result with all updates
   * @throws Error if processing fails
   * 
   * Requirements: 15.3, 12.1
   */
  async onLogin(userId: string): Promise<GamificationResult> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const result: GamificationResult = {
        achievements_unlocked: [],
        quests_completed: [],
        milestones_achieved: [],
        level_up: false,
        total_coins_earned: 0,
        total_xp_earned: 0,
        notifications: [],
      };

      // 1. Update daily login streak
      const updatedStreak = await streakService.updateStreak(userId, 'daily_login' as StreakType);
      
      // Check for streak milestones
      if (updatedStreak.current_count === 7 || updatedStreak.current_count === 30 || updatedStreak.current_count === 100) {
        result.notifications.push({
          type: 'streak',
          title: 'Login Streak!',
          message: `${updatedStreak.current_count} day login streak!`,
        });
      }

      // 2. Check achievements for login_streak
      const streakAchievements = await achievementService.checkAchievements(
        userId,
        'login_streak' as ConditionType,
        updatedStreak.current_count
      );
      
      result.achievements_unlocked.push(...streakAchievements);
      
      // Add achievement notifications
      for (let i = 0; i < streakAchievements.length; i++) {
        result.notifications.push({
          type: 'achievement',
          title: 'Achievement Unlocked!',
          message: `You earned a login streak achievement!`,
        });
      }

      // 3. Check if user has active daily quests, if not generate them
      const activeQuests = await questService.getActiveQuests(userId, 'daily');
      
      if (activeQuests.length === 0) {
        await questService.generateDailyQuests(userId);
      }

      // Calculate total coins earned
      result.total_coins_earned = this.calculateTotalCoins(
        result.achievements_unlocked,
        result.milestones_achieved
      );

      return result;
    } catch (error) {
      if (this.isGamificationError(error)) {
        throw error;
      }
      throw this.createError('PROCESS_FAILED', `Failed to process login: ${(error as Error).message}`);
    }
  }

  /**
   * Handle leaderboard rank achievement
   * - Checks achievements for leaderboard_first
   * - Updates quests for leaderboard_top
   * - Returns combined gamification result
   * 
   * @param userId User ID
   * @param rank User's rank in leaderboard (1-based)
   * @returns Gamification result with all updates
   * @throws Error if processing fails
   * 
   * Requirements: 15.4
   */
  async onLeaderboardRank(userId: string, rank: number): Promise<GamificationResult> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    if (rank < 1) {
      throw this.createError('INVALID_RANK', 'Rank must be at least 1');
    }

    try {
      const result: GamificationResult = {
        achievements_unlocked: [],
        quests_completed: [],
        milestones_achieved: [],
        level_up: false,
        total_coins_earned: 0,
        total_xp_earned: 0,
        notifications: [],
      };

      // 1. Check achievements for leaderboard_first (rank 1)
      if (rank === 1) {
        const { count: firstPlaceCount } = await this.getFirstPlaceCount(userId);
        
        const rankAchievements = await achievementService.checkAchievements(
          userId,
          'leaderboard_first' as ConditionType,
          firstPlaceCount
        );
        
        result.achievements_unlocked.push(...rankAchievements);
        
        // Add achievement notifications
        for (let i = 0; i < rankAchievements.length; i++) {
          result.notifications.push({
            type: 'achievement',
            title: 'Achievement Unlocked!',
            message: `You earned a leaderboard achievement!`,
          });
        }
      }

      // 2. Update quests for leaderboard_top
      if (rank <= 10) {
        const completedQuests = await questService.checkQuestCompletion(
          userId,
          'leaderboard_top' as QuestConditionType,
          1
        );
        
        result.quests_completed.push(...completedQuests);
        
        // Add quest notifications
        for (let i = 0; i < completedQuests.length; i++) {
          result.notifications.push({
            type: 'quest',
            title: 'Quest Completed!',
            message: `You completed a leaderboard quest!`,
          });
        }
      }

      // Calculate total coins earned
      result.total_coins_earned = this.calculateTotalCoins(
        result.achievements_unlocked,
        result.milestones_achieved
      );

      return result;
    } catch (error) {
      if (this.isGamificationError(error)) {
        throw error;
      }
      throw this.createError('PROCESS_FAILED', `Failed to process leaderboard rank: ${(error as Error).message}`);
    }
  }

  /**
   * Handle expert chat message event
   * - Awards 10 XP per message
   * - Updates quests for expert_chat_messages
   * - Returns combined gamification result
   * 
   * @param userId User ID
   * @returns Gamification result with all updates
   * @throws Error if processing fails
   * 
   * Requirements: 15.5, 2.4
   */
  async onExpertChatMessage(userId: string): Promise<GamificationResult> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const result: GamificationResult = {
        achievements_unlocked: [],
        quests_completed: [],
        milestones_achieved: [],
        level_up: false,
        total_coins_earned: 0,
        total_xp_earned: 0,
        notifications: [],
      };

      // 1. Award experience points
      const xpAmount = 10;
      const oldLevel = await experienceService.getUserLevel(userId);
      const newLevel = await experienceService.addExperience(userId, xpAmount, 'expert_chat_message');
      
      result.total_xp_earned += xpAmount;
      
      // Check for level up
      if (newLevel.level > oldLevel.level) {
        result.level_up = true;
        result.new_level = newLevel.level;
        
        result.notifications.push({
          type: 'level_up',
          title: 'Level Up!',
          message: `You reached level ${newLevel.level}!`,
          animation: 'level_up',
        });

        // Check for level achievements
        const levelAchievements = await achievementService.checkAchievements(
          userId,
          'level_reached' as ConditionType,
          newLevel.level
        );
        
        result.achievements_unlocked.push(...levelAchievements);
      }

      // 2. Update quests for expert_chat_messages
      const completedQuests = await questService.checkQuestCompletion(
        userId,
        'expert_chat_messages' as QuestConditionType,
        1
      );
      
      result.quests_completed.push(...completedQuests);
      
      // Add quest notifications
      for (let i = 0; i < completedQuests.length; i++) {
        result.notifications.push({
          type: 'quest',
          title: 'Quest Completed!',
          message: `You completed a chat quest!`,
        });
      }

      // Calculate total coins earned
      result.total_coins_earned = this.calculateTotalCoins(
        result.achievements_unlocked,
        result.milestones_achieved
      );

      return result;
    } catch (error) {
      if (this.isGamificationError(error)) {
        throw error;
      }
      throw this.createError('PROCESS_FAILED', `Failed to process expert chat message: ${(error as Error).message}`);
    }
  }

  /**
   * Check all progress for a user
   * - Generic method to check progress across all systems
   * - Used for manual checks or batch updates
   * - Returns combined gamification result
   * 
   * @param userId User ID
   * @param eventType Type of event
   * @param value Value for the event
   * @returns Gamification result with all updates
   * @throws Error if processing fails
   * 
   * Requirements: 15.1-15.7
   */
  async checkAllProgress(userId: string, eventType: string, value: number): Promise<GamificationResult> {
    if (!userId || !eventType || value === undefined) {
      throw this.createError('MISSING_FIELDS', 'User ID, event type, and value are required');
    }

    try {
      // Route to appropriate handler based on event type
      switch (eventType) {
        case 'lesson_created':
          return this.onLessonCreated(userId);
        
        case 'quiz_completed':
          return this.onQuizCompleted(userId, value);
        
        case 'login':
          return this.onLogin(userId);
        
        case 'leaderboard_rank':
          return this.onLeaderboardRank(userId, value);
        
        case 'expert_chat_message':
          return this.onExpertChatMessage(userId);
        
        default:
          throw this.createError('INVALID_EVENT_TYPE', `Unknown event type: ${eventType}`);
      }
    } catch (error) {
      if (this.isGamificationError(error)) {
        throw error;
      }
      throw this.createError('CHECK_FAILED', `Failed to check all progress: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Get lessons count for a user
   */
  private async getLessonsCount(userId: string): Promise<{ count: number }> {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { count, error } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      if (error) {
        console.error('Error counting lessons:', error);
        return { count: 0 };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting lessons count:', error);
      return { count: 0 };
    }
  }

  /**
   * Get quizzes count for a user
   */
  private async getQuizzesCount(userId: string): Promise<{ count: number }> {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { count, error } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId);

      if (error) {
        console.error('Error counting quizzes:', error);
        return { count: 0 };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting quizzes count:', error);
      return { count: 0 };
    }
  }

  /**
   * Get perfect quizzes count for a user (100% score)
   */
  private async getPerfectQuizzesCount(userId: string): Promise<{ count: number }> {
    try {
      const { supabase } = await import('../../lib/supabase');
      const { count, error } = await supabase
        .from('quiz_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', userId)
        .eq('score_percentage', 100);

      if (error) {
        console.error('Error counting perfect quizzes:', error);
        return { count: 0 };
      }

      return { count: count || 0 };
    } catch (error) {
      console.error('Error getting perfect quizzes count:', error);
      return { count: 0 };
    }
  }

  /**
   * Get first place count for a user
   * This is a simplified implementation - in production, you'd track this in a separate table
   * Currently returns a placeholder value to allow achievement checking
   */
  private async getFirstPlaceCount(_userId: string): Promise<{ count: number }> {
    // Note: Proper tracking of first place achievements requires additional database schema
    // For now, return 1 to allow the achievement to be checked
    return { count: 1 };
  }

  /**
   * Calculate total coins earned from achievements and milestones
   */
  private calculateTotalCoins(
    achievements: UserAchievement[],
    milestones: UserMilestone[]
  ): number {
    // This is a simplified calculation
    // In production, you'd fetch the actual reward amounts from the achievement/milestone records
    let total = 0;
    
    // Estimate: common=25, rare=50, epic=100, legendary=250
    total += achievements.length * 50; // Average
    
    // Estimate: milestones typically give 100-500 coins
    total += milestones.length * 200; // Average
    
    return total;
  }

  /**
   * Create a GamificationError
   */
  private createError(code: string, message: string): GamificationError {
    return { code, message };
  }

  /**
   * Check if error is a GamificationError
   */
  private isGamificationError(error: unknown): error is GamificationError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }
}

// Export singleton instance
export const gamificationOrchestratorService = new GamificationOrchestratorService();
