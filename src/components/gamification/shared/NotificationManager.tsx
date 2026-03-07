import { useState, useEffect } from 'react';
import { useStore } from '@/store';
import { useNotifications, useNotificationSettings } from '@/hooks/useNotifications';
import { NotificationToast } from './NotificationToast';
import { LevelUpAnimation } from '../level/LevelUpAnimation';
import { AchievementNotification } from '../achievements/AchievementNotification';
import { QuestNotification } from '../quests/QuestNotification';
import { MilestoneNotification } from '../milestones/MilestoneNotification';
import { StreakNotification } from '../streaks/StreakNotification';
import type { Achievement, UserQuest, Milestone, Streak } from '@/store';

/**
 * NotificationManager Component
 * 
 * Central manager for all gamification notifications
 * Handles displaying the appropriate notification component based on type
 * 
 * Requirements:
 * - 10.1: Show notification when achievement is unlocked
 * - 10.2: Show full-screen animation when level up occurs
 * - 10.3: Show notification when quest is completed
 * - 10.4: Show notification when milestone is achieved
 * - 10.5: Show notification when streak is achieved
 */
export function NotificationManager() {
  const { currentNotification, handleClose } = useNotifications();
  const { isEnabled } = useNotificationSettings();
  
  // State for specific notification types
  const [levelUpData, setLevelUpData] = useState<{ level: number; coins: number } | null>(null);
  const [achievementData, setAchievementData] = useState<Achievement | null>(null);
  const [questData, setQuestData] = useState<UserQuest | null>(null);
  const [milestoneData, setMilestoneData] = useState<Milestone | null>(null);
  const [streakData, setStreakData] = useState<Streak | null>(null);

  // Get data from store
  const achievements = useStore((state) => state.achievements);
  const activeQuests = useStore((state) => state.activeQuests);
  const milestones = useStore((state) => state.milestones);
  const streaks = useStore((state) => state.streaks);
  const userLevel = useStore((state) => state.userLevel);

  // Process current notification
  useEffect(() => {
    if (!currentNotification) {
      // Clear all data when no notification
      setLevelUpData(null);
      setAchievementData(null);
      setQuestData(null);
      setMilestoneData(null);
      setStreakData(null);
      return;
    }

    // Check if notification type is enabled
    if (!isEnabled(currentNotification.type)) {
      handleClose();
      return;
    }

    // Set appropriate data based on notification type
    switch (currentNotification.type) {
      case 'level_up':
        if (userLevel) {
          setLevelUpData({
            level: userLevel.level,
            coins: 50, // Default level up reward
          });
        }
        break;

      case 'achievement':
        // Try to find achievement from message or icon
        const achievementMatch = currentNotification.message.match(/achievement_id:(\S+)/);
        if (achievementMatch) {
          const achievementId = achievementMatch[1];
          const userAchievement = achievements.find(a => a.achievement_id === achievementId);
          if (userAchievement?.achievement) {
            setAchievementData(userAchievement.achievement);
          }
        }
        break;

      case 'quest':
        // Try to find quest from message
        const questMatch = currentNotification.message.match(/quest_id:(\S+)/);
        if (questMatch) {
          const questId = questMatch[1];
          const userQuest = activeQuests.find(q => q.quest_id === questId);
          if (userQuest) {
            setQuestData(userQuest);
          }
        }
        break;

      case 'milestone':
        // Try to find milestone from message
        const milestoneMatch = currentNotification.message.match(/milestone_id:(\S+)/);
        if (milestoneMatch) {
          const milestoneId = milestoneMatch[1];
          const userMilestone = milestones.find(m => m.milestone_id === milestoneId);
          if (userMilestone?.milestone) {
            setMilestoneData(userMilestone.milestone);
          }
        }
        break;

      case 'streak':
        // Try to find streak from message
        const streakMatch = currentNotification.message.match(/streak_type:(\S+)/);
        if (streakMatch) {
          const streakType = streakMatch[1];
          const streak = streaks.find(s => s.streak_type === streakType);
          if (streak) {
            setStreakData(streak);
          }
        }
        break;
    }
  }, [currentNotification, isEnabled, handleClose, achievements, activeQuests, milestones, streaks, userLevel]);

  if (!currentNotification) {
    return null;
  }

  // Render appropriate notification component
  switch (currentNotification.type) {
    case 'level_up':
      return levelUpData ? (
        <LevelUpAnimation
          isVisible={true}
          newLevel={levelUpData.level}
          coinsEarned={levelUpData.coins}
          onClose={handleClose}
        />
      ) : null;

    case 'achievement':
      return achievementData ? (
        <AchievementNotification
          achievement={achievementData}
          isVisible={true}
          onClose={handleClose}
        />
      ) : (
        <NotificationToast
          notification={currentNotification}
          isVisible={true}
          onClose={handleClose}
        />
      );

    case 'quest':
      return questData ? (
        <QuestNotification
          userQuest={questData}
          isVisible={true}
          onClose={handleClose}
        />
      ) : (
        <NotificationToast
          notification={currentNotification}
          isVisible={true}
          onClose={handleClose}
        />
      );

    case 'milestone':
      return milestoneData ? (
        <MilestoneNotification
          milestone={milestoneData}
          isVisible={true}
          onClose={handleClose}
        />
      ) : (
        <NotificationToast
          notification={currentNotification}
          isVisible={true}
          onClose={handleClose}
        />
      );

    case 'streak':
      return streakData ? (
        <StreakNotification
          streak={streakData}
          isVisible={true}
          onClose={handleClose}
        />
      ) : (
        <NotificationToast
          notification={currentNotification}
          isVisible={true}
          onClose={handleClose}
        />
      );

    default:
      return (
        <NotificationToast
          notification={currentNotification}
          isVisible={true}
          onClose={handleClose}
        />
      );
  }
}
