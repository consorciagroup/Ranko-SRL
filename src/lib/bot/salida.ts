// Forma estructurada de un mensaje que el bot "envía". El webhook real la
// traduce a la Meta Cloud API (texto / botones / lista); el simulador web la
// pinta como burbujas en el chat. Tener un tipo común evita que el flujo real y
// el simulado se desincronicen.

export type MensajeSalida =
  | { tipo: "texto"; texto: string }
  | { tipo: "botones"; texto: string; botones: { id: string; title: string }[] }
  | {
      tipo: "lista";
      texto: string;
      buttonText: string;
      sections: {
        title: string;
        rows: { id: string; title: string; description?: string }[];
      }[];
    };
