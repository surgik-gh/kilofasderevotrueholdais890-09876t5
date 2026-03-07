import { useState } from 'react';
import { useStore } from '@/store';
import { Layout } from '@/components/Layout';
import { generateLesson } from '@/services/ai.service';
import { lessonService } from '@/services/lesson.service';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Loader2, Coins, FileText, PenTool } from 'lucide-react';
import { ALL_SUBJECTS, SUBJECT_MAPPING } from '@/utils/subjects';
import { SubjectSelector } from '@/components/lessons/SubjectSelector';
import { toast } from '@/utils/toast';

type CreateMode = 'topic' | 'material';

// Token cost constants
const LESSON_CREATION_COST = 5;

export function LessonCreate() {
  const [topic, setTopic] = useState('');
  const [material, setMaterial] = useState('');
  const [subject, setSubject] = useState(ALL_SUBJECTS[0]);
  const [mode, setMode] = useState<CreateMode>('topic');
  const [isGenerating, setIsGenerating] = useState(false);

  const { profile } = useStore();
  const navigate = useNavigate();

  if (!profile) {
    navigate('/login');
    return null;
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const inputText = mode === 'topic' ? topic : material;
    if (!inputText.trim()) {
      toast.warning('Пожалуйста, введите тему или материал');
      return;
    }

    // Check balance
    if (profile.wisdom_coins < LESSON_CREATION_COST) {
      toast.error(`Недостаточно монет! Стоимость создания урока: ${LESSON_CREATION_COST} монет. У вас: ${profile.wisdom_coins} монет.`);
      return;
    }

    setIsGenerating(true);
    try {
      console.log('Starting lesson creation...');
      console.log('Mode:', mode);
      console.log('Subject:', subject);
      console.log('Input:', mode === 'topic' ? topic : material.substring(0, 100));
      
      // Generate lesson content using AI service (GPT-OSS 120B via Groq)
      console.log('Calling AI service...');
      const content = await generateLesson(
        mode === 'topic' ? topic : material, 
        subject as any,
        mode === 'material' ? material : undefined
      );
      
      console.log('AI content generated, length:', content.length);
      
      const title = mode === 'topic' 
        ? topic 
        : material.split('\n')[0].trim().substring(0, 100) || 'Обработанный материал';

      console.log('Creating lesson with title:', title);
      console.log('Profile data:', {
        id: profile.id,
        role: profile.role,
        school_id: profile.school_id
      });
      
      // Convert Russian subject name to English for database
      const subjectKey = SUBJECT_MAPPING[subject] || subject;
      console.log('Subject mapping:', subject, '->', subjectKey);
      
      console.log('About to call lessonService.createLesson...');
      
      // Create lesson via service (will deduct coins automatically)
      const newLesson = await lessonService.createLesson({
        title,
        subject: subjectKey as any,
        content,
        creatorId: profile.id,
        creatorRole: profile.role === 'teacher' ? 'teacher' : 'student',
        schoolId: profile.school_id
      });
      
      console.log('lessonService.createLesson returned:', newLesson);

      console.log('Lesson created successfully:', newLesson.id);
      toast.success('Урок успешно создан!');
      navigate(`/lesson/${newLesson.id}`);
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error type:', typeof error);
      console.error('Error constructor:', error?.constructor?.name);
      console.error('Error keys:', error ? Object.keys(error) : 'null');
      console.error('Error JSON:', JSON.stringify(error, null, 2));
      
      if (error && typeof error === 'object') {
        console.error('Error properties:');
        for (const key in error) {
          console.error(`  ${key}:`, (error as any)[key]);
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : 
                          (error && typeof error === 'object' && 'message' in error) ? (error as any).message :
                          JSON.stringify(error);
      toast.error(`Ошибка при создании урока: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Layout isThinking={isGenerating}>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 font-medium text-sm mb-4">
            <Sparkles className="w-4 h-4" />
            Создание урока с помощью GPT-OSS 120B
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Создать новый урок
          </h1>
          <p className="text-gray-600">
            Используйте AI для создания качественного учебного материала
          </p>
          
          {/* Balance Display */}
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
            <Coins className="w-5 h-5 text-amber-600" />
            <span className="text-sm text-gray-700">
              Ваш баланс: <span className="font-bold text-amber-600">{profile.wisdom_coins}</span> монет
            </span>
            <span className="text-xs text-gray-500 ml-2">
              (Стоимость: {LESSON_CREATION_COST} монет)
            </span>
          </div>
        </motion.div>

        {/* Mode Selector */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setMode('topic')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'topic'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <PenTool className={`w-6 h-6 mx-auto mb-2 ${mode === 'topic' ? 'text-primary-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">По теме</h3>
              <p className="text-xs text-gray-500 mt-1">AI создаст урок по вашей теме</p>
            </button>
            
            <button
              type="button"
              onClick={() => setMode('material')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'material'
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <FileText className={`w-6 h-6 mx-auto mb-2 ${mode === 'material' ? 'text-primary-600' : 'text-gray-400'}`} />
              <h3 className="font-semibold text-gray-900">Из материала</h3>
              <p className="text-xs text-gray-500 mt-1">AI обработает ваш текст</p>
            </button>
          </div>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onSubmit={handleCreate}
          className="space-y-6 liquid-glass rounded-2xl p-6"
        >
          {/* Subject Selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Предмет
            </label>
            <SubjectSelector
              value={subject}
              onChange={setSubject}
            />
          </div>

          {/* Topic or Material Input */}
          {mode === 'topic' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Тема урока
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Например: Квадратные уравнения"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all"
                required
                disabled={isGenerating}
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Учебный материал
              </label>
              <textarea
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="Вставьте текст учебного материала, который нужно обработать..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all resize-none"
                rows={8}
                required
                disabled={isGenerating}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating || profile.wisdom_coins < LESSON_CREATION_COST}
            className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="hidden sm:inline">Создание урока...</span>
                <span className="sm:hidden">Создание...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-5 h-5" />
                <span className="hidden sm:inline">Создать урок ({LESSON_CREATION_COST} монет)</span>
                <span className="sm:hidden">Создать ({LESSON_CREATION_COST})</span>
              </>
            )}
          </button>

          {profile.wisdom_coins < LESSON_CREATION_COST && (
            <p className="text-sm text-red-600 text-center">
              Недостаточно монет для создания урока
            </p>
          )}
        </motion.form>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200"
        >
          <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Как это работает
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• AI создаст структурированный учебный материал</li>
            <li>• Материал будет содержать теорию и примеры</li>
            <li>• Вы сможете редактировать созданный урок</li>
            <li>• Используется модель GPT-OSS 120B для качественного контента</li>
          </ul>
        </motion.div>
      </div>
    </Layout>
  );
}
