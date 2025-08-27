import { redirect, RedirectType } from "next/navigation";

const page = () => {
  return redirect("/chat");
}

export default page;