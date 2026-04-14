/**
 * Tutor Call Interface Component
 * Provides UI for voice calls with AI tutor
 */

import React, { useState, useEffect, useRef } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Clock, Coins } from 'lucide-react';
import { tutorCallService, TUTOR_VOICES } from '../../services/tutor-call.service';
import { useStore } from '../../store';
import type { TutorCallSession } from '../../services/tutor-call.service';

interface TutorCallInterfaceProps {
  subject?: string;
  onCallEnd?: (session: TutorCallSession) => void;
}

export const TutorCallInterface: React.FC<TutorCallInterfaceProps> = ({
  subject,
  onCallEnd,
}) => {
  const { user } = useStore();
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [currentSession, setCurrentSession] = useState<TutorCallSession | null>(null);
  const [affordability, setAffordability] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState(TUTOR_VOICES.female_friendly);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check affordability on mount
  useEffect(() => {
    if (user?.id) {
      checkAffordability();
    }
  }, [user?.id]);

  // Update elapsed time during call
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isCallActive]);

  const checkAffordability = async () => {
    if (!user?.id) return;

    try {
      const result = await tutorCallService.canAffordCall(user.id);
      setAffordability(result);
    } catch (err) {
      console.error('Failed to check affordability:', err);
    }
  };

  const startCall = async () => {
    if (!user?.id) {
      setError('Необходимо войти в систему');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Start call session
      const session = await tutorCallService.startCall(user.id, subject);
      setCurrentSession(session);
      setIsCallActive(true);
      setElapsedTime(0);

      // Start audio recording
      await tutorCallService.startAudioRecording();

      // Play welcome message
      await playTutorMessage('Здравствуйте! Я ваш AI-репетитор. Чем могу помочь?');
    } catch (err: any) {
      console.error('Failed to start call:', err);
      setError(err.message || 'Не удалось начать звонок');
      setIsCallActive(false);
    } finally {
      setIsLoading(false);
    }
  };

  const endCall = async () => {
    if (!user?.id || !currentSession) return;

    setIsLoading(true);

    try {
      // Stop audio recording
      tutorCallService.stopAudioRecording();

      // End call session
      const finalSession = await tutorCallService.endCall(user.id);
      setCurrentSession(finalSession);
      setIsCallActive(false);

      // Callback
      if (onCallEnd) {
        onCallEnd(finalSession);
      }

      // Refresh affordability
      await checkAffordability();
    } catch (err: any) {
      console.error('Failed to end call:', err);
      setError(err.message || 'Не удалось завершить звонок');
    } finally {
      setIsLoading(false);
    }
  };

  const playTutorMessage = async (text: string) => {
    try {
      const audioBlob = await tutorCallService.synthesizeSpeech(text, {
        voice: selectedVoice,
        speed: 1.0,
        stability: 0.5,
      });

      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        if (isSpeakerOn) {
          await audioRef.current.play();
        }
      }
    } catch (err) {
      console.error('Failed to play tutor message:', err);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In real implementation, this would mute the microphone
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    if (audioRef.current) {
      audioRef.current.muted = isSpeakerOn;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatCoins = (coins: number): string => {
    return coins.toLocaleString('ru-RU');
  };

  if (!affordability) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
      <audio ref={audioRef} className="hidden" />

      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isCallActive ? 'Звонок с репетитором' : 'AI Репетитор'}
        </h2>
        {subject && (
          <p className="text-sm text-gray-600">Предмет: {subject}</p>
        )}
      </div>

      {/* Balance Info */}
      {!isCallActive && (
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Ваш баланс:</span>
            <div className="flex items-center gap-1 text-blue-600 font-semibold">
              <Coins className="w-4 h-4" />
              <span>{formatCoins(affordability.currentBalance)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700">Минимальная стоимость:</span>
            <div className="flex items-center gap-1 text-gray-900">
              <Coins className="w-4 h-4" />
              <span className={affordability.discount > 0 ? 'line-through text-gray-400' : ''}>
                {formatCoins(affordability.minCost)}
              </span>
              {affordability.discount > 0 && (
                <span className="text-green-600 font-semibold ml-1">
                  {formatCoins(affordability.discountedCost)}
                </span>
              )}
            </div>
          </div>
          {affordability.discount > 0 && (
            <div className="text-xs text-green-600 text-center mt-2">
              Скидка {affordability.discount}% по подписке
            </div>
          )}
          <div className="text-xs text-gray-500 text-center mt-2">
            10 монет/минута • Минимум 5 минут
          </div>
        </div>
      )}

      {/* Call Timer */}
      {isCallActive && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 mb-6 text-white">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Clock className="w-6 h-6" />
            <span className="text-3xl font-bold">{formatTime(elapsedTime)}</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-sm">
            <Coins className="w-4 h-4" />
            <span>
              Списано: {formatCoins(currentSession?.coins_charged || 0)} монет
            </span>
          </div>
        </div>
      )}

      {/* Voice Selection */}
      {!isCallActive && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Голос репетитора:
          </label>
          <select
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={TUTOR_VOICES.female_friendly}>Женский (дружелюбный)</option>
            <option value={TUTOR_VOICES.male_professional}>Мужской (профессиональный)</option>
            <option value={TUTOR_VOICES.female_energetic}>Женский (энергичный)</option>
            <option value={TUTOR_VOICES.male_calm}>Мужской (спокойный)</option>
          </select>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Call Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        {isCallActive ? (
          <>
            {/* Mute Button */}
            <button
              onClick={toggleMute}
              className={`p-4 rounded-full transition-colors ${
                isMuted
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isMuted ? 'Включить микрофон' : 'Выключить микрофон'}
            >
              {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* End Call Button */}
            <button
              onClick={endCall}
              disabled={isLoading}
              className="p-6 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Завершить звонок"
            >
              <PhoneOff className="w-8 h-8" />
            </button>

            {/* Speaker Button */}
            <button
              onClick={toggleSpeaker}
              className={`p-4 rounded-full transition-colors ${
                !isSpeakerOn
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              title={isSpeakerOn ? 'Выключить звук' : 'Включить звук'}
            >
              {isSpeakerOn ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
          </>
        ) : (
          <button
            onClick={startCall}
            disabled={isLoading || !affordability.canAfford}
            className="px-8 py-4 rounded-full bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-lg font-semibold"
          >
            <Phone className="w-6 h-6" />
            {isLoading ? 'Подключение...' : 'Начать звонок'}
          </button>
        )}
      </div>

      {/* Insufficient Balance Warning */}
      {!isCallActive && !affordability.canAfford && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800 text-center">
            Недостаточно монет мудрости для звонка.
            <br />
            Необходимо минимум {formatCoins(affordability.discountedCost)} монет.
          </p>
        </div>
      )}

      {/* Info */}
      {!isCallActive && (
        <div className="text-xs text-gray-500 text-center mt-4">
          <p>Звонок с AI-репетитором использует технологию LMNT</p>
          <p className="mt-1">Убедитесь, что микрофон подключен и разрешен</p>
        </div>
      )}
    </div>
  );
};
