import { auth, db } from "@/src/services/firebase";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

export const GoogleLoginButton = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    
    try {
      // 1. Abre o popup do Google para autenticação
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user; // Contém o UID único

      // 2. Referência ao documento na coleção 'users' usando o UID como ID do documento
      // Isso substitui a busca por nickname manual
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        // 3. Se o usuário não existe, cria o vínculo com a estrutura da sua pesquisa
        await setDoc(userRef, {
          user: {
            nickname: "Iniciante", // Valor padrão conforme sua imagem
            level: 1,
            points: 0,
            avatar: null,
            completedDays: 0,
            currentStreak: 0,
            responseRate: 0
          },
          responses: {
            sociodemographicData: null,
            studyStartDate: new Date().toISOString()
          },
          // Dados auxiliares vindos do Google OAuth
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          createdAt: new Date().toISOString()
        });
        console.log("Novo perfil de pesquisa criado para o UID:", firebaseUser.uid);
      } else {
        console.log("Usuário já existente, carregando dados de pesquisa.");
      }

      // O AuthProvider (onAuthStateChanged) detectará a mudança automaticamente
      console.log("redirecionando o usuário");
      navigate("/dashboard");
    } catch (error: any) {
      console.error("Erro no Google Auth ou Firestore:", error.code, error.message);
      
      if (error.code === "permission-denied") {
        alert("Erro de permissão no banco de dados. Verifique as Rules do Firestore.");
      } else {
        alert("Falha na autenticação com o Google.");
      }
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
        padding: "12px 20px",
        borderRadius: "8px", // Bordas um pouco mais arredondadas para o estilo dark
        border: "1px solid #333",
        backgroundColor: "#131314", // Preto mais profundo para combinar com seu fundo
        color: "#fafafa",
        fontSize: "14px",
        fontWeight: "500",
        cursor: "pointer",
        width: "100%", // Ocupa o espaço do container de login
        maxWidth: "300px",
        boxShadow: "0 4px 6px rgba(0,0,0,0.3)",
        transition: "background-color 0.2s"
      }}
      onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#202124")}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#131314")}
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