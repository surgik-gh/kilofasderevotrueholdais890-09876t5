import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type Role = 'student' | 'teacher' | 'parent' | 'administrator';

export type SubscriptionTier = 
  | 'student_freemium' | 'student_promium' | 'student_premium' | 'student_legend'
  | 'teacher_freemium' | 'teacher_promium' | 'teacher_premium' | 'teacher_maxi';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  full_name: string;
  school_id: string | null;
  subscription_tier: SubscriptionTier;
  wisdom_coins: number;
  daily_login_streak: number;
  last_login_date: string | null;
  free_expert_queries_remaining: number;
  created_at: string;
  updated_at: string;
}

// Legacy User interface for backward compatibility
export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  coins: number;
  plan: 'Freemium' | 'Promium' | 'Premium' | 'Legend' | 'Maxi';
  dailyLoginStreak: number;
  lastLoginDate: string;
  expertChatUsage: number;
  schoolId?: string;
  children?: string[]; // For parents: list of student IDs
  avatar?: string; // URL or base64 of avatar
  classId?: string; // For students: their class (e.g., "10А")
  assignedClasses?: string[]; // For teachers: classes they teach
}

export interface Lesson {
  id: string;
  title: string;
  subject: string;
  content: string; // Markdown or HTML
  creator_id: string;
  creator_role: 'student' | 'teacher';
  school_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LessonAssignment {
  id: string;
  lesson_id: string;
  student_id: string;
  assigned_at: string;
}

export interface Quiz {
  id: string;
  lesson_id: string;
  title: string;
  questions: QuizQuestion[];
  created_by: string;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question_text: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quiz_id: string;
  student_id: string;
  answers: number[];
  score_percentage: number;
  counts_for_leaderboard: boolean;
  completed_at: string;
}

export interface Chat {
  id: string;
  name: string;
  type: 'public' | 'school_parent' | 'school_teacher' | 'direct';
  school_id: string | null;
  invitation_code: string;
  created_by: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  sent_at: string;
}

export interface LeaderboardEntry {
  id: string;
  student_id: string;
  date: string;
  score: number;
  rank: number | null;
  reward_coins: number;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  transaction_type: string;
  description: string;
  created_at: string;
}

// Gamification types
export type AchievementCategory = 
  | 'learning' 
  | 'social' 
  | 'achievement' 
  | 'special';

export type AchievementRarity = 
  | 'common' 
  | 'rare' 
  | 'epic' 
  | 'legendary';

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  icon: string;
  reward_coins: number;
  reward_xp: number;
  condition_type: string;
  condition_value: number;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  progress: number;
  unlocked: boolean;
  unlocked_at: string | null;
  is_favorite: boolean;
  created_at: string;
  achievement?: Achievement;
}

export interface UserLevel {
  id: string;
  user_id: string;
  level: number;
  experience_points: number;
  experience_to_next_level: number;
  total_experience: number;
  updated_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  quest_type: 'daily' | 'weekly';
  condition_type: string;
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
  quest?: Quest;
}

export interface Streak {
  id: string;
  user_id: string;
  streak_type: string;
  current_count: number;
  best_count: number;
  last_activity_date: string;
  created_at: string;
  updated_at: string;
}

export interface Challenge {
  id: string;
  creator_id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  start_date: string;
  end_date: string;
  reward_coins: number;
  reward_xp: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  winner_id: string | null;
  created_at: string;
}

export interface Milestone {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  threshold: number;
  reward_coins: number;
  reward_xp: number;
  icon: string;
  created_at: string;
}

export interface UserMilestone {
  id: string;
  user_id: string;
  milestone_id: string;
  achieved: boolean;
  achieved_at: string | null;
  created_at: string;
  milestone?: Milestone;
}

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  theme: string;
  start_date: string;
  end_date: string;
  active: boolean;
  special_quests: string[];
  special_achievements: string[];
  created_at: string;
}

export interface GamificationNotification {
  id: string;
  type: 'achievement' | 'level_up' | 'quest' | 'milestone' | 'streak';
  title: string;
  message: string;
  icon?: string;
  animation?: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  created_at: string;
  updated_at: string;
}

export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  sent_at: string;
}

interface AppState {
  // Auth state
  session: Session | null;
  user: SupabaseUser | null;
  profile: UserProfile | null;
  
  // Token balance state
  wisdomCoins: number;
  transactions: Transaction[];
  freeExpertQueries: number;
  
  // Gamification state
  userLevel: UserLevel | null;
  achievements: UserAchievement[];
  activeQuests: UserQuest[];
  streaks: Streak[];
  challenges: Challenge[];
  milestones: UserMilestone[];
  activeSeasonalEvent: SeasonalEvent | null;
  notifications: GamificationNotification[];
  
  // Leaderboard state
  leaderboard: LeaderboardEntry[];
  currentUserRank: number | null;
  
  // Chat state
  chats: Chat[];
  activeChat: Chat | null;
  chatMessages: Record<string, ChatMessage[]>; // chatId -> messages
  
  // Lesson/Quiz state
  lessons: Lesson[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  lessonAssignments: LessonAssignment[];
  
  // Support state
  tickets: SupportTicket[];
  activeTicket: SupportTicket | null;
  ticketMessages: Record<string, TicketMessage[]>; // ticketId -> messages
  
  // Loading states
  isLoading: boolean;
  error: string | null;

  // Auth actions
  setSession: (session: Session | null, user: SupabaseUser | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  logout: () => void;
  
  // Token balance actions
  setWisdomCoins: (coins: number) => void;
  updateWisdomCoins: (delta: number) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  setFreeExpertQueries: (queries: number) => void;
  decrementFreeExpertQueries: () => void;
  
  // Gamification actions
  loadGamificationData: (userId: string) => Promise<void>;
  setUserLevel: (level: UserLevel | null) => void;
  updateLevel: (level: UserLevel) => void;
  setAchievements: (achievements: UserAchievement[]) => void;
  updateAchievements: (achievements: UserAchievement[]) => void;
  unlockAchievement: (achievementId: string) => void;
  setActiveQuests: (quests: UserQuest[]) => void;
  updateQuests: (quests: UserQuest[]) => void;
  completeQuest: (questId: string) => void;
  setStreaks: (streaks: Streak[]) => void;
  updateStreak: (streak: Streak) => void;
  setChallenges: (challenges: Challenge[]) => void;
  addChallenge: (challenge: Challenge) => void;
  setMilestones: (milestones: UserMilestone[]) => void;
  achieveMilestone: (milestoneId: string) => void;
  setActiveSeasonalEvent: (event: SeasonalEvent | null) => void;
  addNotification: (notification: Omit<GamificationNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Leaderboard actions
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setCurrentUserRank: (rank: number | null) => void;
  updateLeaderboardScore: (studentId: string, points: number) => void;
  
  // Chat actions
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  setActiveChat: (chat: Chat | null) => void;
  setChatMessages: (chatId: string, messages: ChatMessage[]) => void;
  addChatMessage: (chatId: string, message: ChatMessage) => void;
  
  // Lesson/Quiz actions
  setLessons: (lessons: Lesson[]) => void;
  addLesson: (lesson: Lesson) => void;
  updateLesson: (lessonId: string, updates: Partial<Lesson>) => void;
  deleteLesson: (lessonId: string) => void;
  setQuizzes: (quizzes: Quiz[]) => void;
  addQuiz: (quiz: Quiz) => void;
  setQuizAttempts: (attempts: QuizAttempt[]) => void;
  addQuizAttempt: (attempt: QuizAttempt) => void;
  setLessonAssignments: (assignments: LessonAssignment[]) => void;
  
  // Support actions
  setTickets: (tickets: SupportTicket[]) => void;
  addTicket: (ticket: SupportTicket) => void;
  updateTicket: (ticketId: string, updates: Partial<SupportTicket>) => void;
  setActiveTicket: (ticket: SupportTicket | null) => void;
  setTicketMessages: (ticketId: string, messages: TicketMessage[]) => void;
  addTicketMessage: (ticketId: string, message: TicketMessage) => void;
  
  // UI state actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Legacy compatibility - keep old User interface for backward compatibility
  currentUser: User | null;
  users: User[];
  login: (email: string, role: Role, name?: string, schoolId?: string) => void;
  addCoins: (amount: number) => void;
  subtractCoins: (amount: number) => boolean;
  createLesson: (lesson: any) => void;
  createQuiz: (quiz: any) => void;
  addMessage: (chatId: string, message: any) => void;
  createChat: (type: string, participants: string[], name?: string, classId?: string) => string;
  checkDailyLogin: () => void;
  resetDailyStats: () => void;
  updateLeaderboard: (userId: string, points: number) => void;
  createTicket: (ticket: any) => void;
  resolveTicket: (ticketId: string, response: string) => void;
  submitQuizResult: (userId: string, quizId: string, score: number) => void;
  addChild: (parentId: string, childEmail: string) => boolean;
  addResource: (resource: any) => void;
  updateProfile: (name: string, avatar?: string) => void;
  createSchoolClass: (name: string, schoolId: string) => string;
  addUserToClass: (classId: string, userId: string, role: 'student' | 'teacher') => void;
  assignLessonToClasses: (lessonId: string, classIds: string[]) => void;
  addSchoolUser: (role: Role, name: string, email: string, classId?: string) => void;
  addUserCoins: (userId: string, amount: number) => void;
  quizResults: { userId: string; quizId: string; score: number; timestamp: string }[];
  resources: any[];
  schoolClasses: any[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth state
      session: null,
      user: null,
      profile: null,
      
      // Token balance state
      wisdomCoins: 0,
      transactions: [],
      freeExpertQueries: 0,
      
      // Gamification state
      userLevel: null,
      achievements: [],
      activeQuests: [],
      streaks: [],
      challenges: [],
      milestones: [],
      activeSeasonalEvent: null,
      notifications: [],
      
      // Leaderboard state
      leaderboard: [],
      currentUserRank: null,
      
      // Chat state
      chats: [],
      activeChat: null,
      chatMessages: {},
      
      // Lesson/Quiz state
      lessons: [],
      quizzes: [],
      quizAttempts: [],
      lessonAssignments: [],
      
      // Support state
      tickets: [],
      activeTicket: null,
      ticketMessages: {},
      
      // Loading states
      isLoading: false,
      error: null,

      // Auth actions
      setSession: (session, user) => set({ session, user }),
      
      setProfile: (profile) => {
        set({ profile });
        if (profile) {
          set({
            wisdomCoins: profile.wisdom_coins,
            freeExpertQueries: profile.free_expert_queries_remaining,
          });
        }
      },
      
      logout: () => set({
        session: null,
        user: null,
        profile: null,
        wisdomCoins: 0,
        transactions: [],
        freeExpertQueries: 0,
        userLevel: null,
        achievements: [],
        activeQuests: [],
        streaks: [],
        challenges: [],
        milestones: [],
        activeSeasonalEvent: null,
        notifications: [],
        leaderboard: [],
        currentUserRank: null,
        chats: [],
        activeChat: null,
        chatMessages: {},
        lessons: [],
        quizzes: [],
        quizAttempts: [],
        lessonAssignments: [],
        tickets: [],
        activeTicket: null,
        ticketMessages: {},
        currentUser: null,
      }),
      
      // Token balance actions
      setWisdomCoins: (coins) => set({ wisdomCoins: coins }),
      
      updateWisdomCoins: (delta) => set((state) => ({
        wisdomCoins: state.wisdomCoins + delta,
        profile: state.profile ? {
          ...state.profile,
          wisdom_coins: state.profile.wisdom_coins + delta,
        } : null,
      })),
      
      setTransactions: (transactions) => set({ transactions }),
      
      addTransaction: (transaction) => set((state) => ({
        transactions: [transaction, ...state.transactions],
      })),
      
      setFreeExpertQueries: (queries) => set({ freeExpertQueries: queries }),
      
      decrementFreeExpertQueries: () => set((state) => ({
        freeExpertQueries: Math.max(0, state.freeExpertQueries - 1),
        profile: state.profile ? {
          ...state.profile,
          free_expert_queries_remaining: Math.max(0, state.profile.free_expert_queries_remaining - 1),
        } : null,
      })),
      
      // Gamification actions
      loadGamificationData: async (userId: string) => {
        try {
          // Import services dynamically to avoid circular dependencies
          const { achievementService } = await import('./services/gamification/achievement.service');
          const { experienceService } = await import('./services/gamification/experience.service');
          const { questService } = await import('./services/gamification/quest.service');
          const { streakService } = await import('./services/gamification/streak.service');
          const { challengeService } = await import('./services/gamification/challenge.service');
          const { milestoneService } = await import('./services/gamification/milestone.service');
          const { seasonalEventService } = await import('./services/gamification/seasonal-event.service');
          
          // Load all gamification data in parallel
          const [
            userLevel,
            userAchievements,
            activeQuests,
            userStreaks,
            userChallenges,
            userMilestones,
            activeEvent,
          ] = await Promise.all([
            experienceService.getUserLevel(userId),
            achievementService.getUserAchievements(userId),
            questService.getActiveQuests(userId),
            streakService.getUserStreaks(userId),
            challengeService.getUserChallenges(userId),
            milestoneService.getUserMilestones(userId),
            seasonalEventService.getActiveEvent(),
          ]);
          
          set({
            userLevel,
            achievements: userAchievements,
            activeQuests,
            streaks: userStreaks,
            challenges: userChallenges,
            milestones: userMilestones,
            activeSeasonalEvent: activeEvent,
          });
        } catch (error) {
          console.error('Failed to load gamification data:', error);
          set({ error: 'Failed to load gamification data' });
        }
      },
      
      setUserLevel: (level) => set({ userLevel: level }),
      
      updateLevel: (level) => set({ userLevel: level }),
      
      setAchievements: (achievements) => set({ achievements }),
      
      updateAchievements: (achievements) => set({ achievements }),
      
      unlockAchievement: (achievementId) => set((state) => ({
        achievements: state.achievements.map(a =>
          a.achievement_id === achievementId
            ? { ...a, unlocked: true, unlocked_at: new Date().toISOString() }
            : a
        ),
      })),
      
      setActiveQuests: (quests) => set({ activeQuests: quests }),
      
      updateQuests: (quests) => set({ activeQuests: quests }),
      
      completeQuest: (questId) => set((state) => ({
        activeQuests: state.activeQuests.map(q =>
          q.quest_id === questId
            ? { ...q, completed: true, completed_at: new Date().toISOString() }
            : q
        ),
      })),
      
      setStreaks: (streaks) => set({ streaks }),
      
      updateStreak: (streak) => set((state) => ({
        streaks: state.streaks.map(s =>
          s.streak_type === streak.streak_type ? streak : s
        ),
      })),
      
      setChallenges: (challenges) => set({ challenges }),
      
      addChallenge: (challenge) => set((state) => ({
        challenges: [...state.challenges, challenge],
      })),
      
      setMilestones: (milestones) => set({ milestones }),
      
      achieveMilestone: (milestoneId) => set((state) => ({
        milestones: state.milestones.map(m =>
          m.milestone_id === milestoneId
            ? { ...m, achieved: true, achieved_at: new Date().toISOString() }
            : m
        ),
      })),
      
      setActiveSeasonalEvent: (event) => set({ activeSeasonalEvent: event }),
      
      addNotification: (notification) => set((state) => ({
        notifications: [
          {
            ...notification,
            id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
          },
          ...state.notifications,
        ],
      })),
      
      dismissNotification: (id) => set((state) => ({
        notifications: state.notifications.filter(n => n.id !== id),
      })),
      
      clearNotifications: () => set({ notifications: [] }),
      
      // Leaderboard actions
      setLeaderboard: (entries) => set({ leaderboard: entries }),
      
      setCurrentUserRank: (rank) => set({ currentUserRank: rank }),
      
      updateLeaderboardScore: (studentId, points) => set((state) => {
        const existingEntry = state.leaderboard.find(e => e.student_id === studentId);
        if (existingEntry) {
          return {
            leaderboard: state.leaderboard
              .map(e => e.student_id === studentId ? { ...e, score: e.score + points } : e)
              .sort((a, b) => b.score - a.score),
          };
        } else {
          const newEntry: LeaderboardEntry = {
            id: `temp-${Date.now()}`,
            student_id: studentId,
            date: new Date().toISOString().split('T')[0],
            score: points,
            rank: null,
            reward_coins: 0,
            updated_at: new Date().toISOString(),
          };
          return {
            leaderboard: [...state.leaderboard, newEntry].sort((a, b) => b.score - a.score),
          };
        }
      }),
      
      // Chat actions
      setChats: (chats) => set({ chats }),
      
      addChat: (chat) => set((state) => ({
        chats: [...state.chats, chat],
      })),
      
      setActiveChat: (chat) => set({ activeChat: chat }),
      
      setChatMessages: (chatId, messages) => set((state) => ({
        chatMessages: { ...state.chatMessages, [chatId]: messages },
      })),
      
      addChatMessage: (chatId, message) => set((state) => ({
        chatMessages: {
          ...state.chatMessages,
          [chatId]: [...(state.chatMessages[chatId] || []), message],
        },
      })),
      
      // Lesson/Quiz actions
      setLessons: (lessons) => set({ lessons }),
      
      addLesson: (lesson) => set((state) => ({
        lessons: [...state.lessons, lesson],
      })),
      
      updateLesson: (lessonId, updates) => set((state) => ({
        lessons: state.lessons.map(l => l.id === lessonId ? { ...l, ...updates } : l),
      })),
      
      deleteLesson: (lessonId) => set((state) => ({
        lessons: state.lessons.filter(l => l.id !== lessonId),
        quizzes: state.quizzes.filter(q => q.lesson_id !== lessonId),
      })),
      
      setQuizzes: (quizzes) => set({ quizzes }),
      
      addQuiz: (quiz) => set((state) => ({
        quizzes: [...state.quizzes, quiz],
      })),
      
      setQuizAttempts: (attempts) => set({ quizAttempts: attempts }),
      
      addQuizAttempt: (attempt) => set((state) => ({
        quizAttempts: [...state.quizAttempts, attempt],
      })),
      
      setLessonAssignments: (assignments) => set({ lessonAssignments: assignments }),
      
      // Support actions
      setTickets: (tickets) => set({ tickets }),
      
      addTicket: (ticket) => set((state) => ({
        tickets: [...state.tickets, ticket],
      })),
      
      updateTicket: (ticketId, updates) => set((state) => ({
        tickets: state.tickets.map(t => t.id === ticketId ? { ...t, ...updates } : t),
      })),
      
      setActiveTicket: (ticket) => set({ activeTicket: ticket }),
      
      setTicketMessages: (ticketId, messages) => set((state) => ({
        ticketMessages: { ...state.ticketMessages, [ticketId]: messages },
      })),
      
      addTicketMessage: (ticketId, message) => set((state) => ({
        ticketMessages: {
          ...state.ticketMessages,
          [ticketId]: [...(state.ticketMessages[ticketId] || []), message],
        },
      })),
      
      // UI state actions
      setLoading: (loading) => set({ isLoading: loading }),
      
      setError: (error) => set({ error }),
      
      clearError: () => set({ error: null }),

      // Legacy compatibility
      currentUser: null,
      users: [],
      quizResults: [],
      resources: [],
      schoolClasses: [],

      addResource: (resource) => set(state => ({ resources: [...state.resources, resource] })),
      
      updateProfile: (name, avatar) => set(state => {
        if (!state.currentUser) return state;
        const updatedUser = { 
          ...state.currentUser, 
          name,
          ...(avatar && { avatar })
        };
        return {
          currentUser: updatedUser,
          users: state.users.map(u => u.id === state.currentUser!.id ? updatedUser : u)
        };
      }),

      createSchoolClass: (name, schoolId) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newClass: any = { id, name, schoolId, teacherIds: [], studentIds: [] };
        set(state => ({ schoolClasses: [...state.schoolClasses, newClass] }));
        
        // Create a chat for this class
        get().createChat('group', [], `Класс ${name}`);
        
        return id;
      },

      addUserToClass: (classId, userId, role) => set(state => ({
        schoolClasses: state.schoolClasses.map((c: any) => {
          if (c.id !== classId) return c;
          if (role === 'student') {
            return { ...c, studentIds: [...c.studentIds, userId] };
          } else {
            return { ...c, teacherIds: [...c.teacherIds, userId] };
          }
        }),
        users: state.users.map(u => {
          if (u.id !== userId) return u;
          if (role === 'student') {
            return { ...u, classId };
          } else {
            return { ...u, assignedClasses: [...(u.assignedClasses || []), classId] };
          }
        })
      })),

      assignLessonToClasses: (lessonId, classIds) => set(state => ({
        lessons: state.lessons.map(l => 
          l.id === lessonId ? { ...l, assignedClasses: classIds } as any : l
        )
      })),

      addSchoolUser: (role, name, email, classId) => {
        const state = get();
        const schoolId = state.currentUser?.schoolId;
        if (!schoolId) return;

        const initialTokens = role === 'teacher' ? 150 : 50;
        const newUser: User = {
          id: Math.random().toString(36).substr(2, 9),
          name,
          email,
          role,
          coins: initialTokens,
          plan: 'Freemium',
          dailyLoginStreak: 0,
          lastLoginDate: '',
          expertChatUsage: 0,
          schoolId,
          classId: role === 'student' ? classId : undefined,
          assignedClasses: role === 'teacher' && classId ? [classId] : []
        };

        set(state => ({ users: [...state.users, newUser] }));

        // Add to class if specified
        if (classId) {
          get().addUserToClass(classId, newUser.id, role === 'student' ? 'student' : 'teacher');
        }
      },

      login: (email, role, name, schoolId) => {
        const { users } = get();
        let user = users.find(u => u.email === email);
        if (!user) {
          // Register new user
          const initialTokens = role === 'teacher' ? 150 : 50;
          user = {
            id: Math.random().toString(36).substr(2, 9),
            name: name || email.split('@')[0],
            email,
            role,
            coins: initialTokens,
            plan: 'Freemium',
            dailyLoginStreak: 0,
            lastLoginDate: '',
            expertChatUsage: 0,
            schoolId
          };
          set(state => ({ users: [...state.users, user!] }));
        }
        set({ currentUser: user });
        get().checkDailyLogin();
      },

      addCoins: (amount) => set(state => {
        if (!state.currentUser) return state;
        const updatedUser = { ...state.currentUser, coins: state.currentUser.coins + amount };
        return {
          currentUser: updatedUser,
          users: state.users.map(u => u.id === state.currentUser!.id ? updatedUser : u)
        };
      }),

      subtractCoins: (amount) => {
        const state = get();
        if (!state.currentUser || state.currentUser.coins < amount) return false;
        
        const updatedUser = { ...state.currentUser, coins: state.currentUser.coins - amount };
        set({
          currentUser: updatedUser,
          users: state.users.map(u => u.id === state.currentUser!.id ? updatedUser : u)
        });
        return true;
      },

      createLesson: (lesson) => set(state => ({ lessons: [...state.lessons, lesson as any] })),
      
      createQuiz: (quiz) => set(state => {
        // Find lesson and mark as having quiz
        const updatedLessons = state.lessons.map((l: any) => 
          l.id === quiz.lessonId ? { ...l, hasQuiz: true, quizId: quiz.id } : l
        );
        return { quizzes: [...state.quizzes, quiz as any], lessons: updatedLessons };
      }),

      addMessage: (chatId, message) => set(state => ({
        chats: state.chats.map((c: any) => c.id === chatId ? { ...c, messages: [...c.messages, message] } : c)
      })),

      createChat: (type, participants, name, classId) => {
        const id = Math.random().toString(36).substr(2, 9);
        const newChat: any = { 
          id, 
          participants, 
          messages: [], 
          type, 
          name,
          classId
        };
        set(state => ({ chats: [...state.chats, newChat] }));
        return id;
      },

      checkDailyLogin: () => {
        const state = get();
        if (!state.currentUser) return;
        
        const today = new Date().toDateString();
        if (state.currentUser.lastLoginDate !== today) {
          // Award daily login tokens
          const PLANS: any = {
            student: {
              Freemium: { tokens: 50, daily: 10, chatLimit: 5 },
              Promium: { tokens: 150, daily: 30, chatLimit: 10 },
              Premium: { tokens: 250, daily: 50, chatLimit: 15 },
              Legend: { tokens: 500, daily: 90, chatLimit: 30 },
            },
            teacher: {
              Freemium: { tokens: 150, daily: 15, chatLimit: 5 },
              Promium: { tokens: 200, daily: 35, chatLimit: 10 },
              Premium: { tokens: 350, daily: 55, chatLimit: 15 },
              Maxi: { tokens: 800, daily: 100, chatLimit: 30 },
            }
          };
          const planDetails = PLANS[state.currentUser.role]?.[state.currentUser.plan] || PLANS.student.Freemium;
          const reward = planDetails.daily;
          
          const updatedUser = {
            ...state.currentUser,
            coins: state.currentUser.coins + reward,
            lastLoginDate: today,
            expertChatUsage: 0 // Reset daily chat limit
          };
          
          set({
            currentUser: updatedUser,
            users: state.users.map(u => u.id === state.currentUser!.id ? updatedUser : u)
          });
        }
      },

      resetDailyStats: () => {
        // This should be called by a timer or backend in reality.
      },

      updateLeaderboard: (userId, points) => set(state => {
        const entry = state.leaderboard.find((l: any) => l.userId === userId);
        let newLeaderboard;
        if (entry) {
          newLeaderboard = state.leaderboard.map((l: any) => l.userId === userId ? { ...l, score: l.score + points } : l);
        } else {
          newLeaderboard = [...state.leaderboard, { userId, score: points } as any];
        }
        return { leaderboard: newLeaderboard.sort((a: any, b: any) => b.score - a.score) };
      }),

      createTicket: (ticket) => set(state => ({ tickets: [...state.tickets, ticket as any] })),

      resolveTicket: (ticketId, response) => set(state => ({
        tickets: state.tickets.map((t: any) => t.id === ticketId ? { ...t, status: 'closed', response } : t)
      })),

      submitQuizResult: (userId, quizId, score) => set(state => {
        // Record result
        const newResult = { userId, quizId, score, timestamp: new Date().toISOString() };
        return { quizResults: [...state.quizResults, newResult] };
      }),

      addChild: (parentId, childEmail) => {
        const state = get();
        const child = state.users.find(u => u.email === childEmail && u.role === 'student');
        if (!child) return false;

        const updatedParent = {
          ...state.currentUser!,
          children: [...(state.currentUser!.children || []), child.id]
        };

        set({
          currentUser: updatedParent,
          users: state.users.map(u => u.id === parentId ? updatedParent : u)
        });
        return true;
      },

      addUserCoins: (userId, amount) => set(state => {
        const updatedUsers = state.users.map(u => 
          u.id === userId ? { ...u, coins: u.coins + amount } : u
        );
        
        // Update current user if it's the same person
        const updatedCurrentUser = state.currentUser && state.currentUser.id === userId
          ? { ...state.currentUser, coins: state.currentUser.coins + amount }
          : state.currentUser;
          
        return {
          users: updatedUsers,
          currentUser: updatedCurrentUser
        };
      }),
    }),
    {
      name: 'ailesson-storage',
      partialize: (state) => ({
        // Only persist essential data
        session: state.session,
        user: state.user,
        profile: state.profile,
        wisdomCoins: state.wisdomCoins,
        freeExpertQueries: state.freeExpertQueries,
        // Gamification state
        userLevel: state.userLevel,
        achievements: state.achievements,
        activeQuests: state.activeQuests,
        streaks: state.streaks,
        milestones: state.milestones,
        // Legacy
        currentUser: state.currentUser,
        users: state.users,
      }),
    }
  )
);
