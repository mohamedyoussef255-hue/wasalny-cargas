// src/utils/maneuverVoiceMapper.ts

export interface StepManeuver {
  type: string;
  modifier?: string;
  exit?: number;
}

export interface RouteStep {
  maneuver: StepManeuver;
  distance: number; // بالمتر
  name: string;
}

class ManeuverVoiceMapper {
  private firedTriggers: Set<string> = new Set();

  public reset(): void {
    this.firedTriggers.clear();
  }

  public resolveVoicePrompt(
    stepIndex: number,
    step: RouteStep,
    distanceToStep: number,
    isCargasStation: boolean
  ): { key: string; priority: boolean } | null {
    const { type, modifier } = step.maneuver;

    // 1. التوجيه الفوري الحرج (أقل من 25 متر)
    if (distanceToStep <= 25 && distanceToStep > 0) {
      const triggerId = `${stepIndex}_immediate`;
      if (this.firedTriggers.has(triggerId)) return null;

      if (type === 'arrive') {
        this.firedTriggers.add(triggerId);
        return { key: isCargasStation ? 'cargas_arrived' : 'destination_arrived', priority: true };
      }
      if (modifier?.includes('right')) {
        this.firedTriggers.add(triggerId);
        return { key: 'turn_right_now', priority: true };
      }
      if (modifier?.includes('left')) {
        this.firedTriggers.add(triggerId);
        return { key: 'turn_left_now', priority: true };
      }
      if (modifier === 'uturn') {
        this.firedTriggers.add(triggerId);
        return { key: 'u_turn', priority: true };
      }
    }

    // 2. اقتراب خاص بمحطة كارجاس (بين 180 و 220 متر)
    if (isCargasStation && distanceToStep >= 180 && distanceToStep <= 220) {
      const triggerId = `${stepIndex}_cargas_200m`;
      if (!this.firedTriggers.has(triggerId)) {
        this.firedTriggers.add(triggerId);
        return { key: 'cargas_nearby', priority: false };
      }
    }

    // 3. مسافة تحذير قريبة (بين 80 و 120 متر)
    if (distanceToStep >= 80 && distanceToStep <= 120) {
      const triggerId = `${stepIndex}_100m`;
      if (this.firedTriggers.has(triggerId)) return null;

      if (modifier?.includes('right')) {
        this.firedTriggers.add(triggerId);
        return { key: 'turn_right_100m', priority: false };
      }
      if (modifier?.includes('left')) {
        this.firedTriggers.add(triggerId);
        return { key: 'turn_left_100m', priority: false };
      }
      if (type === 'roundabout' || type === 'rotary') {
        this.firedTriggers.add(triggerId);
        return { key: 'roundabout_first_exit', priority: false };
      }
    }

    // 4. مسافة استباقية بعيدة (بين 450 و 550 متر)
    if (distanceToStep >= 450 && distanceToStep <= 550) {
      const triggerId = `${stepIndex}_500m`;
      if (this.firedTriggers.has(triggerId)) return null;

      if (isCargasStation && type === 'arrive') {
        this.firedTriggers.add(triggerId);
        return { key: 'cargas_approaching', priority: false };
      }
      if (modifier?.includes('right')) {
        this.firedTriggers.add(triggerId);
        return { key: 'turn_right_500m', priority: false };
      }
      if (modifier?.includes('left')) {
        this.firedTriggers.add(triggerId);
        return { key: 'turn_left_500m', priority: false };
      }
    }

    return null;
  }
}

export const maneuverMapper = new ManeuverVoiceMapper();
