import Image from "next/image";
import AuthPage from "./auth/page";
import AuthForm from "./auth/components/authform";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main>
        <div className="flex justify-center items-center min-h-screen">
              <div className="w-96 border border-gray-500 rounded-xl p-6">
                <AuthForm />
              </div>
        </div>
      </main>
    </div>
  );
}
