import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Sparkles, 
  Users, 
  Trophy, 
  Zap, 
  MessageCircle, 
  School,
  ArrowRight,
  CheckCircle,
  Star,
  Brain,
  Heart
} from 'lucide-react';

export function Landing() {
  const features = [
    {
      icon: <Brain className="w-6 h-6" />,
      title: 'ИИ-помощник',
      description: 'Персональный AI-эксперт для помощи в обучении'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: 'Интерактивные уроки',
      description: 'Создавайте и проходите увлекательные уроки'
    },
    {
      icon: <Trophy className="w-6 h-6" />,
      title: 'Геймификация',
      description: 'Зарабатывайте монеты и соревнуйтесь с друзьями'
    },
    {
      icon: <MessageCircle className="w-6 h-6" />,
      title: 'Чат с экспертом',
      description: 'Общайтесь с AI-экспертом по любым темам'
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: 'Для всей семьи',
      description: 'Родители могут следить за прогрессом детей'
    },
    {
      icon: <School className="w-6 h-6" />,
      title: 'Школьная интеграция',
      description: 'Учителя создают материалы для своих классов'
    }
  ];

  const plans = [
    {
      name: 'Free',
      price: '0',
      features: [
        '5 монет в день',
        'Базовые уроки',
        'Ограниченный чат',
        'Доступ к викторинам'
      ],
      gradient: 'from-slate-400 to-slate-500'
    },
    {
      name: 'Basic',
      price: '299',
      features: [
        '20 монет в день',
        'Все уроки',
        'Расширенный чат',
        'Создание уроков',
        'Статистика прогресса'
      ],
      gradient: 'from-blue-400 to-cyan-500',
      popular: true
    },
    {
      name: 'Premium',
      price: '599',
      features: [
        '50 монет в день',
        'Безлимитный доступ',
        'Приоритетная поддержка',
        'Семейный аккаунт',
        'Расширенная аналитика',
        'Эксклюзивный контент'
      ],
      gradient: 'from-purple-400 to-pink-500'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center shadow-lg wiggle-hover">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl sm:text-2xl font-black gradient-text">AILesson</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Link 
                to="/login" 
                className="px-3 sm:px-4 py-2 text-slate-600 hover:text-slate-900 font-medium transition-colors text-sm sm:text-base tap-target"
              >
                Войти
              </Link>
              <Link 
                to="/register" 
                className="px-4 sm:px-6 py-2.5 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all btn-shine text-sm sm:text-base tap-target"
              >
                <span className="hidden sm:inline">Начать бесплатно</span>
                <span className="sm:hidden">Начать</span>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <motion.section 
        className="pt-24 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <motion.div variants={itemVariants} className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary-100 to-purple-100 rounded-full mb-6 bounce-in">
              <Star className="w-4 h-4 text-primary-600" />
              <span className="text-xs sm:text-sm font-semibold text-primary-700">
                Платформа нового поколения для обучения
              </span>
            </div>
            
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-black text-slate-900 mb-6 leading-tight">
              Учитесь с помощью
              <span className="gradient-text block neon-glow">искусственного интеллекта</span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-10 max-w-2xl mx-auto">
              AILesson — это современная образовательная платформа с AI-помощником, 
              интерактивными уроками и геймификацией для учеников, учителей и родителей.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-base sm:text-lg btn-shine tap-target scale-hover"
              >
                Начать обучение
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a 
                href="#features" 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-4 bg-white text-slate-700 font-bold rounded-xl hover:shadow-lg transition-all text-base sm:text-lg border-2 border-slate-200 tap-target scale-hover"
              >
                Узнать больше
              </a>
            </div>
          </motion.div>

          {/* Hero Image/Animation */}
          <motion.div 
            variants={itemVariants}
            className="mt-12 sm:mt-16 relative"
          >
            <div className="glass rounded-2xl sm:rounded-3xl p-4 sm:p-8 max-w-5xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white scale-hover">
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg mb-2">1000+ уроков</h3>
                  <p className="text-xs sm:text-sm text-white/80">По всем школьным предметам</p>
                </div>
                <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white scale-hover">
                  <Users className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg mb-2">5000+ учеников</h3>
                  <p className="text-xs sm:text-sm text-white/80">Уже учатся с нами</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 text-white scale-hover">
                  <Trophy className="w-6 h-6 sm:w-8 sm:h-8 mb-3 sm:mb-4" />
                  <h3 className="font-bold text-base sm:text-lg mb-2">98% успеха</h3>
                  <p className="text-xs sm:text-sm text-white/80">Улучшение оценок</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Все для эффективного обучения
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600 max-w-2xl mx-auto">
              Мощные инструменты и функции для учеников, учителей и родителей
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="glass rounded-2xl p-5 sm:p-6 hover:shadow-xl transition-all card-hover scale-hover"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white mb-4 wiggle-hover">
                  {feature.icon}
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Как это работает
            </h2>
            <p className="text-xl text-slate-600">
              Три простых шага к эффективному обучению
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6">
                1
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Регистрация
              </h3>
              <p className="text-slate-600">
                Создайте аккаунт и выберите свою роль: ученик, учитель или родитель
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6">
                2
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Выбор уроков
              </h3>
              <p className="text-slate-600">
                Выберите интересующие предметы и начните проходить интерактивные уроки
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white text-3xl font-black mx-auto mb-6">
                3
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                Прогресс
              </h3>
              <p className="text-slate-600">
                Зарабатывайте монеты, соревнуйтесь и отслеживайте свой прогресс
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-4">
              Выберите свой план
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-slate-600">
              Начните бесплатно или выберите план с расширенными возможностями
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`glass rounded-2xl p-6 sm:p-8 ${plan.popular ? 'ring-4 ring-primary-500 scale-105' : ''} hover:shadow-xl transition-all card-hover scale-hover relative`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="px-4 py-1 bg-gradient-to-r from-primary-500 to-purple-500 text-white text-sm font-bold rounded-full">
                      Популярный
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-black gradient-text">
                      {plan.price}
                    </span>
                    <span className="text-slate-500">₽/мес</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to="/register"
                  className={`block w-full py-3 text-center font-bold rounded-xl transition-all ${
                    plan.popular
                      ? 'bg-gradient-to-r from-primary-500 to-purple-500 text-white hover:shadow-lg'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Начать
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-purple-500/10" />
            <div className="relative z-10">
              <Heart className="w-16 h-16 text-primary-500 mx-auto mb-6" />
              <h2 className="text-4xl font-black text-slate-900 mb-4">
                Готовы начать обучение?
              </h2>
              <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
                Присоединяйтесь к тысячам учеников, которые уже улучшили свои знания с AILesson
              </p>
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-bold rounded-xl hover:shadow-2xl hover:-translate-y-1 transition-all text-lg btn-shine"
              >
                Начать бесплатно
                <Zap className="w-5 h-5" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black">AILesson</span>
              </div>
              <p className="text-slate-400">
                Современная платформа для обучения с искусственным интеллектом
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Продукт</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#features" className="hover:text-white transition-colors">Возможности</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Цены</a></li>
                <li><Link to="/lessons" className="hover:text-white transition-colors">Уроки</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Компания</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">О нас</a></li>
                <li><Link to="/support" className="hover:text-white transition-colors">Поддержка</Link></li>
                <li><a href="#" className="hover:text-white transition-colors">Контакты</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Правовая информация</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Политика конфиденциальности</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Условия использования</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 text-center text-slate-400">
            <p>&copy; 2026 AILesson. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
