// src/utils/VoiceQueueManager.ts

interface QueueItem {
  key: string;
  url: string;
  priority: boolean;
}

class VoiceQueueManager {
  private queue: QueueItem[] = [];
  private isPlaying: boolean = false;
  private currentAudio: HTMLAudioElement | null = null;
  private isMuted: boolean = true;
  private basePath: string = '/sounds';

  public enqueue(_key: string, _priority: boolean = false): void {
    // ملغى تماماً بناء على طلب المستخدم "الغي اي صوت بالتطبيق وخاصة الملاحة"
    return;
  }

  private playNext(): void {
    if (this.queue.length === 0) {
      this.isPlaying = false;
      this.currentAudio = null;
      return;
    }

    this.isPlaying = true;
    const item = this.queue.shift();
    if (!item) return;

    const audio = new Audio(item.url);
    this.currentAudio = audio;

    audio.onended = () => {
      this.isPlaying = false;
      this.currentAudio = null;
      // فاصل زمني هادئ (150ms) بين التوجيهات المتتابعة
      setTimeout(() => this.playNext(), 150);
    };

    audio.onerror = (e) => {
      console.warn(`[كارجاس ميديا] تعذر تشغيل المقطع: ${item.key}`, e);
      this.isPlaying = false;
      this.currentAudio = null;
      this.playNext();
    };

    audio.play().catch((err) => {
      // يعالج قيود المتصفح حتى يتم تفاعل المستخدم الأول مع الواجهة
      console.warn('[كارجاس ميديا] في انتظار بدء التوجيه من السائق', err);
      this.isPlaying = false;
      this.currentAudio = null;
    });
  }

  public stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    this.isPlaying = false;
  }

  public clearQueue(): void {
    this.stopCurrent();
    this.queue = [];
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) this.clearQueue();
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.isMuted) this.clearQueue();
  }
}

export const voiceManager = new VoiceQueueManager();
