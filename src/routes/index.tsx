import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, CheckCircle2, LockKeyhole, Mail, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Questionnaire COMESA | Bernard Rukerandanga" },
      { name: "description", content: "Enquête académique sur l’influence du COMESA sur le commerce burundais." },
      { property: "og:title", content: "Questionnaire sur le commerce burundais et le COMESA" },
      { property: "og:description", content: "Participez à cette enquête académique confidentielle sur le commerce régional." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Questionnaire,
});

type Answers = Record<string, string | string[] | number>;
type ChoiceProps = { name: string; value: string; label: string; answers: Answers; setAnswer: (name: string, value: string) => void };

const sections = ["Profil", "Connaissances", "Accès au marché", "Facilitation", "Évaluation"];

const knowledgeStatements = [
  "Je connais ce qu’est un bloc commercial.",
  "Je connais le COMESA.",
  "Je connais ses États membres.",
  "Je maîtrise les objectifs du COMESA.",
  "Je suis au courant que le Burundi est membre du COMESA.",
];

const marketStatements = [
  "Le COMESA a facilité l’accès de mon entreprise aux marchés régionaux.",
  "Le COMESA a augmenté les possibilités d’exportation de mon entreprise.",
  "Les mesures du COMESA ont réduit les coûts liés au commerce régional.",
  "Les accords du COMESA favorisent la compétitivité des entreprises burundaises.",
];

const facilitationStatements = [
  "Le commerce est devenu plus facile entre les pays du COMESA.",
  "Le COMESA a amélioré le transport et la logistique transfrontaliers.",
  "Les procédures douanières au sein du COMESA sont plus simples que celles du commerce hors COMESA.",
  "Le transport et les infrastructures facilitent le commerce au sein du COMESA.",
  "Le COMESA a contribué à réduire les barrières non tarifaires telles que les retards douaniers, la documentation complexe, le coût du transport et les restrictions à l’importation/exportation.",
];

const evaluationStatements = [
  "L’adhésion du Burundi au COMESA est bénéfique pour l’économie burundaise.",
  "Le Burundi a pleinement exploité les opportunités offertes par le COMESA.",
  "Le Gouvernement fournit un soutien suffisant aux entreprises commerçant au sein du COMESA.",
];

function Choice({ name, value, label, answers, setAnswer }: ChoiceProps) {
  const selected = answers[name] === value;
  return (
    <label className={`choice ${selected ? "choice-selected" : ""}`}>
      <input className="sr-only" type="radio" name={name} value={value} checked={selected} onChange={() => setAnswer(name, value)} />
      <span className="radio-dot">{selected && <span />}</span>
      <span>{label}</span>
    </label>
  );
}

function ChoiceGroup({ name, options, answers, setAnswer }: { name: string; options: string[]; answers: Answers; setAnswer: ChoiceProps["setAnswer"] }) {
  return <div className="choice-grid">{options.map((option) => <Choice key={option} name={name} value={option} label={option} answers={answers} setAnswer={setAnswer} />)}</div>;
}

function MultiChoice({ name, options, answers, toggle }: { name: string; options: string[]; answers: Answers; toggle: (name: string, value: string) => void }) {
  const selected = Array.isArray(answers[name]) ? answers[name] as string[] : [];
  return <div className="choice-grid">{options.map((option) => (
    <label key={option} className={`choice ${selected.includes(option) ? "choice-selected" : ""}`}>
      <input className="sr-only" type="checkbox" checked={selected.includes(option)} onChange={() => toggle(name, option)} />
      <span className="check-box">{selected.includes(option) && <Check />}</span><span>{option}</span>
    </label>
  ))}</div>;
}

function Scale({ name, statement, answers, setAnswer }: { name: string; statement: string; answers: Answers; setAnswer: ChoiceProps["setAnswer"] }) {
  return (
    <div className="scale-row">
      <p>{statement}</p>
      <div className="scale-options" role="radiogroup" aria-label={statement}>
        {[1, 2, 3, 4, 5].map((score) => (
          <label key={score} className={answers[name] === score ? "scale-selected" : ""}>
            <input className="sr-only" type="radio" name={name} checked={answers[name] === score} onChange={() => setAnswer(name, score as never)} />
            {score}
          </label>
        ))}
      </div>
    </div>
  );
}

function Question({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return <fieldset className="question"><legend><span>{number}</span>{title}</legend>{children}</fieldset>;
}

function Questionnaire() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const setAnswer = (name: string, value: string | number) => setAnswers((current) => ({ ...current, [name]: value }));
  const toggle = (name: string, value: string) => setAnswers((current) => {
    const list = Array.isArray(current[name]) ? current[name] as string[] : [];
    return { ...current, [name]: list.includes(value) ? list.filter((item) => item !== value) : [...list, value] };
  });

  const requiredByStep = [
    ["sexe", "occupation", "commerce", "experience", "partenaire"],
    ["facilites", "programmes", "comprehension", ...knowledgeStatements.map((_, i) => `knowledge_${i}`)],
    ["hors_burundi", "acces_marche", ...marketStatements.map((_, i) => `market_${i}`)],
    [...facilitationStatements.map((_, i) => `facilitation_${i}`), "defis"],
    evaluationStatements.map((_, i) => `evaluation_${i}`),
  ];

  const validate = () => {
    const missing = requiredByStep[step].some((key) => answers[key] === undefined || answers[key] === "" || (Array.isArray(answers[key]) && answers[key].length === 0));
    if (missing) { setError("Veuillez répondre à toutes les questions de cette section."); return false; }
    setError(""); return true;
  };

  const next = () => { if (validate()) { setStep((current) => Math.min(current + 1, sections.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); } };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    const { error: saveError } = await supabase.from("questionnaire_responses").insert({ answers });
    setSubmitting(false);
    if (saveError) { setError("L’envoi a échoué. Veuillez réessayer dans un instant."); return; }
    setDone(true); window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (done) return <main className="success-page"><div className="success-mark"><CheckCircle2 /></div><p className="eyebrow">Réponse enregistrée</p><h1>Merci pour votre participation.</h1><p>Votre réponse a bien été transmise. Elle contribuera à cette étude sur l’influence du COMESA sur le commerce burundais.</p><div className="confidential"><LockKeyhole /> Vos informations restent confidentielles.</div></main>;

  return (
    <main className="survey-shell">
      <header className="survey-header">
        <div className="brand-mark">BIU</div>
        <div><p>Bujumbura International University</p><span>Master en Administration et Gestion des Affaires</span></div>
        <div className="study-tag">Étude académique · 2026</div>
      </header>

      <section className="intro">
        <div className="intro-copy">
          <p className="eyebrow">Questionnaire de recherche</p>
          <h1>Le système des blocs commerciaux et son influence sur le commerce burundais</h1>
          <p className="subtitle">Cas du Marché commun de l’Afrique orientale et australe — COMESA</p>
          <p>Je m’appelle <strong>Bernard Rukerandanga</strong>. Cette enquête s’inscrit dans le cadre de mon mémoire de Master. Votre participation contribuera à la recherche académique et à la réflexion sur le cadre économique du Burundi.</p>
        </div>
        <aside className="contact-panel">
          <div><LockKeyhole /><span><strong>Confidentiel</strong>Les informations fournies sont protégées.</span></div>
          <a href="mailto:rukerabernard@gmail.com"><Mail /><span>rukerabernard@gmail.com</span></a>
          <a href="tel:+25769427619"><Phone /><span>69 427 619 / 79 404 162</span></a>
        </aside>
      </section>

      <nav className="steps" aria-label="Progression du questionnaire">
        {sections.map((section, index) => <div key={section} className={index === step ? "step-active" : index < step ? "step-done" : ""}><span>{index < step ? <Check /> : index + 1}</span><small>{section}</small></div>)}
      </nav>

      <form className="survey-form" onSubmit={submit}>
        <div className="section-heading"><span>Section {String.fromCharCode(65 + step)}</span><h2>{[
          "Profil du répondant", "Connaissances sur le bloc commercial", "Libéralisation commerciale et accès au marché", "Facilitation du commerce et défis", "Évaluation générale et implications politiques"
        ][step]}</h2><p>{step === 0 ? "Parlez-nous brièvement de votre activité professionnelle." : step === 1 ? "Indiquez votre connaissance du COMESA et de ses programmes." : step === 2 ? "Décrivez l’accès de votre entreprise aux marchés régionaux." : step === 3 ? "Évaluez les effets pratiques du COMESA et les difficultés rencontrées." : "Partagez votre appréciation globale de l’intégration régionale."}</p></div>

        {step === 0 && <div className="questions">
          <Question number={1} title="Quel est votre sexe ?"><ChoiceGroup name="sexe" options={["Féminin", "Masculin"]} answers={answers} setAnswer={setAnswer} /></Question>
          <Question number={2} title="Quelle est votre occupation dans l’entreprise ?"><ChoiceGroup name="occupation" options={["Chef du service vente", "Chef du service achat", "Autre employé d’entreprise", "Autre"]} answers={answers} setAnswer={setAnswer} />{answers.occupation === "Autre" && <input className="text-input" placeholder="Précisez votre occupation" onChange={(e) => setAnswer("occupation_autre", e.target.value)} />}</Question>
          <Question number={3} title="Quel type de commerce votre entreprise pratique-t-elle le plus ?"><ChoiceGroup name="commerce" options={["Importation", "Exportation", "Entrepôt / Réexportation", "Autre"]} answers={answers} setAnswer={setAnswer} />{answers.commerce === "Autre" && <input className="text-input" placeholder="Précisez le type de commerce" onChange={(e) => setAnswer("commerce_autre", e.target.value)} />}</Question>
          <Question number={4} title="Quelle est votre expérience dans le commerce transfrontalier avec le COMESA ?"><ChoiceGroup name="experience" options={["Moins de 2 ans", "2 à 4 ans", "4 à 6 ans", "Plus de 6 ans"]} answers={answers} setAnswer={setAnswer} /></Question>
          <Question number={5} title="Avec quel État partenaire du COMESA commercez-vous principalement ?"><ChoiceGroup name="partenaire" options={["Kenya", "Rwanda", "RDC", "Ouganda", "Autre"]} answers={answers} setAnswer={setAnswer} />{answers.partenaire === "Autre" && <input className="text-input" placeholder="Précisez le pays" onChange={(e) => setAnswer("partenaire_autre", e.target.value)} />}</Question>
        </div>}

        {step === 1 && <div className="questions">
          <Question number={1} title="Êtes-vous au courant des facilités commerciales du COMESA ?"><ChoiceGroup name="facilites" options={["Oui", "Non"]} answers={answers} setAnswer={setAnswer} /></Question>
          <Question number={2} title="Parmi les programmes suivants du COMESA, lesquels connaissez-vous ?"><p className="hint">Plusieurs réponses sont possibles.</p><MultiChoice name="programmes" options={["Union douanière", "Poste frontalier à arrêt unique", "Zone de libre-échange", "Autre"]} answers={answers} toggle={toggle} /></Question>
          <Question number={3} title="Quel est votre niveau de compréhension des politiques du COMESA ?"><ChoiceGroup name="comprehension" options={["Très élevé", "Élevé", "Modéré", "Très faible"]} answers={answers} setAnswer={setAnswer} /></Question>
          <Question number={4} title="À quel niveau êtes-vous d’accord avec les affirmations ci-dessous ?"><ScaleLegend />{knowledgeStatements.map((statement, i) => <Scale key={statement} name={`knowledge_${i}`} statement={statement} answers={answers} setAnswer={setAnswer} />)}</Question>
        </div>}

        {step === 2 && <div className="questions">
          <Question number={1} title="Votre entreprise vend-elle des produits ou services en dehors du Burundi ?"><ChoiceGroup name="hors_burundi" options={["Oui", "Non"]} answers={answers} setAnswer={setAnswer} />{answers.hors_burundi === "Oui" && <div className="follow-up"><p>Quel marché régional utilisez-vous davantage ?</p><ChoiceGroup name="marche_regional" options={["COMESA", "EAC", "ECOWAS", "SADC"]} answers={answers} setAnswer={setAnswer} /></div>}</Question>
          <Question number={2} title="Comment accédez-vous au marché régional ?"><ChoiceGroup name="acces_marche" options={["Exportation directe", "À travers des intermédiaires", "Coentreprises", "Plateformes numériques"]} answers={answers} setAnswer={setAnswer} /></Question>
          <Question number={3} title="À quel niveau êtes-vous d’accord avec les affirmations ci-dessous ?"><ScaleLegend />{marketStatements.map((statement, i) => <Scale key={statement} name={`market_${i}`} statement={statement} answers={answers} setAnswer={setAnswer} />)}</Question>
        </div>}

        {step === 3 && <div className="questions">
          <Question number={1} title="À quel niveau êtes-vous d’accord avec les affirmations ci-dessous ?"><ScaleLegend />{facilitationStatements.map((statement, i) => <Scale key={statement} name={`facilitation_${i}`} statement={statement} answers={answers} setAnswer={setAnswer} />)}</Question>
          <Question number={2} title="Quels sont les principaux défis rencontrés lors de l’accès au marché régional ?"><p className="hint">Plusieurs réponses sont possibles.</p><MultiChoice name="defis" options={["Retards administratifs et douaniers", "Licences d’importation et d’exportation", "Normes techniques et exigences de qualité", "Coût élevé du transport", "Manque d’informations sur le marché", "Contraintes financières", "Mauvaises infrastructures", "Coût de conversion des devises", "Règles d’origine complexes"]} answers={answers} toggle={toggle} /></Question>
        </div>}

        {step === 4 && <div className="questions"><Question number={1} title="À quel niveau êtes-vous d’accord avec les affirmations ci-dessous ?"><ScaleLegend />{evaluationStatements.map((statement, i) => <Scale key={statement} name={`evaluation_${i}`} statement={statement} answers={answers} setAnswer={setAnswer} />)}</Question></div>}

        {error && <p className="form-error" role="alert">{error}</p>}
        <div className="form-actions">
          <Button type="button" variant="outline" onClick={() => setStep((current) => Math.max(0, current - 1))} disabled={step === 0}><ArrowLeft /> Précédent</Button>
          <span>Étape {step + 1} sur {sections.length}</span>
          {step < sections.length - 1 ? <Button type="button" onClick={next}>Continuer <ArrowRight /></Button> : <Button type="submit" disabled={submitting}>{submitting ? "Envoi…" : "Envoyer mes réponses"}<Check /></Button>}
        </div>
      </form>
      <footer>Questionnaire de recherche · Bernard Rukerandanga · BIU</footer>
    </main>
  );
}

function ScaleLegend() {
  return <div className="scale-legend"><span><b>1</b> Fortement en désaccord</span><span><b>3</b> Neutre</span><span><b>5</b> Fortement d’accord</span></div>;
}