export type LetraVibracional = { letra: string; numero: string };
export type LinhaVibracional = { rotulo: string; valor: string };

const NUMEROS_POR_LETRA: Record<string, string> = {
  A: "3", M: "3", X: "3",
  B: "7", G: "7", D: "7", C: "7", P: "7", F: "7", R: "7",
  E: "12", W: "12", U: "12", V: "12", Z: "12", H: "12", T: "12",
  I: "12", J: "12", Y: "12", L: "12", N: "12", S: "12", O: "12", Q: "12", K: "12",
};

const FRASES: Record<string, string> = {
  vogais: "Desenvolvimento espiritual",
  consoantes: "Realização e trabalho no plano físico",
  "3": "Busca conexão com a fonte",
  "7": "Jornada de autoconhecimento e desenvolvimento espiritual",
  "12": "Atuação no mundo terreno",
};

function base(letra: string) {
  return letra.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleUpperCase("pt-BR");
}

export function numeroDaLetra(letra: string) {
  return NUMEROS_POR_LETRA[base(letra)] ?? "";
}

export function letrasDoNome(nome: string): LetraVibracional[] {
  return [...nome]
    .map(base)
    .filter((letra) => /^[A-Z]$/.test(letra))
    .map((letra) => ({ letra, numero: numeroDaLetra(letra) }));
}

export function linhasAutomaticas(letras: LetraVibracional[]): LinhaVibracional[] {
  const validas = letras.map((item) => base(item.letra)).filter((letra) => /^[A-Z]$/.test(letra));
  const quantidade = (numero: string) => validas.filter((letra) => numeroDaLetra(letra) === numero).length;
  const vogais = validas.filter((letra) => "AEIOU".includes(letra)).length;
  const consoantes = validas.length - vogais;

  return [
    { rotulo: `${vogais} Vogais`, valor: FRASES.vogais },
    { rotulo: `${consoantes} Consoantes`, valor: FRASES.consoantes },
    { rotulo: `${quantidade("3")} Letras vinculadas ao 3`, valor: FRASES["3"] },
    { rotulo: `${quantidade("7")} Letras vinculadas ao 7`, valor: FRASES["7"] },
    { rotulo: `${quantidade("12")} Letras vinculadas ao 12`, valor: FRASES["12"] },
  ];
}
