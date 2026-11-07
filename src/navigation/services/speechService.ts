// Natural Arabic Navigation Speech Service - Cargas Road Guide Engine
// أصوات ملاحة بشرية مجانية (شاكر المصري، حامد العربي، وضاح المصري)
// تم استبعاد أي روابط صوتية روبوتية أو أنثوية تماماً

import { 
  NavigationVoiceId, 
  NAVIGATION_VOICES, 
  playNavigationVoice, 
  stopNavigationVoice,
  findBestVoiceForNavigation
} from '../../services/voiceNavigationService';

export type { NavigationVoiceId };

class SpeechService {
  private isMuted: boolean = true; // صامت تماماً بناء على طلب المستخدم
  private speechRate: number = 1.0;
  private currentVoiceId: NavigationVoiceId = 'silent';
  private audioCtx: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isAudioUnlocked: boolean = false;
  private listeners: ((voiceId: NavigationVoiceId) => void)[] = [];
  private muteListeners: ((muted: boolean) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const savedVoice = localStorage.getItem('cargas_navigation_voice_id');
        if (savedVoice && (savedVoice in NAVIGATION_VOICES)) {
          this.currentVoiceId = savedVoice as NavigationVoiceId;
        }
        const savedMuted = localStorage.getItem('cargas_navigation_muted');
        if (savedMuted !== null) {
          this.isMuted = savedMuted === 'true';
        } else {
          this.isMuted = true;
          localStorage.setItem('cargas_navigation_muted', 'true');
        }
      } catch {}

      // Unlock Web Audio and SpeechSynthesis on first interaction
      const unlockAudio = () => {
        if (this.isAudioUnlocked) return;
        try {
          if (!this.audioCtx) {
            const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioCtxClass) this.audioCtx = new AudioCtxClass();
          }
          if (this.audioCtx && this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
          }
          if ('speechSynthesis' in window) {
            window.speechSynthesis.resume();
          }
          this.isAudioUnlocked = true;
        } catch {}
      };

      window.addEventListener('click', unlockAudio, { passive: true });
      window.addEventListener('touchstart', unlockAudio, { passive: true });
      window.addEventListener('pointerdown', unlockAudio, { passive: true });

      // Cache speech synthesis voices
      if ('speechSynthesis' in window) {
        const updateVoices = () => {
          try {
            window.speechSynthesis.getVoices();
          } catch {}
        };
        updateVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = updateVoices;
        }
      }
    }
  }

  public getVoice(): NavigationVoiceId {
    return this.currentVoiceId;
  }

  public getVoiceMeta() {
    return NAVIGATION_VOICES[this.currentVoiceId] || NAVIGATION_VOICES.shakir_egyptian;
  }

  public setVoice(voiceId: NavigationVoiceId) {
    if (voiceId in NAVIGATION_VOICES) {
      this.currentVoiceId = voiceId;
      try {
        localStorage.setItem('cargas_navigation_voice_id', voiceId);
      } catch {}
      this.listeners.forEach(cb => {
        try { cb(voiceId); } catch {}
      });
      if (voiceId === 'silent') {
        this.setMuted(true);
      } else if (this.isMuted) {
        this.setMuted(false);
      }
    }
  }

  public subscribeVoice(listener: (voiceId: NavigationVoiceId) => void): () => void {
    this.listeners.push(listener);
    listener(this.currentVoiceId);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public subscribeMute(listener: (muted: boolean) => void): () => void {
    this.muteListeners.push(listener);
    listener(this.isMuted);
    return () => {
      this.muteListeners = this.muteListeners.filter(l => l !== listener);
    };
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('cargas_navigation_muted', String(muted));
    } catch {}
    if (muted) {
      this.stop();
    }
    this.muteListeners.forEach(cb => {
      try { cb(muted); } catch {}
    });
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public toggleMute(): boolean {
    const next = !this.isMuted;
    this.setMuted(next);
    return next;
  }

  public setSpeechRate(rate: number) {
    this.speechRate = Math.max(0.8, Math.min(1.8, rate));
  }

  public getSpeechRate(): number {
    return this.speechRate;
  }

  // Play subtle navigation acoustic chimes (ملغى تماماً بناء على طلب المستخدم)
  public playChime(_type: 'turn' | 'arrive' | 'alert' = 'turn') {
    return;
  }

  // Speak with Natural Human Male Arabic Voice (ملغى تماماً بناء على طلب المستخدم)
  public async speak(_text: string, _options?: { priority?: boolean; rate?: number; voiceId?: NavigationVoiceId }) {
    return;
  }

  // Test sample speech for a specific voice (ملغى تماماً)
  public speakSample(_voiceId?: NavigationVoiceId) {
    return;
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }
}

export const speechService = new SpeechService();
