import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Layout } from '../components/Layout';
import { Send, Plus, MessageSquare, X, HelpCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supportTicketService, SupportTicket } from '../services/support.service';
import { TicketChat } from '../components/support';

export const Support: React.FC = () => {
  const { profile } = useStore();
  const [isCreating, setIsCreating] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      loadUserTickets();
    }
  }, [profile]);

  const loadUserTickets = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const userTickets = await supportTicketService.getUserTickets(profile.id);
      setTickets(userTickets);
      setError(null);
    } catch (err) {
      console.error('Failed to load tickets:', err);
      setError('Не удалось загрузить тикеты');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setLoading(true);
    setError(null);

    try {
      await supportTicketService.createTicket(profile.id, {
        subject,
        description,
        priority
      });

      setSubject('');
      setDescription('');
      setPriority('medium');
      setIsCreating(false);
      
      // Reload tickets
      await loadUserTickets();
    } catch (err: any) {
      console.error('Failed to create ticket:', err);
      setError(err.message || 'Не удалось создать тикет');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary-100 to-purple-100 text-primary-700 font-medium text-sm mb-3">
              <HelpCircle className="w-4 h-4" />
              Техподдержка
            </div>
            <h1 className="text-3xl font-bold">
              <span className="gradient-text">Центр поддержки</span>
            </h1>
            <p className="text-slate-500 mt-1">Мы всегда готовы помочь!</p>
          </div>
          <button
            onClick={() => setIsCreating(!isCreating)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all ${
              isCreating 
                ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' 
                : 'bg-gradient-to-r from-primary-500 to-purple-500 text-white shadow-lg hover:shadow-xl btn-shine'
            }`}
          >
            {isCreating ? (
              <>
                <X size={20} />
                Отмена
              </>
            ) : (
              <>
                <Plus size={20} />
                Новый тикет
              </>
            )}
          </button>
        </motion.div>

        {/* Create Ticket Form */}
        <AnimatePresence>
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="glass rounded-2xl p-6 mb-8">
                <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary-500" />
                  Создание обращения
                </h2>
                
                {error && (
                  <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-r-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <p className="text-red-700">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Тема</label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                      placeholder="Например: Изменение школы"
                      required
                      minLength={3}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Приоритет</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as 'low' | 'medium' | 'high')}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                    >
                      <option value="low">🟢 Низкий</option>
                      <option value="medium">🟡 Средний</option>
                      <option value="high">🔴 Высокий</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Описание</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all resize-none"
                      rows={4}
                      placeholder="Опишите вашу проблему подробно..."
                      required
                      minLength={10}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-gradient-to-r from-primary-500 to-purple-500 text-white rounded-xl font-semibold flex justify-center items-center gap-2 hover:shadow-lg transition-all btn-shine disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={18} />
                    {loading ? 'Отправка...' : 'Отправить'}
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tickets List */}
        <div className="space-y-4">
          {loading && tickets.length === 0 ? (
            <div className="text-center py-16 glass rounded-2xl">
              <div className="w-20 h-20 bg-gradient-to-br from-primary-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <MessageSquare className="w-10 h-10 text-primary-500" />
              </div>
              <p className="text-slate-500">Загрузка тикетов...</p>
            </div>
          ) : tickets.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16 glass rounded-2xl"
            >
              <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-10 h-10 text-slate-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">У вас нет обращений</h3>
              <p className="text-slate-500">Нужна помощь? Создайте новый тикет!</p>
            </motion.div>
          ) : (
            tickets.map((ticket, index) => (
              <motion.div
                key={ticket.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">{ticket.subject}</h3>
                    <span className="text-sm text-slate-500">
                      {new Date(ticket.created_at).toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                      ticket.priority === 'high' ? 'bg-red-100 text-red-700' :
                      ticket.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {ticket.priority === 'high' ? '🔴 Высокий' :
                       ticket.priority === 'medium' ? '🟡 Средний' :
                       '🟢 Низкий'}
                    </span>
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold ${
                      ticket.status === 'open' ? 'bg-amber-100 text-amber-700' :
                      ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      ticket.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {ticket.status === 'open' ? '⏳ Открыт' :
                       ticket.status === 'in_progress' ? '🔄 В работе' :
                       ticket.status === 'resolved' ? '✅ Решён' :
                       '🔒 Закрыт'}
                    </span>
                  </div>
                </div>
                
                <div className="p-4 bg-slate-50 rounded-xl mb-4">
                  <p className="text-slate-600 whitespace-pre-wrap">{ticket.description}</p>
                </div>
                
                {/* Ticket Chat - shown when ticket is selected */}
                {selectedTicket === ticket.id && (
                  <TicketChat ticketId={ticket.id} />
                )}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};
