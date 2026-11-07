// src/components/CargasMapNavigation.tsx
import React, { useState, useEffect } from 'react';
import { voiceManager } from '../utils/VoiceQueueManager';
import { maneuverMapper, RouteStep } from '../utils/maneuverVoiceMapper';

interface Props {
  activeRouteSteps: RouteStep[];
  currentStepIndex: number;
  distanceToCurrentStep: number;
  isCargasStationTarget: boolean;
  onExitNavigation: () => void;
}

export const CargasMapNavigation: React.FC<Props> = ({
  activeRouteSteps,
  currentStepIndex,
  distanceToCurrentStep,
  isCargasStationTarget,
  onExitNavigation
}) => {
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(voiceManager.getIsMuted());

  // بدء الملاحة وتفعيل الصوت البشري من خلال نقرة المستخدم (تخطي قيود المتصفح)
  const handleStartTrip = () => {
    setIsNavigating(true);
    maneuverMapper.reset();
    voiceManager.clearQueue();
    voiceManager.enqueue('route_start', true);
  };

  // مراقبة المسافة ومناورة OSRM الحالية في كل تحديث GPS
  useEffect(() => {
    if (!isNavigating || !activeRouteSteps[currentStepIndex]) return;

    const currentStep = activeRouteSteps[currentStepIndex];
    const resolvedPrompt = maneuverMapper.resolveVoicePrompt(
      currentStepIndex,
      currentStep,
      distanceToCurrentStep,
      isCargasStationTarget
    );

    if (resolvedPrompt) {
      voiceManager.enqueue(resolvedPrompt.key, resolvedPrompt.priority);
    }
  }, [distanceToCurrentStep, currentStepIndex, isNavigating, activeRouteSteps, isCargasStationTarget]);

  const handleToggleMute = () => {
    const muted = voiceManager.toggleMute();
    setIsMuted(muted);
  };

  const handleStopTrip = () => {
    setIsNavigating(false);
    voiceManager.clearQueue();
    maneuverMapper.reset();
    onExitNavigation();
  };

  return (
    <div className="cargas-nav-bar fixed bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur text-white p-4 rounded-2xl shadow-2xl flex items-center justify-between border border-emerald-500/30 z-[700]">
      <div className="flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-sm font-semibold tracking-wide">
          طريقنا واحد - محطات كارجاس 🎙️
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!isNavigating ? (
          <button
            onClick={handleStartTrip}
            className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold px-5 py-2 rounded-xl transition duration-200 cursor-pointer shadow-md active:scale-95"
          >
            بدء الرحلة (صوت مصري بشري)
          </button>
        ) : (
          <>
            <button
              onClick={handleToggleMute}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-2 rounded-xl border border-slate-700 cursor-pointer transition text-xs font-bold"
              title="كتم الصوت"
            >
              {isMuted ? '🔇 مكتوم' : '🔊 صوت بشري'}
            </button>
            <button
              onClick={handleStopTrip}
              className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-2 rounded-xl cursor-pointer transition text-xs"
            >
              إنهاء
            </button>
          </>
        )}
      </div>
    </div>
  );
};
