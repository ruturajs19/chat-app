import { User } from "@/context/AppContext";
import {
  CornerDownRight,
  CornerUpLeft,
  MessageCircle,
  UserCircle,
  X,
} from "lucide-react";

interface ChatSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showAllUsers: boolean;
  setShowAllUsers: (show: boolean | ((prev: boolean) => boolean)) => void;
  users: User[] | null;
  loggedInUser: User | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chats: any[] | null;
  selectedUser: string | null;
  setSelectedUser: (userId: string | null) => void;
  handleLogout: () => void;
  createChat: (user: User) => void;
  onlineUsers: string[];
}

const ChatSidebar = ({
  sidebarOpen,
  selectedUser,
  setSidebarOpen,
  loggedInUser,
  chats,
  setSelectedUser,
  onlineUsers,
}: ChatSidebarProps) => {
  return (
    <aside
      className={`fixed z-20 sm:static top-10 left-0 h-[calc(100vh-60px)] w-80 bg-zinc-950 border-r border-gray-900 transform ${
        sidebarOpen ? "translate-x-0" : "translate-x-full"
      } sm:translate-x-0 transition-transform duration-300 flex flex-col`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">Conversations</h2>
          </div>
          <div className="sm:hidden fixed top-6 right-4 z-30">
            <button
              className="p-3 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5 text-gray-200" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden py-2">
        {chats && chats.length > 0 ? (
          <div className="space-y-2 overflow-y-auto h-full pb-4">
            {chats.map((chat) => {
              const latestMessage = chat.chat.latestMessage;
              const isSelected = selectedUser === chat.chat._id;
              const isSentByMe = latestMessage?.senderId === loggedInUser?._id;
              const unseenCount = chat.chat.unseenCount || 0;

              return (
                <button
                  key={chat.chat._id}
                  onClick={() => {
                    setSelectedUser(chat.chat._id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full cursor-pointer text-left p-4 transition-colors ${
                    isSelected && "bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                        <UserCircle className="w-7 h-7 text-gray-300" />
                      </div>
                      {onlineUsers?.includes(chat.user._id) && (
                        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`font-semibold truncate ${
                            isSelected ? "text-white" : "text-gray-200"
                          }`}
                        >
                          {chat.user.name}
                        </span>
                        {unseenCount > 0 && (
                          <div className="bg-red-600 text-white text-xs font-bold rounded-full min-w-[22px] h-5.5 flex items-center justify-center px-2">
                            {unseenCount > 99 ? "99+" : unseenCount}
                          </div>
                        )}
                      </div>
                      {latestMessage && (
                        <div className="flex items-center gap-2">
                          {isSentByMe ? (
                            <CornerUpLeft
                              size={14}
                              className="text-blue-400 text-shrink-0"
                            />
                          ) : (
                            <CornerDownRight
                              size={14}
                              className="text-green-400 text-shrink-0"
                            />
                          )}
                          <span className="text-sm text-gray-400 truncate flex-1">
                            {latestMessage.text}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="p-4 bg-gray-800 rounded-full mb-4">
              <MessageCircle className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400 font-medium">No conversation yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Start a new chat to begin messaging
            </p>
          </div>
        )}
      </div>
    </aside>
  );
};

export default ChatSidebar;
