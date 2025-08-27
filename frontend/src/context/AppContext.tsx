"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import Cookies from "js-cookie";
import axios from "axios";
import toast, {Toaster} from 'react-hot-toast'

export const user_service = "http://localhost:5000";
export const chat_service = "http://localhost:5002";

export interface User {
  _id: string;
  name: string;
  email: string;
}

export interface Chat {
  _id: string;
  users: string[];
  latestMessage: {
    text: string;
    senderId: string;
  };
  createdAt: string;
  updatedAt: string;
  unseenCount?: number;
}

export interface Chats {
  _id: string;
  user: User;
  chat: Chat;
}

interface AppContextType {
  user: User | null;
  loading: boolean;
  isAuth: boolean;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setIsAuth: React.Dispatch<React.SetStateAction<boolean>>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  async function fetchuser() {
    try {
      const token = Cookies.get("token");

      const { data } = await axios.get(`${user_service}/api/v1/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(data);
      setIsAuth(true);
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  }

  async function logoutUser(){
    Cookies.remove("token");
    setUser(null)
    setIsAuth(false);
    toast.success("User Logged out")
  }

  const [chats, setChats] = useState<Chats[] | null>(null)

  async function fetchChats() {
    try {
      const token = Cookies.get('token');
      const {data} = await axios.get(`${chat_service}/api/v1/chat/all`,{
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setChats(data.chats)
    } catch (error) {
      console.log(error)
    }
  }

  const [users, setUsers] = useState<User[] | null>(null);

  async function fetchUsers() {}

  useEffect(() => {
    fetchuser();
    fetchChats()
  }, []);

  return (
    <AppContext.Provider value={{ user, isAuth, setUser, setIsAuth, loading }}>
      {children}
      <Toaster/>
    </AppContext.Provider>
  );
};

export const useAppData = (): AppContextType => {
  const context = useContext(AppContext);

  if (!context) {
    throw new Error("useAppData must be used within AppProvider");
  }

  return context;
};
