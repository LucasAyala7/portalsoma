import { signIn } from "../../auth";

export default function Login({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-100">
      <form
        action={async (formData) => {
          "use server";
          await signIn("credentials", {
            username: formData.get("username"),
            password: formData.get("password"),
            redirectTo: "/",
          });
        }}
        className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm"
      >
        <h1 className="text-2xl font-semibold mb-1">Portal Soma</h1>
        <p className="text-stone-500 text-sm mb-6">Admin</p>

        <label className="block text-sm font-medium text-stone-700 mb-1">Usuário</label>
        <input
          name="username"
          required
          autoComplete="username"
          className="w-full mb-4 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-niver-500"
        />

        <label className="block text-sm font-medium text-stone-700 mb-1">Senha</label>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="w-full mb-6 px-3 py-2 border border-stone-300 rounded-lg focus:outline-none focus:border-niver-500"
        />

        <button
          type="submit"
          className="w-full bg-niver-600 hover:bg-niver-700 text-white font-medium py-2.5 rounded-lg"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
