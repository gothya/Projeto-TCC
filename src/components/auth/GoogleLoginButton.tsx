import { auth, db } from "@/src/services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      console.log('result', result);
      
      // 2. Opcional: Salvar/Verificar o usuário no Firestore
      // Útil para sua pesquisa de psicologia para vincular respostas ao UID
      const userRef = doc(db, "participantes", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, {
          nome: user.displayName,
          email: user.email,
          photo: user.photoURL,
          role: "participante",
          createdAt: new Date()
        });
      }

      console.log("Sucesso!", user);
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro no Google Auth:", error.code, error.message);
      alert("Falha na autenticação com o Google.");
    }
  };

  return (
    <button
      onClick={handleLogin}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "10px 20px",
        borderRadius: "4px",
        border: "1px solid #333",
        backgroundColor: "#222",
        color: "#fafafa",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}
    >
      <img 
        src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" 
        alt="Google logo" 
        style={{ width: "18px", height: "18px" }}
      />
      Entrar com Google
    </button>
  );
};