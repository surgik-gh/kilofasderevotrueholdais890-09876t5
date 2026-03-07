/**
 * Quest Service
 * Handles quest management, progress tracking, and completion
 * 
 * Requirements:
 * - 3.1-3.8: Daily quest system
 * - 4.1-4.7: Weekly quest system
 * - 7.2: Progress visualization for quests
 */

import { supabase } from '../../lib/supabase';

// ============================================================================
// TYPES
// ============================================================================

export type QuestType = 'daily' | 'weekly';

export type QuestConditionType =
  | 'create_lessons'        // Создать N уроков
  | 'complete_quizzes'      // Пройти N викторин
  | 'quiz_score_above'      // Получить N% в викторине
  | 'leaderboard_top'       // Войти в топ-N
  | 'expert_chat_messages'  // Отправить N сообщений
  | 'study_subjects';       // Изучить N предметов

export interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: QuestType;
  condition_type: QuestConditionType;
  condition_value: number;
  reward_coins: number;
  reward_xp: number;
  active_from: string;
  active_until: string;
  created_at: string;
}

export interface UserQuest {
  id: string;
  user_id: string;
  quest_id: string;
  progress: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  created_at: string;
}

export interface QuestReward {
  coins: number;
  xp: number;
  bonus_coins?: number;
}

export interface QuestError {
  code: string;
  message: string;
}

// ============================================================================
// QUEST TEMPLATES
// ============================================================================

const DAILY_QUEST_TEMPLATES = [
  {
    title: 'Создать урок',
    description: 'Создайте 1 урок сегодня',
    condition_type: 'create_lessons' as QuestConditionType,
    condition_value: 1,
    reward_coins: 25,
    reward_xp: 50,
  },
  {
    title: 'Пройти викторину',
    description: 'Пройдите 1 викторину сегодня',
    condition_type: 'complete_quizzes' as QuestConditionType,
    condition_value: 1,
    reward_coins: 20,
    reward_xp: 40,
  },
  {
    title: 'Отличный результат',
    description: 'Получите 80% или выше в викторине',
    condition_type: 'quiz_score_above' as QuestConditionType,
    condition_value: 80,
    reward_coins: 30,
    reward_xp: 60,
  },
  {
    title: 'Войти в топ-10',
    description: 'Займите место в топ-10 рейтинга',
    condition_type: 'leaderboard_top' as QuestConditionType,
    condition_value: 10,
    reward_coins: 35,
    reward_xp: 70,
  },
  {
    title: 'Общение с экспертом',
    description: 'Отправьте 5 сообщений в Expert Chat',
    condition_type: 'expert_chat_messages' as QuestConditionType,
    condition_value: 5,
    reward_coins: 15,
    reward_xp: 30,
  },
];

const WEEKLY_QUEST_TEMPLATES = [
  {
    title: 'Создать 5 уроков',
    description: 'Создайте 5 уроков на этой неделе',
    condition_type: 'create_lessons' as QuestConditionType,
    condition_value: 5,
    reward_coins: 100,
    reward_xp: 200,
  },
  {
    title: 'Пройти 10 викторин',
    description: 'Пройдите 10 викторин на этой неделе',
    condition_type: 'complete_quizzes' as QuestConditionType,
    condition_value: 10,
    reward_coins: 80,
    reward_xp: 160,
  },
  {
    title: 'Мастер викторин',
    description: 'Получите 90% или выше в 5 викторинах',
    condition_type: 'quiz_score_above' as QuestConditionType,
    condition_value: 90,
    reward_coins: 120,
    reward_xp: 240,
  },
  {
    title: 'Топ-3 три раза',
    description: 'Войдите в топ-3 рейтинга 3 раза на этой неделе',
    condition_type: 'leaderboard_top' as QuestConditionType,
    condition_value: 3,
    reward_coins: 150,
    reward_xp: 300,
  },
  {
    title: 'Изучить 3 предмета',
    description: 'Изучите 3 разных предмета на этой неделе',
    condition_type: 'study_subjects' as QuestConditionType,
    condition_value: 3,
    reward_coins: 90,
    reward_xp: 180,
  },
];

// ============================================================================
// QUEST SERVICE
// ============================================================================

export class QuestService {
  /**
   * Get active quests for a user
   * - Returns all active quests (daily or weekly)
   * - Includes progress information
   * - Can filter by quest type
   * 
   * @param userId User ID
   * @param type Optional quest type filter
   * @returns Array of user quests
   * @throws Error if fetch fails
   * 
   * Requirements: 3.7, 4.7
   */
  async getActiveQuests(userId: string, type?: QuestType): Promise<UserQuest[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      const now = new Date().toISOString();

      // Build query
      let query = supabase
        .from('user_quests')
        .select(`
          *,
          quest:quests(*)
        `)
        .eq('user_id', userId)
        .eq('completed', false);

      // Filter by quest type if specified
      if (type) {
        query = query.eq('quest.quest_type', type);
      }

      const { data, error } = await query;

      if (error) {
        throw this.handleSupabaseError(error);
      }

      // Filter out expired quests
      const activeQuests = (data || []).filter((uq: any) => {
        return uq.quest && new Date(uq.quest.active_until) > new Date(now);
      });

      return activeQuests as UserQuest[];
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch active quests: ${(error as Error).message}`);
    }
  }

  /**
   * Get user quest progress for a specific quest
   * - Returns progress details for a single quest
   * 
   * @param userId User ID
   * @param questId Quest ID
   * @returns User quest progress
   * @throws Error if not found or fetch fails
   * 
   * Requirements: 3.7, 4.7
   */
  async getUserQuestProgress(userId: string, questId: string): Promise<UserQuest> {
    if (!userId || !questId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Quest ID are required');
    }

    try {
      const { data, error } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (error) {
        throw this.handleSupabaseError(error);
      }

      if (!data) {
        throw this.createError('NOT_FOUND', 'Quest progress not found');
      }

      return data as UserQuest;
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('FETCH_FAILED', `Failed to fetch quest progress: ${(error as Error).message}`);
    }
  }

  /**
   * Generate daily quests for a user
   * - Creates 3 random daily quests
   * - Quests are active for 24 hours
   * - Returns created quests
   * 
   * @param userId User ID
   * @returns Array of generated quests
   * @throws Error if generation fails
   * 
   * Requirements: 3.1, 3.2
   */
  async generateDailyQuests(userId: string): Promise<Quest[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Select 3 random quest templates
      const selectedTemplates = this.selectRandomTemplates(DAILY_QUEST_TEMPLATES, 3);

      // Calculate time range (today)
      const now = new Date();
      const activeFrom = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const activeUntil = new Date(activeFrom);
      activeUntil.setDate(activeUntil.getDate() + 1);

      const createdQuests: Quest[] = [];

      for (const template of selectedTemplates) {
        // Create quest
        const { data: quest, error: questError } = await supabase
          .from('quests')
          .insert({
            title: template.title,
            description: template.description,
            quest_type: 'daily',
            condition_type: template.condition_type,
            condition_value: template.condition_value,
            reward_coins: template.reward_coins,
            reward_xp: template.reward_xp,
            active_from: activeFrom.toISOString(),
            active_until: activeUntil.toISOString(),
          })
          .select()
          .single();

        if (questError) {
          console.error('Error creating quest:', questError);
          continue;
        }

        if (quest) {
          createdQuests.push(quest as Quest);

          // Create user quest
          await supabase
            .from('user_quests')
            .insert({
              user_id: userId,
              quest_id: quest.id,
              progress: 0,
              completed: false,
              reward_claimed: false,
            });
        }
      }

      return createdQuests;
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('GENERATION_FAILED', `Failed to generate daily quests: ${(error as Error).message}`);
    }
  }

  /**
   * Generate weekly quests for a user
   * - Creates 3 random weekly quests
   * - Quests are active for 7 days (until next Monday)
   * - Returns created quests
   * 
   * @param userId User ID
   * @returns Array of generated quests
   * @throws Error if generation fails
   * 
   * Requirements: 4.1, 4.2
   */
  async generateWeeklyQuests(userId: string): Promise<Quest[]> {
    if (!userId) {
      throw this.createError('MISSING_FIELDS', 'User ID is required');
    }

    try {
      // Select 3 random quest templates
      const selectedTemplates = this.selectRandomTemplates(WEEKLY_QUEST_TEMPLATES, 3);

      // Calculate time range (this week - Monday to Monday)
      const now = new Date();
      const activeFrom = this.getStartOfWeek(now);
      const activeUntil = new Date(activeFrom);
      activeUntil.setDate(activeUntil.getDate() + 7);

      const createdQuests: Quest[] = [];

      for (const template of selectedTemplates) {
        // Create quest
        const { data: quest, error: questError } = await supabase
          .from('quests')
          .insert({
            title: template.title,
            description: template.description,
            quest_type: 'weekly',
            condition_type: template.condition_type,
            condition_value: template.condition_value,
            reward_coins: template.reward_coins,
            reward_xp: template.reward_xp,
            active_from: activeFrom.toISOString(),
            active_until: activeUntil.toISOString(),
          })
          .select()
          .single();

        if (questError) {
          console.error('Error creating quest:', questError);
          continue;
        }

        if (quest) {
          createdQuests.push(quest as Quest);

          // Create user quest
          await supabase
            .from('user_quests')
            .insert({
              user_id: userId,
              quest_id: quest.id,
              progress: 0,
              completed: false,
              reward_claimed: false,
            });
        }
      }

      return createdQuests;
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('GENERATION_FAILED', `Failed to generate weekly quests: ${(error as Error).message}`);
    }
  }

  /**
   * Update quest progress
   * - Updates progress for a specific quest
   * - Caps progress at condition_value
   * - Marks as completed if progress reaches condition_value
   * - Returns updated user quest
   * 
   * @param userId User ID
   * @param questId Quest ID
   * @param progress New progress value
   * @returns Updated user quest
   * @throws Error if quest already completed or update fails
   * 
   * Requirements: 3.3, 4.3
   */
  async updateQuestProgress(userId: string, questId: string, progress: number): Promise<UserQuest> {
    if (!userId || !questId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Quest ID are required');
    }

    if (progress < 0) {
      throw this.createError('INVALID_PROGRESS', 'Progress cannot be negative');
    }

    try {
      // Get quest details
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (questError) {
        throw this.handleSupabaseError(questError);
      }

      if (!quest) {
        throw this.createError('NOT_FOUND', 'Quest not found');
      }

      // Get user quest
      const { data: userQuest, error: userQuestError } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (userQuestError) {
        throw this.handleSupabaseError(userQuestError);
      }

      if (!userQuest) {
        throw this.createError('NOT_FOUND', 'User quest not found');
      }

      // If already completed, ignore additional progress
      if (userQuest.completed) {
        return userQuest as UserQuest;
      }

      // Cap progress at condition_value
      const cappedProgress = Math.min(progress, quest.condition_value);
      const isCompleted = cappedProgress >= quest.condition_value;

      // Update user quest
      const { data: updatedQuest, error: updateError } = await supabase
        .from('user_quests')
        .update({
          progress: cappedProgress,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
        })
        .eq('id', userQuest.id)
        .select()
        .single();

      if (updateError) {
        throw this.handleSupabaseError(updateError);
      }

      if (!updatedQuest) {
        throw this.createError('UPDATE_FAILED', 'Failed to update quest progress');
      }

      return updatedQuest as UserQuest;
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('UPDATE_FAILED', `Failed to update quest progress: ${(error as Error).message}`);
    }
  }

  /**
   * Complete a quest and claim rewards
   * - Marks quest as completed
   * - Awards coins and XP
   * - Checks for bonus reward if all quests completed
   * - Returns reward information
   * 
   * @param userId User ID
   * @param questId Quest ID
   * @returns Quest rewards
   * @throws Error if quest not completed or reward already claimed
   * 
   * Requirements: 3.4, 3.5, 4.4, 4.5
   */
  async completeQuest(userId: string, questId: string): Promise<QuestReward> {
    if (!userId || !questId) {
      throw this.createError('MISSING_FIELDS', 'User ID and Quest ID are required');
    }

    try {
      // Get quest details
      const { data: quest, error: questError } = await supabase
        .from('quests')
        .select('*')
        .eq('id', questId)
        .single();

      if (questError) {
        throw this.handleSupabaseError(questError);
      }

      if (!quest) {
        throw this.createError('NOT_FOUND', 'Quest not found');
      }

      // Get user quest
      const { data: userQuest, error: userQuestError } = await supabase
        .from('user_quests')
        .select('*')
        .eq('user_id', userId)
        .eq('quest_id', questId)
        .single();

      if (userQuestError) {
        throw this.handleSupabaseError(userQuestError);
      }

      if (!userQuest) {
        throw this.createError('NOT_FOUND', 'User quest not found');
      }

      // Check if already claimed
      if (userQuest.reward_claimed) {
        throw this.createError('ALREADY_CLAIMED', 'Reward already claimed');
      }

      // Check if completed
      if (!userQuest.completed) {
        throw this.createError('NOT_COMPLETED', 'Quest not completed yet');
      }

      // Mark reward as claimed
      await supabase
        .from('user_quests')
        .update({ reward_claimed: true })
        .eq('id', userQuest.id);

      // Award coins
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('wisdom_coins')
        .eq('id', userId)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({
            wisdom_coins: profile.wisdom_coins + quest.reward_coins,
          })
          .eq('id', userId);

        // Record transaction
        await supabase
          .from('transactions')
          .insert({
            user_id: userId,
            amount: quest.reward_coins,
            transaction_type: 'leaderboard_reward',
            description: `Quest completed: ${quest.title}`,
          });
      }

      // Check if all quests of this type are completed for bonus
      const { data: allQuests } = await supabase
        .from('user_quests')
        .select(`
          *,
          quest:quests(quest_type, active_from, active_until)
        `)
        .eq('user_id', userId);

      const sameTypeQuests = (allQuests || []).filter((uq: any) => {
        return uq.quest && 
               uq.quest.quest_type === quest.quest_type &&
               uq.quest.active_from === quest.active_from &&
               uq.quest.active_until === quest.active_until;
      });

      const allCompleted = sameTypeQuests.length >= 3 && 
                          sameTypeQuests.every((uq: any) => uq.completed);

      let bonusCoins = 0;
      if (allCompleted) {
        // Award bonus for completing all quests
        bonusCoins = quest.quest_type === 'daily' ? 50 : 150;

        if (profile) {
          await supabase
            .from('user_profiles')
            .update({
              wisdom_coins: profile.wisdom_coins + quest.reward_coins + bonusCoins,
            })
            .eq('id', userId);

          // Record bonus transaction
          await supabase
            .from('transactions')
            .insert({
              user_id: userId,
              amount: bonusCoins,
              transaction_type: 'leaderboard_reward',
              description: `Bonus for completing all ${quest.quest_type} quests`,
            });
        }
      }

      return {
        coins: quest.reward_coins,
        xp: quest.reward_xp,
        bonus_coins: bonusCoins > 0 ? bonusCoins : undefined,
      };
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('COMPLETE_FAILED', `Failed to complete quest: ${(error as Error).message}`);
    }
  }

  /**
   * Check quest completion based on event
   * - Checks all active quests for the user
   * - Updates progress for matching quests
   * - Returns completed quests
   * 
   * @param userId User ID
   * @param eventType Type of event that occurred
   * @param value Value for the event
   * @returns Array of completed quests
   * @throws Error if check fails
   * 
   * Requirements: 3.3, 4.3, 15.1-15.5
   */
  async checkQuestCompletion(
    userId: string,
    eventType: QuestConditionType,
    value: number
  ): Promise<UserQuest[]> {
    if (!userId || !eventType || value === undefined) {
      throw this.createError('MISSING_FIELDS', 'User ID, event type, and value are required');
    }

    try {
      // Get all active quests for this user
      const activeQuests = await this.getActiveQuests(userId);

      const completedQuests: UserQuest[] = [];

      for (const userQuest of activeQuests) {
        // Get quest details
        const { data: quest } = await supabase
          .from('quests')
          .select('*')
          .eq('id', userQuest.quest_id)
          .single();

        if (!quest || quest.condition_type !== eventType) {
          continue;
        }

        // Update progress
        const newProgress = userQuest.progress + value;
        const updatedQuest = await this.updateQuestProgress(userId, quest.id, newProgress);

        if (updatedQuest.completed && !userQuest.completed) {
          completedQuests.push(updatedQuest);
        }
      }

      return completedQuests;
    } catch (error) {
      if (this.isQuestError(error)) {
        throw error;
      }
      throw this.createError('CHECK_FAILED', `Failed to check quest completion: ${(error as Error).message}`);
    }
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  /**
   * Select random templates from array
   */
  private selectRandomTemplates<T>(templates: T[], count: number): T[] {
    const shuffled = [...templates].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  /**
   * Get start of week (Monday)
   */
  private getStartOfWeek(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Create a QuestError
   */
  private createError(code: string, message: string): QuestError {
    return { code, message };
  }

  /**
   * Check if error is a QuestError
   */
  private isQuestError(error: unknown): error is QuestError {
    return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
  }

  /**
   * Handle Supabase errors and convert to QuestError
   */
  private handleSupabaseError(error: { message: string; code?: string }): QuestError {
    // Map common Supabase error codes
    if (error.message.includes('not found') || error.code === 'PGRST116') {
      return this.createError('NOT_FOUND', 'Quest not found');
    }

    if (error.message.includes('permission denied') || error.message.includes('RLS')) {
      return this.createError('UNAUTHORIZED', 'You do not have permission to access this quest');
    }

    if (error.message.includes('unique constraint')) {
      return this.createError('DUPLICATE', 'Duplicate entry');
    }

    if (error.message.includes('foreign key')) {
      return this.createError('INVALID_REFERENCE', 'Referenced resource not found');
    }

    // Default error
    return this.createError(error.code || 'UNKNOWN_ERROR', error.message);
  }
}

// Export singleton instance
export const questService = new QuestService();
