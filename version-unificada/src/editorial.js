// Preguntas de lectura jurídica limitadas a lo que afirma expresamente la cita.
export const editorialQuestions = [
  {
    unitId: "rdl8-2015:art:unico",
    prompt: "¿Qué función cumple el artículo único del Real Decreto Legislativo 8/2015?",
    options: ["Aprueba el texto refundido de la LGSS que se inserta a continuación.", "Crea una ley distinta de la LGSS con un articulado paralelo.", "Modifica exclusivamente las prestaciones por desempleo.", "Aprueba un reglamento de desarrollo sin rango legal."],
    correctOptionIndex: 0, evidenceIncludes: "Se aprueba el texto refundido",
    explanation: "El artículo único aprueba el texto refundido: no hay dos leyes alternativas entre las que elegir para estudiar la LGSS."
  },
  {
    unitId: "rdl8-2015:disp-adicional:unica",
    prompt: "Si otra norma remite a una disposición integrada en el texto refundido, ¿cómo se entiende esa remisión?",
    options: ["Como una remisión sin efecto en todo caso.", "Como una remisión al precepto correspondiente del texto refundido.", "Como una remisión exclusiva al artículo único aprobatorio.", "Como una remisión que exige siempre una nueva ley."],
    correctOptionIndex: 1, evidenceIncludes: "Las referencias efectuadas en otras normas",
    explanation: "La disposición conserva la remisión normativa dirigiéndola al precepto correspondiente del texto refundido."
  },
  {
    unitId: "lgss:art:001",
    prompt: "¿Qué precepto constitucional menciona expresamente el artículo 1 al referirse al derecho a la Seguridad Social?",
    options: ["El artículo 14.", "El artículo 35.", "El artículo 41.", "El artículo 129."],
    correctOptionIndex: 2, evidenceIncludes: "El derecho de los españoles",
    explanation: "La remisión expresa es al artículo 41 de la Constitución; el derecho se ajusta a lo dispuesto en la LGSS."
  },
  {
    unitId: "lgss:art:002",
    prompt: "¿Qué afirmación recoge correctamente las modalidades y principios del sistema según el artículo 2.1?",
    options: ["Solo existe acción protectora contributiva.", "Sus principios son exclusivamente unidad y contributividad.", "La modalidad no contributiva queda fuera del sistema.", "La acción protectora comprende ambas modalidades y se fundamenta en universalidad, unidad, solidaridad e igualdad."],
    correctOptionIndex: 3, evidenceIncludes: "1. El sistema de la Seguridad Social",
    explanation: "El apartado incluye las modalidades contributiva y no contributiva y enumera esos cuatro principios."
  },
  {
    unitId: "lgss:art:002",
    prompt: "¿Garantiza el artículo 2.2 protección sin necesidad de cumplir los requisitos exigidos?",
    options: ["Sí, elimina cualquier requisito de acceso.", "No: vincula la garantía a cumplir los requisitos exigidos en la modalidad correspondiente.", "Sí, pero solo para los familiares.", "No: excluye siempre a los familiares a cargo."],
    correctOptionIndex: 1, evidenceIncludes: "2. El Estado, por medio",
    explanation: "La garantía se refiere a las personas comprendidas en el campo de aplicación que cumplen los requisitos, y también a los familiares o asimilados a cargo en los términos de la cita."
  },
  {
    unitId: "lgss:art:003",
    prompt: "Un trabajador firma un pacto individual renunciando a los derechos que le confiere la LGSS. Según el artículo 3, ese pacto…",
    options: ["Es válido por ser individual.", "Es válido si el empresario lo acepta.", "Es nulo.", "Solo es nulo si se convierte en pacto colectivo."],
    correctOptionIndex: 2, evidenceIncludes: "Será nulo todo pacto",
    explanation: "La nulidad alcanza tanto al pacto individual como al colectivo mediante el que el trabajador renuncia a los derechos conferidos por la ley."
  },
  {
    unitId: "lgss:art:004",
    prompt: "¿A quién atribuye el artículo 4.1 la ordenación, jurisdicción e inspección de la Seguridad Social?",
    options: ["Al Estado.", "Exclusivamente a las empresas colaboradoras.", "A los trabajadores individualmente.", "Solo a las entidades financieras."],
    correctOptionIndex: 0, evidenceIncludes: "1. Corresponde al Estado",
    explanation: "El apartado atribuye las tres funciones al Estado; la colaboración en la gestión aparece diferenciada en el apartado siguiente."
  },
  {
    unitId: "lgss:art:004",
    prompt: "¿Puede la ordenación de la Seguridad Social servir de fundamento a operaciones de lucro mercantil?",
    options: ["Sí, si lo acuerdan los interesados.", "Sí, siempre que intervengan empresarios.", "Sí, cuando la operación sea colectiva.", "No, en ningún caso, según el artículo 4.3."],
    correctOptionIndex: 3, evidenceIncludes: "3. En ningún caso",
    explanation: "El artículo 4.3 contiene una prohibición expresa, sin la excepción que proponen las otras respuestas."
  },
  {
    unitId: "lgss:art:005",
    prompt: "Según el artículo 5.1, ¿se atribuyen al ministerio mencionado todas las funciones estatales, incluidas las jurisdiccionales?",
    options: ["Sí, sin excepción.", "No: la atribución citada es de funciones no jurisdiccionales que no sean propias del Gobierno, sin perjuicio de otros departamentos.", "Sí, salvo la potestad reglamentaria.", "No: el artículo excluye toda función estatal en Seguridad Social."],
    correctOptionIndex: 1, evidenceIncludes: "1. Las funciones no jurisdiccionales",
    explanation: "La cita delimita la atribución por su carácter no jurisdiccional y por no ser propia del Gobierno. Se conserva la denominación ministerial de la instantánea, sin actualizarla editorialmente."
  },
  {
    unitId: "lgss:art:006",
    prompt: "¿Quién dicta las disposiciones necesarias para coordinar las funciones afines mencionadas en el artículo 6?",
    options: ["Cada trabajador por separado.", "Los colegios profesionales exclusivamente.", "El Gobierno.", "Las entidades gestoras sin intervención del Gobierno."],
    correctOptionIndex: 2, evidenceIncludes: "Corresponde al Gobierno dictar",
    explanation: "La competencia para dictar las disposiciones de coordinación corresponde al Gobierno."
  },
  {
    unitId: "lgss:art:007",
    prompt: "Según el artículo 7.2, ¿qué españoles quedan comprendidos a efectos de las prestaciones no contributivas?",
    options: ["Todos los españoles residentes en territorio español.", "Solo los que trabajan por cuenta ajena.", "Únicamente los funcionarios.", "Solo los que hayan cotizado quince años."],
    correctOptionIndex: 0, evidenceIncludes: "2. Asimismo, estarán comprendidos",
    explanation: "El apartado delimita ese campo de aplicación por la residencia en territorio español. Esto no elimina los requisitos particulares de cada prestación."
  },
  {
    unitId: "lgss:art:008",
    prompt: "¿Qué situación prohíbe expresamente el artículo 8.1?",
    options: ["Toda actividad simultánea en dos trabajos.", "Cualquier inclusión voluntaria en un sistema complementario.", "La percepción de cualquier prestación.", "La inclusión obligatoria por el mismo trabajo en otros regímenes de previsión ajenos al sistema."],
    correctOptionIndex: 3, evidenceIncludes: "1. Las personas comprendidas",
    explanation: "La prohibición citada se delimita por el mismo trabajo, el carácter obligatorio y la pertenencia a regímenes de previsión distintos de los que integran el sistema."
  }
];
