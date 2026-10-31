import React, { useState, useEffect, useRef } from 'react';
import {
  ChatRoom,
  ChatMessage,
  UserRole,
  AppConfig,
} from '../types';
import {
  getChatRooms,
  getChatMessages,
  sendChatMessage,
} from '../services/chatAndAccessService';
import {
  MessageCircle,
  Send,
  X,
  ShieldAlert,
  Ghost,
  Eye,
  Lock,
  Building2,
  DollarSign,
  Fuel,
  CheckCircle2,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentRole: UserRole;
  config: AppConfig;
  currentUserId?: string;
  currentUserName?: string;
}

export const InternalChatModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentRole,
  config,
  currentUserId = 'user-01',
  currentUserName = 'مستخدم كارجاس',
}) => {
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState<string>('room-tech-admin');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isGhostAdminMode, setIsGhostAdminMode] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const reloadData = () => {
    const allRooms = getChatRooms();
    setRooms(allRooms);
    const allMessages = getChatMessages();
    setMessages(allMessages);
  };

  useEffect(() => {
    if (isOpen) {
      reloadData();
      // Set appropriate default room based on role
      if (currentRole === 'technician') setActiveRoomId('room-tech-admin');
      else if (currentRole === 'supervisor') setActiveRoomId('room-sup-admin');
      else if (currentRole === 'finance') setActiveRoomId('room-fin-sup');
    }
  }, [isOpen, currentRole]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeRoomId]);

  if (!isOpen) return null;

  // Filter accessible rooms by user role
  const accessibleRooms = rooms.filter((r) => {
    if (currentRole === 'admin') return true; // المدير يرى كل الغرف
    if (currentRole === 'technician') return r.roomType === 'tech_admin';
    if (currentRole === 'supervisor') return r.roomType === 'supervisor_admin' || r.roomType === 'finance_supervisor';
    if (currentRole === 'finance') return r.roomType === 'finance_admin' || r.roomType === 'finance_supervisor';
    return false;
  });

  const activeRoom = rooms.find((r) => r.id === activeRoomId) || accessibleRooms[0];
  const roomMessages = messages.filter((m) => m.roomId === activeRoom?.id);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activeRoom) return;

    let senderRole: any = currentRole;
    let senderName = currentUserName;

    // وضع الرقابة الخفية لمدير النظام
    const isGhost = currentRole === 'admin' && activeRoom.roomType === 'finance_supervisor' && isGhostAdminMode;

    sendChatMessage(
      activeRoom.id,
      currentUserId,
      senderName,
      senderRole,
      inputText.trim(),
      isGhost
    );

    setInputText('');
    reloadData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] shadow-2xl border border-slate-200 flex flex-col md:flex-row overflow-hidden text-right">
        
        {/* Rooms Sidebar */}
        <div className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-emerald-600" />
              <h3 className="font-black text-sm text-slate-900">غرف المراسلات الداخلية</h3>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-1 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {accessibleRooms.map((room) => {
              const isSelected = room.id === activeRoom?.id;
              const isGhostRoom = currentRole === 'admin' && room.roomType === 'finance_supervisor';

              return (
                <button
                  key={room.id}
                  onClick={() => setActiveRoomId(room.id)}
                  className={`w-full p-3 rounded-2xl text-right transition flex flex-col gap-1 border ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white hover:bg-slate-100 border-slate-200/80 text-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-xs truncate">{room.title}</span>
                    {isGhostRoom && (
                      <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-md ${
                        isSelected ? 'bg-amber-400 text-slate-950' : 'bg-amber-100 text-amber-900'
                      }`}>
                        إشراف إداري 🛡️
                      </span>
                    )}
                  </div>
                  {room.lastMessage && (
                    <span className={`text-[10px] truncate block ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {room.lastMessage}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {currentRole === 'admin' && (
            <div className="p-3 bg-slate-900 text-slate-200 text-[10px] space-y-1 border-t border-slate-800">
              <span className="font-bold text-amber-300 block">👑 صلاحية المدير العام:</span>
              <p>متابعة التنسيق الإداري بين المشرفين والمالية وتأكيد جاهزية ورديات المحطات.</p>
            </div>
          )}
        </div>

        {/* Chat Body & Messages View */}
        <div className="flex-1 flex flex-col bg-slate-100/50">
          
          {/* Room Header */}
          <div className="p-4 bg-white border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <div>
                <h4 className="font-black text-sm text-slate-900">{activeRoom?.title}</h4>
                <span className="text-[10px] text-slate-400">{config.stationName} • قناة اتصال مؤمنة</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Administrative notice toggle when admin is inside finance-supervisor room */}
              {currentRole === 'admin' && activeRoom?.roomType === 'finance_supervisor' && (
                <label className="flex items-center gap-1.5 bg-amber-50 border border-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-900 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isGhostAdminMode}
                    onChange={(e) => setIsGhostAdminMode(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>إرسال كإشعار إداري عام 📢</span>
                </label>
              )}

              <button
                onClick={onClose}
                className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages Flow Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {roomMessages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                لا توجد رسائل سابقة في هذه الغرفة. ابدأ المراسلة الآن.
              </div>
            ) : (
              roomMessages.map((msg) => {
                const isSystem = msg.senderRole === 'system';
                const isGhost = msg.isGhostAdmin;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.senderRole === currentRole ? 'items-start' : 'items-end'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs space-y-1 shadow-xs ${
                        isSystem
                          ? 'bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 text-amber-950 w-full text-center'
                          : msg.senderRole === currentRole
                          ? 'bg-emerald-600 text-white rounded-tr-xs'
                          : 'bg-white border border-slate-200 text-slate-900 rounded-tl-xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-black/10 pb-1 text-[10px] font-bold">
                        <span>{msg.senderName}</span>
                        <span className="opacity-75 font-mono">{msg.timestamp}</span>
                      </div>
                      <p className="leading-relaxed whitespace-pre-line font-medium text-xs">
                        {msg.messageText}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                isGhostAdminMode
                  ? 'اكتب رسالة ستظهر كإشعار نظام معتمد للمشرف والمالية...'
                  : 'اكتب رسالتك هنا في الشات الداخلي...'
              }
              className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold p-2.5 rounded-xl shadow-xs transition"
            >
              <Send className="w-4 h-4 rotate-180" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
};
