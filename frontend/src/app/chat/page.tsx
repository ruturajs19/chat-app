"use client";

import ChatSidebar from "@/components/ChatSidebar";
import Loading from "@/components/Loading";
import { chat_service, Chats, useAppData, User } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import Cookies from "js-cookie";
import axios from "axios";
import ChatHeader from "@/components/ChatHeader";
import ChatMessages from "@/components/ChatMessages";
import MessageInput from "@/components/MessageInput";
import { SocketData } from "@/context/SocketContext";
import Header from "@/components/Header";

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

  const { onlineUsers, socket } = SocketData();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  const handleLogout = () => logoutUser();

  const moveChatToTop = (
    chatId: string,
    newMessage: Message,
    updatedUnseenCount = true
  ) => {
    setChats((prev) => {
      if (!prev) return null;

      const updatedChats = [...prev];
      const chatIndex = updatedChats.findIndex(
        (chat) => chat.chat._id === chatId
      );

      if (chatIndex !== -1) {
        const [moveChat] = updatedChats.splice(chatIndex, 1);

        const updatedChat: Chats = {
          ...moveChat,
          chat: {
            ...moveChat.chat,
            latestMessage: {
              text: newMessage.text as string,
              senderId: newMessage.sender,
            },
            updatedAt: new Date().toString(),
            unseenCount:
              updatedUnseenCount && newMessage.sender !== loggedInUser?._id
                ? (moveChat.chat.unseenCount || 0) + 1
                : moveChat.chat.unseenCount || 0,
          },
        };
        updatedChats.unshift(updatedChat);
      }
      return updatedChats;
    });
  };

  useEffect(() => {
    socket?.on("newMessage", (message: Message) => {
      console.log("Received new message:", message);
      if (selectedUser === message.chatId) {
        setMessages((prev) => {
          const currentMessages = prev || [];
          const messageExists = currentMessages.some(
            (msg) => msg._id === message._id
          );

          if (!messageExists) {
            return [...currentMessages, message];
          }
          return currentMessages;
        });

        moveChatToTop(message.chatId, message, false);
      } else {
        moveChatToTop(message.chatId, message, true);
      }
    });
    socket?.on("messagesSeen", (data) => {
      if (selectedUser === data.chatId) {
        setMessages((prev) => {
          if (!prev) return null;
          return prev.map((msg) => {
            if (
              msg.sender === loggedInUser?._id &&
              data.messageIds &&
              data.messageIds.includes(msg._id)
            ) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            } else if (msg.sender === loggedInUser?._id && !data.messageIds) {
              return {
                ...msg,
                seen: true,
                seenAt: new Date().toString(),
              };
            }
            return msg;
          });
        });
      }
    });
    socket?.on("userTyping", (data) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setisTyping(true);
      }
    });
    socket?.on("userStoppedTyping", (data) => {
      if (data.chatId === selectedUser && data.userId !== loggedInUser?._id) {
        setisTyping(false);
      }
    });

    return () => {
      socket?.off("newMessage");
      socket?.off("messagesSeen");
      socket?.off("userTyping");
      socket?.off("userStoppedTyping");
    };
  }, [socket, selectedUser, setChats, loggedInUser?._id]);

  const resetUnseenCount = (chatId: string) => {
    setChats((prev) => {
      if (!prev) return null;

      return prev.map((chat) => {
        if (chat.chat._id === chatId) {
          return {
            ...chat,
            chat: {
              ...chat.chat,
              unseenCount: 0,
            },
          };
        }
        return chat;
      });
    });
  };

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
    setisTyping(false);
    resetUnseenCount(selectedUser as string);
    socket?.emit("joinChat", selectedUser);

    return () => {
      socket?.emit("leaveChat", selectedUser);
      setMessages(null);
    };
  }, [selectedUser, socket]);

  useEffect(() => {
    return () => {
      if (typingTimeOut) {
        clearTimeout(typingTimeOut);
      }
    };
  }, [typingTimeOut]);

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
    } catch {
      toast.error("Failed to start chat");
    }
  }

  const handleMessageSend = async (
    e: FormEvent<HTMLFormElement>,
    imageFile?: File | null
  ) => {
    e.preventDefault();
    if ((!message.trim() && !imageFile) || !selectedUser) return;

    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
      setTypingTimeOut(null);
    }

    socket?.emit("stopTyping", {
      chatId: selectedUser,
      userId: loggedInUser?._id,
    });

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
      moveChatToTop(
        selectedUser!,
        {
          ...data.message,
          text: displayText,
          sender: data.sender,
        },
        false
      );
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to send message");
      }
    }
  };

  const handleTyping = (value: string) => {
    setMessage(value);

    if (!selectedUser || !socket) return;

    if (value.trim()) {
      socket.emit("typing", {
        chatId: selectedUser,
        userId: loggedInUser?._id,
      });
    }
    if (typingTimeOut) {
      clearTimeout(typingTimeOut);
    }

    const timeout = setTimeout(() => {
      socket.emit(
        "stopTyping",
        {
          chatId: selectedUser,
          userId: loggedInUser?._id,
        },
        2000
      );
    });

    setTypingTimeOut(timeout);
  };

  return (
    <>
      <Header
        users={users}
        loggedInUser={loggedInUser}
        handleLogout={handleLogout}
        createChat={createChat}
        onlineUsers={onlineUsers}
      />
      <div className="h-[calc(100vh-60px)] flex text-white relative overflow-hidden bg-black top-15">
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
          onlineUsers={onlineUsers}
        />
        <div className="flex-1 flex flex-col justify-between p-4 backdrop-blur-xl bg-white/5 border-1 border-gray-900">
          <ChatHeader
            user={user}
            setSidebarOpen={setSiderbarOpen}
            isTyping={isTyping}
            onlineUsers={onlineUsers}
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
    </>
  );
}
