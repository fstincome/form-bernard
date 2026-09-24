export const knowledgeStatements = [
  "Je connais ce qu’est un bloc commercial.",
  "Je connais le COMESA.",
  "Je connais ses États membres.",
  "Je maîtrise les objectifs du COMESA.",
  "Je suis au courant que le Burundi est membre du COMESA.",
];

export const marketStatements = [
  "Je connais ce qu’est un bloc commercial.",
  "Je connais le COMESA.",
  "Je connais ses États membres.",
  "Je maîtrise les objectifs du COMESA.",
];

export const facilitationStatements = [
  "Le commerce est devenu plus facile entre les pays du COMESA.",
  "Le COMESA a amélioré le transport et la logistique transfrontaliers.",
  "Les procédures douanières au sein du COMESA sont plus simples que celles du commerce hors COMESA.",
  "Le transport et les infrastructures facilitent le commerce au sein du COMESA.",
  "Le COMESA a contribué à réduire les barrières non tarifaires telles que les retards douaniers, la documentation complexe, le coût du transport et les restrictions à l’importation/exportation.",
];

export const evaluationStatements = [
  "L’adhésion du Burundi au COMESA est bénéfique pour l’économie burundaise.",
  "Le Burundi a pleinement exploité les opportunités offertes par le COMESA.",
  "Le Gouvernement fournit un soutien suffisant aux entreprises commerçant au sein du COMESA.",
];

export type QDef =
  | { kind: "choice" | "multi"; key: string; title: string; options: string[]; otherKey?: string }
  | { kind: "scale"; title: string; prefix: string; statements: string[] };

export const surveySections: { title: string; questions: QDef[] }[] = [
  { title: "A. Profil du répondant", questions: [
    { kind: "choice", key: "sexe", title: "Sexe", options: ["Féminin", "Masculin"] },
    { kind: "choice", key: "occupation", title: "Occupation dans l’entreprise", options: ["Chef du service vente", "Chef du service achat", "Autre employé d’entreprise", "Autre"], otherKey: "occupation_autre" },
    { kind: "choice", key: "commerce", title: "Type de commerce pratiqué", options: ["Importation", "Exportation", "Entrepôt / Réexportation", "Autre"], otherKey: "commerce_autre" },
    { kind: "choice", key: "experience", title: "Expérience dans le commerce transfrontalier", options: ["Moins de 2 ans", "2 à 4 ans", "4 à 6 ans", "Plus de 6 ans"] },
    { kind: "choice", key: "partenaire", title: "Principal État partenaire", options: ["Kenya", "Rwanda", "RDC", "Ouganda", "Autre"], otherKey: "partenaire_autre" },
  ] },
  { title: "B. Connaissances sur le bloc commercial", questions: [
    { kind: "choice", key: "facilites", title: "Connaissance des facilités commerciales du COMESA", options: ["Oui", "Non"] },
    { kind: "multi", key: "programmes", title: "Programmes du COMESA connus (plusieurs réponses)", options: ["Union douanière", "Poste frontalier à arrêt unique", "Zone de libre-échange", "Autre"] },
    { kind: "choice", key: "comprehension", title: "Niveau de compréhension des politiques du COMESA", options: ["Très élevé", "Élevé", "Modéré", "Très faible"] },
    { kind: "scale", title: "Degré d’accord — connaissances", prefix: "knowledge", statements: knowledgeStatements },
  ] },
  { title: "C. Libéralisation commerciale et accès au marché", questions: [
    { kind: "choice", key: "hors_burundi", title: "Vente de produits/services hors du Burundi", options: ["Oui", "Non"] },
    { kind: "choice", key: "marche_regional", title: "Marché régional le plus utilisé (si Oui)", options: ["COMESA", "EAC", "ECOWAS", "SADC"] },
    { kind: "choice", key: "acces_marche", title: "Mode d’accès au marché régional", options: ["Exportation directe", "À travers des intermédiaires", "Coentreprises", "Plateformes numériques"] },
    { kind: "scale", title: "Degré d’accord — accès au marché", prefix: "market", statements: marketStatements },
  ] },
  { title: "D. Facilitation du commerce et défis", questions: [
    { kind: "scale", title: "Degré d’accord — facilitation du commerce", prefix: "facilitation", statements: facilitationStatements },
    { kind: "multi", key: "defis", title: "Principaux défis rencontrés (plusieurs réponses)", options: ["Retards administratifs et douaniers", "Licences d’importation et d’exportation", "Normes techniques et exigences de qualité", "Coût élevé du transport", "Manque d’informations sur le marché", "Contraintes financières", "Mauvaises infrastructures", "Coût de conversion des devises", "Règles d’origine complexes"] },
  ] },
  { title: "E. Évaluation générale", questions: [
    { kind: "scale", title: "Degré d’accord — évaluation générale", prefix: "evaluation", statements: evaluationStatements },
  ] },
];
