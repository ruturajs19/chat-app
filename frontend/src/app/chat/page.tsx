"use client";

import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";

export interface Message {
  _id: string;
  chatId: string;
  sender: string;
  text?: string;
  image?: {
    url: string;
    publicId: string;
  };
  messageType: "text" | "image";
  seen: boolean;
  seenAt?: string;
  createdAt: string;
}
export default function ChatApp() {
  const {
    loading,
    isAuth,
    logoutUser,
    chats,
    user: loggedInUser,
    users,
    fetchChats,
    setChats,
  } = useAppData();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sidebarOpen, setSiderbarOpen] = useState(false);
  const [messages, setMessages] = useState<Message[] | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [showAllUsers, setShowAllUsers] = useState(false);
  const [isTyping, setisTyping] = useState(false);
  const [typingTimeOut, setTypingTimeOut] = useState<NodeJS.Timeout | null>(
    null
  );
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  const handleLogout = () => logoutUser();

  useEffect(() => {
    if (selectedUser)
      (async function () {
        const token = Cookies.get("token");
        try {
          const { data } = await axios.get(
            `${chat_service}/api/v1/message/${selectedUser}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          setMessages(data.messages);
          setUser(data.user);
          await fetchChats();
        } catch (error) {
          console.log(error);
          toast.error("Failed to load messages");
        }
      })();
  }, [selectedUser]);

  if (loading) return <Loading />;

  async function createChat(u: User) {
    try {
      const token = Cookies.get("token");

      const { data } = await axios.post(
        `${chat_service}/api/v1/chat/new`,
        {
          userId: loggedInUser?._id,
          otherUserId: u._id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setSelectedUser(data.chatId);
      setShowAllUsers(false);
      await fetchChats();
    } catch (error) {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (e: any, imageFile?: File | null) => {
    e.preventDefault();
    if ((!message.trim() && !imageFile) || !selectedUser) return;

    const token = Cookies.get("token");
    try {
      const formData = new FormData();
      formData.append("chatId", selectedUser);
      if (message.trim()) formData.append("text", message);
      if (imageFile) formData.append("image", imageFile);
      const { data } = await axios.post(
        `${chat_service}/api/v1/message`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessages((prev) => {
        const currentMessages = prev || [];
        const messageExists = currentMessages.some(
          (msg) => msg._id === data.message._id
        );
        if (messageExists) return currentMessages;
        return [...currentMessages, data.message];
      });
      setMessage("");
      const displayText = imageFile ? "📷 image" : message;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to send message");
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser) return;
  };

  return (
    <div className="min-h-screen flex bg-gray-900 text-white relative overflow-hidden">
      <ChatSidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSiderbarOpen}
        showAllUsers={showAllUsers}
        setShowAllUsers={setShowAllUsers}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        users={users}
        chats={chats}
        loggedInUser={loggedInUser}
        handleLogout={handleLogout}
        createChat={createChat}
      />
      <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-white/10">
        <ChatHeader
          user={user}
          setSidebarOpen={setSiderbarOpen}
          isTyping={isTyping}
        />
        <ChatMessages
          selectedUser={selectedUser}
          loggedInUser={loggedInUser}
          messages={messages}
        />

        <MessageInput
          selectedUser={selectedUser}
          message={message}
          setMessage={handleTyping}
          handleMessageSend={handleMessageSend}
        />
      </div>
    </div>
  );
}
