import { User } from "@/context/AppContext";
import Link from "next/link";
import { LogOut, Search, UserCircle, X } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  users: User[] | null;
  loggedInUser: User | null;
  onlineUsers: string[];
  handleLogout: () => void;
  createChat: (user: User) => void;
}

const Header = ({
  users,
  loggedInUser,
  onlineUsers,
  handleLogout,
  createChat,
}: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  return (
    <div className="fixed top-0 left-0 w-full h-15 z-50 bg-gray-950 border-b border-gray-900 flex items-center gap-2 justify-between pl-4">
      <h2 className="text-2xl font-bold text-white">Chat App</h2>
      <div className="max-w-100 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        {searchQuery.trim() && (
          <X
            className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
            onClick={() => setSearchQuery("")}
          />
        )}
        <input
          type="text"
          className="w-100 pl-10 pr-10 py-2 rounded-sm bg-gray-800 border border-gray-700 text-white placeholder-gray-400"
          placeholder="Search a User"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery.trim() && (
          <div className="absolute top-11 w-100 bg-gray-600 rounded-b-sm text-white">
            <div className=" overflow-y-auto h-full">
              {users
                ?.filter(
                  (u) =>
                    u._id !== loggedInUser?._id &&
                    u.name.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((u) => (
                  <button
                    key={u._id}
                    className="w-full text-left border-b border-gray-600 hover:bg-gray-700 transition-colors py-2 px-2"
                    onClick={() => {
                      createChat(u);
                      setSearchQuery("");
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <UserCircle className="w-6 h-6 text-gray-300" />
                        {onlineUsers?.includes(u._id) && (
                          <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-green-500 border-2 border-gray-900" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-white">{u.name}</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>
      <div className="p-4 border-t border-gray-700 flex">
        <Link
          href={"/profile"}
          className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          <div className="p-1.5 bg-gray-700 rounded-lg">
            <UserCircle className="w-4 h-4 text-gray-300" />
          </div>
          <span className="font-medium text-gray-300">Profile</span>
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-600 transition-colors text-red-500 hover:text-white"
        >
          <div className="p-1.5 bg-red-600 rounded-lg">
            <LogOut className="w-4 h-4 text-gray-300" />
          </div>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Header;
