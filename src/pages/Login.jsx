import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else if (data.user && data.session === null) {
        setSuccess("Conta criada! Por favor, verifique a caixa de entrada do seu e-mail para confirmar (caso o Supabase exija confirmação).");
      } else if (data.session) {
        onLogin(data.session);
      } else {
        setSuccess("Conta criada com sucesso! Você já pode entrar.");
        setIsSignUp(false);
      }
      setLoading(false);
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError("Credenciais inválidas. Tente novamente.");
        setLoading(false);
      } else {
        onLogin(data.session);
      }
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "var(--surface-soft)" }}>
      <div className="modal-card" style={{ maxWidth: "420px", padding: "40px" }}>
        <div style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="brand-wrap" style={{ justifyContent: "center", marginBottom: "20px" }}>
            <div className="brand-mark" aria-label="Agenda">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 2.75a.75.75 0 0 1 .75.75V4h8.5V3.5a.75.75 0 0 1 1.5 0V4h1.25A2.75 2.75 0 0 1 21.75 6.75v11.5A2.75 2.75 0 0 1 19 21h-14A2.75 2.75 0 0 1 2.25 18.25V6.75A2.75 2.75 0 0 1 5 4h1.25V3.5A.75.75 0 0 1 7 2.75Zm12.25 6.5H4.75v8.5c0 .69.56 1.25 1.25 1.25h12c.69 0 1.25-.56 1.25-1.25v-8.5Zm-9.5 2.25h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm-9.5 3h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Zm3 0h-1.5v1.5h1.5v-1.5Z" />
              </svg>
            </div>
            <div>
              <p className="brand-name">
                Gestão de <span>Escala</span>
              </p>
            </div>
          </div>
          <h2 style={{ color: "var(--text-dark)", fontSize: "1.5rem", margin: 0 }}>
            {isSignUp ? "Criar Nova Conta" : "Acesso Administrativo"}
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", marginTop: "8px" }}>
            {isSignUp 
              ? "Cadastre um e-mail e senha para começar."
              : "Entre com suas credenciais do banco de dados para acessar o sistema."}
          </p>
        </div>

        <form className="employee-form" onSubmit={handleSubmit}>
          {error && (
            <div style={{ padding: "12px", background: "#fef2f2", color: "#b91c1c", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid #fecaca", textAlign: "center" }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{ padding: "12px", background: "#f0fdf4", color: "#166534", borderRadius: "8px", fontSize: "0.85rem", border: "1px solid #bbf7d0", textAlign: "center" }}>
              {success}
            </div>
          )}
          
          <label>
            E-mail
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@exemplo.com"
              required
            />
          </label>
          
          <label>
            Senha
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </label>

          <button 
            type="submit" 
            className="primary-button" 
            style={{ marginTop: "10px", width: "100%", opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
            disabled={loading}
          >
            {loading 
              ? (isSignUp ? "Criando..." : "Autenticando...") 
              : (isSignUp ? "Criar conta" : "Entrar")}
          </button>

          <div style={{ textAlign: "center", marginTop: "16px", fontSize: "0.85rem" }}>
            <span style={{ color: "var(--text-muted)" }}>
              {isSignUp ? "Já possui uma conta? " : "Não tem conta? "}
            </span>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError("");
                setSuccess("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--orange-500)",
                fontWeight: "bold",
                cursor: "pointer",
                padding: 0,
              }}
            >
              {isSignUp ? "Fazer login" : "Criar uma agora"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
