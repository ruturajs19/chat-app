"use client";

import Loading from "@/components/Loading";
import { useAppData } from "@/context/AppContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ChatApp() {
  const { loading, isAuth } = useAppData();
  const router = useRouter();

  useEffect(() => {
    if (!isAuth && !loading) {
      router.push("/login");
    }
  }, [isAuth, loading, router]);

  if(loading) return <Loading/>;

  return <div>ChatApp</div>;
}
