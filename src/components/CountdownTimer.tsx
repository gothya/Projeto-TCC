import React, { useState, useRef, useEffect } from "react";
export const CountdownTimer: React.FC<{ onTimerEnd: () => void }> = ({
  onTimerEnd,
}) => {
  const [timeLeft, setTimeLeft] = useState("");
  const [progress, setProgress] = useState(0);
  const pingHours = [9, 11, 13, 15, 17, 19, 21];

  const onTimerEndRef = useRef(onTimerEnd);
  const triggeredRef = useRef(false);

  useEffect(() => {
    onTimerEndRef.current = onTimerEnd;
  }, [onTimerEnd]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      let nextPingDate = new Date();
      let prevPingDate = new Date();

      const nextPingHour = pingHours.find((h) => h > now.getHours());

      if (nextPingHour !== undefined) {
        nextPingDate.setHours(nextPingHour, 0, 0, 0);
        const prevPingHourIndex = pingHours.indexOf(nextPingHour) - 1;
        if (prevPingHourIndex >= 0) {
          prevPingDate.setHours(pingHours[prevPingHourIndex], 0, 0, 0);
        } else {
          prevPingDate.setDate(now.getDate() - 1);
          prevPingDate.setHours(pingHours[pingHours.length - 1], 0, 0, 0);
        }
      } else {
        nextPingDate.setDate(now.getDate() + 1);
        nextPingDate.setHours(pingHours[0], 0, 0, 0);
        prevPingDate.setHours(pingHours[pingHours.length - 1], 0, 0, 0);
      }

      const diff = nextPingDate.getTime() - now.getTime();

      if (diff <= 1000 && !triggeredRef.current) {
        onTimerEndRef.current();
        triggeredRef.current = true;
      } else if (diff > 5000 && triggeredRef.current) {
        triggeredRef.current = false;
      }

      const hours = Math.max(0, Math.floor(diff / (1000 * 60 * 60)));
      const minutes = Math.max(
        0,
        Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      );
      const seconds = Math.max(0, Math.floor((diff % (1000 * 60)) / 1000));

      setTimeLeft(
        `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
          2,
          "0"
        )}:${String(seconds).padStart(2, "0")}`
      );

      const totalDuration = nextPingDate.getTime() - prevPingDate.getTime();
      const elapsedTime = now.getTime() - prevPingDate.getTime();
      const progressPercentage = (elapsedTime / totalDuration) * 100;
      setProgress(Math.min(100, progressPercentage));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-center w-36">
      <div className="text-xs text-cyan-300/80">Próximo Ping</div>
      <div className="font-mono text-lg text-cyan-400 tracking-widest">
        {timeLeft}
      </div>
      <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
        <div
          className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

// // VERSÃO DE TESTE COM 10 SEGUNDOS FIXOS
// import React, { useState, useRef, useEffect } from "react";

// export const CountdownTimer: React.FC<{ onTimerEnd: () => void }> = ({
//   onTimerEnd,
// }) => {
//   const [timeLeft, setTimeLeft] = useState("");
//   const [progress, setProgress] = useState(0);
  
//   // Referência para manter a função de término atualizada
//   const onTimerEndRef = useRef(onTimerEnd);
//   // Controla se o evento já foi disparado para não repetir
//   const triggeredRef = useRef(false);
//   // ARMAZENA O MOMENTO FINAL DO TESTE (Agora + 10s) APENAS UMA VEZ
//   const testEndTimeRef = useRef<number>(Date.now() + 10 * 1000);

//   const isTestMode = true; // Mantenha true para o teste de 10s

//   useEffect(() => {
//     onTimerEndRef.current = onTimerEnd;
//   }, [onTimerEnd]);

//   useEffect(() => {
//     const timer = setInterval(() => {
//       const now = new Date();
//       let nextPingDate: Date;
//       let prevPingDate: Date;

//       if (isTestMode) {
//         // Usa o tempo final fixado no início do componente
//         nextPingDate = new Date(testEndTimeRef.current);
//         // Define um início artificial de 1 minuto atrás para a barra de progresso
//         prevPingDate = new Date(testEndTimeRef.current - 60 * 1000);
//       } else {
//         // Lógica real baseada no array de horas (pingHours)
//         const pingHours = [9, 11, 13, 15, 17, 19, 21];
//         const nextPingHour = pingHours.find((h) => h > now.getHours());
//         nextPingDate = new Date();

//         if (nextPingHour !== undefined) {
//           nextPingDate.setHours(nextPingHour, 0, 0, 0);
//           const prevIdx = pingHours.indexOf(nextPingHour) - 1;
//           prevPingDate = new Date();
//           if (prevIdx >= 0) prevPingDate.setHours(pingHours[prevIdx], 0, 0, 0);
//           else {
//             prevPingDate.setDate(now.getDate() - 1);
//             prevPingDate.setHours(pingHours[pingHours.length - 1], 0, 0, 0);
//           }
//         } else {
//           nextPingDate.setDate(now.getDate() + 1);
//           nextPingDate.setHours(pingHours[0], 0, 0, 0);
//           prevPingDate = new Date();
//           prevPingDate.setHours(pingHours[pingHours.length - 1], 0, 0, 0);
//         }
//       }

//       const diff = nextPingDate.getTime() - now.getTime();

//       // LÓGICA DE DISPARO REVISADA
//       // Se o tempo acabou (ou passou um pouco de zero) e ainda não disparamos
//       if (diff <= 0 && !triggeredRef.current) {
//         triggeredRef.current = true;
//         console.log("!!! TIMER ZEROU !!! Chamando handleTimerEnd");
//         onTimerEndRef.current();
//       }

//       // Cálculos de exibição (Garante que não mostre números negativos)
//       const displayDiff = Math.max(0, diff);
//       const hours = Math.floor(displayDiff / (1000 * 60 * 60));
//       const minutes = Math.floor((displayDiff % (1000 * 60 * 60)) / (1000 * 60));
//       const seconds = Math.floor((displayDiff % (1000 * 60)) / 1000);

//       setTimeLeft(
//         `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
//       );

//       // Progresso da barra
//       const totalDuration = nextPingDate.getTime() - prevPingDate.getTime();
//       const elapsedTime = now.getTime() - prevPingDate.getTime();
//       const progressPercentage = (elapsedTime / totalDuration) * 100;
//       setProgress(Math.min(100, progressPercentage));
      
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [isTestMode]);

//   return (
//     <div className="text-center w-36">
//       <div className="text-xs text-cyan-300/80">
//         {isTestMode ? "MODO TESTE" : "Próximo Ping"}
//       </div>
//       <div className="font-mono text-lg text-cyan-400 tracking-widest">
//         {timeLeft}
//       </div>
//       <div className="w-full bg-gray-700 rounded-full h-1.5 mt-1">
//         <div
//           className="bg-green-500 h-1.5 rounded-full transition-all duration-1000 ease-linear"
//           style={{ width: `${progress}%` }}
//         ></div>
//       </div>
//     </div>
//   );
// };