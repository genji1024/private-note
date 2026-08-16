"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type UserOption = {
  username: string;
};

export default function LoginForm({ users }: { users: UserOption[] }) {
  const router = useRouter();
  const [username, setUsername] = useState("chihiro");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("ユーザ名またはパスワードが間違っています");
    } else {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="container">
      <h2 style={{ marginBottom: "1rem", fontSize: "1.5rem" }}>ログイン</h2>
      {error && (
        <p style={{ color: "#e53e3e", marginBottom: "1rem" }}>{error}</p>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label
            style={{
              display: "block",
              fontSize: "0.85rem",
              color: "#666",
              marginBottom: "0.25rem",
            }}
          >
            ユーザ
          </label>
          <select
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ appearance: "auto" }}
          >
            {users.map((u) => (
              <option key={u.username} value={u.username}>
                {u.username}
              </option>
            ))}
          </select>
        </div>
        <input
          className="input"
          type="password"
          placeholder="パスワード"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn" type="submit" disabled={loading}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </div>
  );
}
