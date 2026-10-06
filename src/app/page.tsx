import { redirect } from "next/navigation";

// /login sends signed-in admins straight to /overview.
export default function Home() {
  redirect("/login");
}
