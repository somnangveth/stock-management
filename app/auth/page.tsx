import AuthForm from "./components/authform";

export default function AuthPage() {
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-96 border border-gray-500 rounded-xl p-6">
        <AuthForm />
      </div>
    </div>
  );
}
