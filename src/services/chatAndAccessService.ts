/**
 * منظومة المراسلات والشات الداخلي وإدارة تصاريح الدخول
 * شركة عزوتي للبرمجيات وتكنولوجيا المعلومات - المطور: محمد عبد الرحمن يوسف
 */

import { StaffMember, ChatMessage, ChatRoom, ChatRoomType, SupervisorDelegation } from '../types';

const CHAT_ROOMS_KEY = 'cargas_chat_rooms';
const CHAT_MESSAGES_KEY = 'cargas_chat_messages';
const STAFF_LIST_KEY = 'cargas_staff_access_list';
const DELEGATION_KEY = 'cargas_supervisor_delegation_state';

// قائمة الموظفين الافتراضية
export const DEFAULT_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'FIN-01',
    name: 'أ. طارق عبد المعطي (مدير الحسابات والمالية)',
    role: 'مسؤول مالي',
    phone: '201098765432',
    dailyPin: '1234',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: true,
  },
  {
    id: 'SUP-01',
    name: 'م. عصام المنشاوي (مشرف محطة شبرا)',
    role: 'مشرف محطة',
    phone: '201234567890',
    stationName: 'محطة كارجاس شبرا النموذجية',
    stationCode: 'CARGAS-SHUBRA-01',
    dailyPin: '9153',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: true,
    canRedeemRewards: true,
  },
  {
    id: 'TECH-01',
    name: 'محمود الشناوي',
    role: 'فني تموين',
    phone: '201011223344',
    stationName: 'محطة كارجاس شبرا النموذجية',
    stationCode: 'CARGAS-SHUBRA-01',
    dailyPin: '7391',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: true,
    canRedeemRewards: false,
  },
  {
    id: 'TECH-02',
    name: 'إبراهيم عبد الله مرعي',
    role: 'فني تموين',
    phone: '201155667788',
    stationName: 'محطة كارجاس شبرا النموذجية',
    stationCode: 'CARGAS-SHUBRA-01',
    dailyPin: '8402',
    pinGeneratedDate: new Date().toISOString().slice(0, 10),
    isShiftActive: false,
    canRedeemRewards: false,
  },
];

// الغرف الافتراضية للشات
export const DEFAULT_CHAT_ROOMS: ChatRoom[] = [
  {
    id: 'room-tech-admin',
    roomType: 'tech_admin',
    title: '💬 شات [فني التموين ↔ إدارة النظام]',
    participantOne: 'TECH-01',
    participantTwo: 'admin',
    stationName: 'محطة كارجاس شبرا النموذجية',
    lastMessage: 'كود الوردية اليومية تم إرساله آلياً بنجاح.',
    lastMessageTime: '08:00 ص',
    unreadCount: 1,
  },
  {
    id: 'room-sup-admin',
    roomType: 'supervisor_admin',
    title: '👮‍♂️ شات [مشرف المحطة ↔ إدارة النظام]',
    participantOne: 'SUP-01',
    participantTwo: 'admin',
    stationName: 'محطة كارجاس شبرا النموذجية',
    lastMessage: 'تم مراجعة كشف الوردية ومطابقة العدادات.',
    lastMessageTime: '08:15 ص',
  },
  {
    id: 'room-fin-admin',
    roomType: 'finance_admin',
    title: '💼 شات [الإدارة المالية ↔ إدارة النظام]',
    participantOne: 'FIN-01',
    participantTwo: 'admin',
    lastMessage: 'تقرير توريد مبيعات الأمس مطابق تماماً.',
    lastMessageTime: '09:00 ص',
  },
  {
    id: 'room-fin-sup',
    roomType: 'finance_supervisor',
    title: '🤝 شات [الإدارة المالية ↔ مشرف المحطة]',
    participantOne: 'FIN-01',
    participantTwo: 'SUP-01',
    stationName: 'محطة كارجاس شبرا النموذجية',
    lastMessage: 'برجاء مراجعة كمية الأمتار المنصرفة للطلمبة #3.',
    lastMessageTime: '09:30 ص',
  },
];

export const DEFAULT_INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-seed-1',
    roomId: 'room-tech-admin',
    senderId: 'SYSTEM_BOT',
    senderName: 'نظام كارجاس الآلي',
    senderRole: 'system',
    messageText: 'صباح الخير زميلنا الفني محمود الشناوي ⛽ كود تفعيل ورديتك اليومية هو [ 7391 ]. تأكد من تفعيل GPS بالمحطة لبدء تسجيل العمليات.',
    timestamp: '08:00 ص',
    isAutomatedDispatch: true,
  },
  {
    id: 'msg-seed-2',
    roomId: 'room-sup-admin',
    senderId: 'SUP-01',
    senderName: 'م. عصام المنشاوي',
    senderRole: 'supervisor',
    messageText: 'تم استلام كود المشرف وتفعيل الوردية الصباحية بمحطة شبرا. العدادات تم مطابقتها ولا توجد أي أعطال.',
    timestamp: '08:15 ص',
  },
  {
    id: 'msg-seed-3',
    roomId: 'room-fin-sup',
    senderId: 'FIN-01',
    senderName: 'أ. طارق عبد المعطي (المالية)',
    senderRole: 'finance',
    messageText: 'صباح الخير م. عصام، تم فحص تقرير مبيعات الأمس بإجمالي 298,000 م³. يرجى اعتماد قسائم استبدال الزيوت الخاصة بوردية اليوم.',
    timestamp: '09:30 ص',
  },
];

// Functions for Staff Management
export function getStaffList(): StaffMember[] {
  const data = localStorage.getItem(STAFF_LIST_KEY);
  if (!data) return DEFAULT_STAFF_MEMBERS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_STAFF_MEMBERS;
  }
}

export function saveStaffList(list: StaffMember[]): void {
  localStorage.setItem(STAFF_LIST_KEY, JSON.stringify(list));
}

// Functions for Chat System
export function getChatRooms(): ChatRoom[] {
  const data = localStorage.getItem(CHAT_ROOMS_KEY);
  if (!data) return DEFAULT_CHAT_ROOMS;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_CHAT_ROOMS;
  }
}

export function saveChatRooms(rooms: ChatRoom[]): void {
  localStorage.setItem(CHAT_ROOMS_KEY, JSON.stringify(rooms));
}

export function getChatMessages(): ChatMessage[] {
  const data = localStorage.getItem(CHAT_MESSAGES_KEY);
  if (!data) return DEFAULT_INITIAL_MESSAGES;
  try {
    return JSON.parse(data);
  } catch {
    return DEFAULT_INITIAL_MESSAGES;
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  localStorage.setItem(CHAT_MESSAGES_KEY, JSON.stringify(messages));
  window.dispatchEvent(new CustomEvent('cargas_chat_updated', { detail: messages }));
}

export function sendChatMessage(
  roomId: string,
  senderId: string,
  senderName: string,
  senderRole: 'admin' | 'technician' | 'supervisor' | 'finance' | 'system',
  messageText: string,
  isGhostAdmin: boolean = false
): ChatMessage {
  const allMessages = getChatMessages();
  const newMsg: ChatMessage = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    roomId,
    senderId,
    senderName: isGhostAdmin ? 'إشعار نظام معتمد' : senderName,
    senderRole,
    messageText,
    timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    isGhostAdmin,
  };

  allMessages.push(newMsg);
  saveChatMessages(allMessages);

  // Update room last message
  const allRooms = getChatRooms();
  const roomIdx = allRooms.findIndex((r) => r.id === roomId);
  if (roomIdx !== -1) {
    allRooms[roomIdx].lastMessage = messageText;
    allRooms[roomIdx].lastMessageTime = newMsg.timestamp;
    saveChatRooms(allRooms);
  }

  return newMsg;
}

// Automated Dispatch of Daily PIN to Technician in Chat
export function autoDispatchDailyPinToTech(tech: StaffMember): ChatMessage {
  const generatedPin = Math.floor(1000 + Math.random() * 9000).toString();
  
  // Update in staff list
  const staff = getStaffList();
  const idx = staff.findIndex((s) => s.id === tech.id);
  if (idx !== -1) {
    staff[idx].dailyPin = generatedPin;
    staff[idx].pinGeneratedDate = new Date().toISOString().slice(0, 10);
    saveStaffList(staff);
  }

  return sendChatMessage(
    'room-tech-admin',
    'SYSTEM_AUTO',
    'نظام كارجاس الآلي',
    'system',
    `صباح الخير زميلنا ${tech.name} ⛽ كود تفعيل ورديتك اليومية هو [ ${generatedPin} ]. تأكد من تفعيل GPS بالمحطة لبدء تسجيل العمليات.`,
    false
  );
}

// Supervisor Delegation state
const DELEGATION_DETAILS_KEY = 'cargas_supervisor_delegation_details';

export function getSupervisorDelegationDetails(): SupervisorDelegation | null {
  const data = localStorage.getItem(DELEGATION_DETAILS_KEY);
  if (!data) {
    const isOldDelegated = localStorage.getItem(DELEGATION_KEY) === 'true';
    if (!isOldDelegated) return null;
    return {
      stationCode: 'CARGAS-01',
      stationName: 'محطة كارجاس',
      isRedemptionDelegatedToTech: true,
      delegatedTechName: 'فني الوردية المفوض',
      delegatedAt: new Date().toLocaleTimeString('ar-EG'),
    };
  }
  try {
    const parsed: SupervisorDelegation = JSON.parse(data);
    // Check if expired
    if (parsed.expiresAt && Date.now() > new Date(parsed.expiresAt).getTime()) {
      parsed.isRedemptionDelegatedToTech = false;
      saveSupervisorDelegationDetails(parsed);
      return null;
    }
    return parsed.isRedemptionDelegatedToTech ? parsed : null;
  } catch {
    return null;
  }
}

export function saveSupervisorDelegationDetails(delegation: SupervisorDelegation): void {
  localStorage.setItem(DELEGATION_DETAILS_KEY, JSON.stringify(delegation));
  localStorage.setItem(DELEGATION_KEY, String(delegation.isRedemptionDelegatedToTech));
  window.dispatchEvent(new CustomEvent('cargas_delegation_changed', { detail: delegation }));
}

export function getSupervisorDelegation(): boolean {
  const details = getSupervisorDelegationDetails();
  return Boolean(details?.isRedemptionDelegatedToTech);
}

export function setSupervisorDelegation(delegated: boolean, techName?: string, techId?: string, durationHours?: number): void {
  const expiresAt = durationHours && durationHours > 0 
    ? new Date(Date.now() + durationHours * 3600 * 1000).toISOString()
    : undefined;

  const details: SupervisorDelegation = {
    stationCode: 'CARGAS-SHUBRA-01',
    stationName: 'محطة كارجاس شبرا النموذجية',
    isRedemptionDelegatedToTech: delegated,
    delegatedTechId: techId,
    delegatedTechName: techName || 'فني الوردية المناوب',
    durationHours: durationHours || 8,
    delegatedAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    expiresAt,
    delegatedBySupervisorName: 'م. عصام المنشاوي',
  };

  saveSupervisorDelegationDetails(details);
}

