import React, { useState } from "react";
import { 
  FileText, ArrowRight, ArrowLeft, RefreshCw, CheckCircle, 
  AlertTriangle, BookOpen, Scale, Sparkles, Plus, Trash, HelpCircle, Save 
} from "lucide-react";
import { savePortfolioItem } from "../firebase";

interface WorkspaceProps {
  userId: string;
  skillsPracticed: string[];
  setSkillsPracticed: React.Dispatch<React.SetStateAction<string[]>>;
}

export default function Workspace({ userId, skillsPracticed, setSkillsPracticed }: WorkspaceProps) {
  const [step, setStep] = useState<number>(1);
  const [saving, setSaving] = useState(false);

  // Document draft states
  const [document, setDocument] = useState({
    title: "",
    introduction: "",
    thesis: "",
    bodyParagraphs: [
      { id: "b1", claim: "", evidence: "", explanation: "", example: "", link: "" },
      { id: "b2", claim: "", evidence: "", explanation: "", example: "", link: "" }
    ],
    counterargument: { claim: "", opposingView: "", evidence: "", response: "", rebuttalEvidence: "", link: "" },
    conclusion: "",
    sources: [
      { id: "s1", author: "", year: "", title: "", publication: "", url: "" }
    ],
    revisionNotes: "",
    reflectionText: ""
  });

  // Coherence report state
  const [coherenceReport, setCoherenceReport] = useState<{
    overallScore: number;
    feedback: string;
    coherenceAreas: { area: string; status: string; observations: string; guidingQuestions: string[] }[];
  } | null>(null);
  const [auditing, setAuditing] = useState(false);

  // -------------------------------------------------------------
  // HANDLERS
  // -------------------------------------------------------------
  const updateBodyParagraph = (index: number, field: string, value: string) => {
    setDocument(prev => {
      const updated = [...prev.bodyParagraphs];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, bodyParagraphs: updated };
    });
  };

  const addBodyParagraph = () => {
    setDocument(prev => ({
      ...prev,
      bodyParagraphs: [
        ...prev.bodyParagraphs,
        { id: "b" + (prev.bodyParagraphs.length + 1), claim: "", evidence: "", explanation: "", example: "", link: "" }
      ]
    }));
  };

  const removeBodyParagraph = (index: number) => {
    setDocument(prev => ({
      ...prev,
      bodyParagraphs: prev.bodyParagraphs.filter((_, idx) => idx !== index)
    }));
  };

  const updateSource = (index: number, field: string, value: string) => {
    setDocument(prev => {
      const updated = [...prev.sources];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, sources: updated };
    });
  };

  const addSource = () => {
    setDocument(prev => ({
      ...prev,
      sources: [...prev.sources, { id: "s" + (prev.sources.length + 1), author: "", year: "", title: "", publication: "", url: "" }]
    }));
  };

  // Compile entire text
  const compileFullDraft = () => {
    const bodyText = document.bodyParagraphs
      .map((p, i) => `Paragraph ${i + 1}:\n${p.claim} ${p.evidence} ${p.explanation} ${p.example} ${p.link}`)
      .join("\n\n");

    const counterText = document.counterargument.claim 
      ? `Counterargument:\n${document.counterargument.opposingView} ${document.counterargument.evidence} ${document.counterargument.response} ${document.counterargument.rebuttalEvidence} ${document.counterargument.link}`
      : "";

    const refText = document.sources
      .map(s => `${s.author} (${s.year}). ${s.title}. ${s.publication}. ${s.url ? `URL: ${s.url}` : ""}`)
      .join("\n");

    return `TITLE: ${document.title}

INTRODUCTION:
${document.introduction}

THESIS STATEMENT:
${document.thesis}

BODY DEVELOPMENT:
${bodyText}

${counterText ? `${counterText}\n\n` : ""}CONCLUSION:
${document.conclusion}

REFERENCES:
${refText}`;
  };

  // Run Whole-Paper Coherence Check
  const handleCoherenceCheck = async () => {
    setAuditing(true);
    try {
      const response = await fetch("/api/gemini/coherence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ document })
      });
      const data = await response.json();
      setCoherenceReport(data);

      if (!skillsPracticed.includes("Argument mapping")) {
        setSkillsPracticed(prev => [...prev, "Argument mapping"]);
      }
    } catch (e) {
      console.error(e);
      alert("Coherence audit failed. Let's try again.");
    } finally {
      setAuditing(false);
    }
  };

  // Submit Completed Document to Student Portfolio
  const handleSubmitPortfolio = async () => {
    setSaving(true);
    try {
      const fullText = compileFullDraft();
      await savePortfolioItem({
        userId: userId,
        type: "essay",
        title: document.title || "Untitled Scaffolding Paper",
        draft: fullText,
        revisedDraft: document.revisionNotes ? `REVISION PROGRESS NOTES:\n${document.revisionNotes}\n\nREVISED CONTENT:\n${fullText}` : undefined,
        reflection: document.reflectionText || "Self-guided AI-balanced writing exercise.",
        scaffoldingTier: 3,
        skillsPracticed: ["Sentence structure", "Paragraph development", "Argument mapping", "Referencing"],
        aiBalanceMeter: { independent: 80, aiAssisted: 20 }
      });
      alert("Excellent! Your complete drafted paper and AI-use reflections have been securely added to your Student Portfolio. Your teacher will be able to evaluate it!");
    } catch (e) {
      console.error(e);
      alert("Unable to upload portfolio. Try again!");
    } finally {
      setSaving(false);
    }
  };

  const stepsList = [
    "Title", "Introduction", "Thesis", "Body 1", "Body 2", "Counterargument", "Conclusion", "References", "Coherence", "Revision Center", "Reflection"
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm flex flex-col h-full" id="complete_writing_workspace">
      
      {/* Workspace Header */}
      <div className="bg-indigo-600 text-white p-5">
        <div className="flex items-center gap-2">
          <FileText className="w-6 h-6 text-indigo-200 animate-pulse" />
          <div>
            <h3 className="font-bold text-base leading-tight">Interactive Writing Workspace</h3>
            <p className="text-xs text-indigo-200 mt-1">Develop your academic paper progressively, check coherence, revise, and reflect.</p>
          </div>
        </div>
        
        {/* Step Progression Bar */}
        <div className="flex justify-between items-center mt-5 overflow-x-auto gap-2 pb-2 scrollbar-none">
          {stepsList.map((s, i) => (
            <button
              key={i}
              onClick={() => setStep(i + 1)}
              className={`text-[10px] font-bold px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all flex items-center gap-1 shrink-0 ${
                step === i + 1
                  ? "bg-white text-indigo-700 shadow-xs"
                  : step > i + 1
                  ? "bg-indigo-700 text-indigo-100"
                  : "bg-indigo-800 text-indigo-300"
              }`}
            >
              <span>{i + 1}</span>
              <span>{s}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Workspace Workspace */}
      <div className="flex-1 p-6 overflow-y-auto min-h-[450px]">
        
        {/* STEP 1: TITLE */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 1: Document Title</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Craft a title that clearly communicates your specific variables, studied group, and scholarly focus.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Your Document Title Draft:</label>
              <input
                type="text"
                placeholder="e.g., Academic Stress and Sleep Quality Among Grade 11 STEM Students"
                value={document.title}
                onChange={(e) => setDocument({ ...document, title: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              />
            </div>
          </div>
        )}

        {/* STEP 2: INTRODUCTION */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 2: Introduction Context</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Establish the context of your writing. Make sure to cover an engaging <strong>Opening Hook</strong>, <strong>Background Context</strong>, and <strong>Central Issue</strong>.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Draft Your Complete Introduction Section:</label>
              <textarea
                placeholder="Hook the reader, supply required background contexts, and lead into the problem..."
                value={document.introduction}
                onChange={(e) => setDocument({ ...document, introduction: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs h-36 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 3: THESIS */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 3: Thesis Statement Formulation</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                The central argument of your paper. Make sure it specifies: <strong>Topic + Position + Supporting Reasons</strong>.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Draft Your Controlling Thesis Statement:</label>
              <input
                type="text"
                placeholder="e.g., Online learning benefits senior high school students because it offers flexible schedules and access to rich digital resources."
                value={document.thesis}
                onChange={(e) => setDocument({ ...document, thesis: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-semibold text-slate-800"
              />
            </div>
          </div>
        )}

        {/* STEP 4 & 5: BODY PARAGRAPHS */}
        {(step === 4 || step === 5) && (
          <div className="space-y-5">
            {(() => {
              const idx = step === 4 ? 0 : 1;
              const paragraph = document.bodyParagraphs[idx] || { claim: "", evidence: "", explanation: "", example: "", link: "" };
              return (
                <>
                  <div className="border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-slate-800 text-sm">Step {step}: Body Paragraph Development (Paragraph {idx + 1})</h4>
                    <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                      Develop body paragraphs using the visual scaffolding: <strong>CLAIM → EVIDENCE → EXPLANATION → EXAMPLE → LINK</strong>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">CLAIM (Main Point)</label>
                        <input
                          type="text"
                          placeholder="What is your main point for this paragraph?"
                          value={paragraph.claim}
                          onChange={(e) => updateBodyParagraph(idx, "claim", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">EVIDENCE (Supporting Facts / Study)</label>
                        <input
                          type="text"
                          placeholder="What scholarly study, fact, or statistic supports this?"
                          value={paragraph.evidence}
                          onChange={(e) => updateBodyParagraph(idx, "evidence", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">EXPLANATION (How evidence supports claim)</label>
                        <textarea
                          placeholder="Explain what the evidence means and why it validates your point."
                          value={paragraph.explanation}
                          onChange={(e) => updateBodyParagraph(idx, "explanation", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">EXAMPLE (Illustration)</label>
                        <input
                          type="text"
                          placeholder="Provide a concrete example to illustrate your point..."
                          value={paragraph.example}
                          onChange={(e) => updateBodyParagraph(idx, "example", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-indigo-700 mb-1">LINK (Connection to Thesis)</label>
                        <input
                          type="text"
                          placeholder="How does this entire paragraph tie back to your main thesis?"
                          value={paragraph.link}
                          onChange={(e) => updateBodyParagraph(idx, "link", e.target.value)}
                          className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        />
                      </div>

                      {/* Displaying paragraph structure visually while writing */}
                      <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                        <div className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider mb-1.5">Draft Preview (Continuous flow):</div>
                        <p className="text-[11px] text-slate-700 leading-relaxed italic">
                          {paragraph.claim || "..."} {paragraph.evidence || "..."} {paragraph.explanation || "..."} {paragraph.example || "..."} {paragraph.link || "..."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
        )}

        {/* STEP 6: COUNTERARGUMENT */}
        {step === 6 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 6: Counterargument & Rebuttal</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Strong academic writing always considers alternative perspectives. Acknowledge opposing arguments fairly and provide a structured rebuttal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-rose-700 mb-1">Opposing View (What critics argue)</label>
                  <input
                    type="text"
                    placeholder="e.g., On the other hand, critics argue that online learning creates visual isolation."
                    value={document.counterargument.opposingView}
                    onChange={(e) => setDocument({
                      ...document,
                      counterargument: { ...document.counterargument, opposingView: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-rose-700 mb-1">Critics' Evidence / Reasons</label>
                  <textarea
                    placeholder="What evidence do they present to back up this view?"
                    value={document.counterargument.evidence}
                    onChange={(e) => setDocument({
                      ...document,
                      counterargument: { ...document.counterargument, evidence: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">Your Rebuttal Response</label>
                  <input
                    type="text"
                    placeholder="How do you answer this concern? Why is your main argument still superior?"
                    value={document.counterargument.response}
                    onChange={(e) => setDocument({
                      ...document,
                      counterargument: { ...document.counterargument, response: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-emerald-700 mb-1">Evidence Supporting Your Response & Link</label>
                  <textarea
                    placeholder="Provide evidence that disproves or minimizes their claim, and tie it back to the thesis..."
                    value={document.counterargument.rebuttalEvidence}
                    onChange={(e) => setDocument({
                      ...document,
                      counterargument: { ...document.counterargument, rebuttalEvidence: e.target.value }
                    })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg p-2 text-xs h-16 focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: CONCLUSION */}
        {step === 7 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 7: Conclusion Writing</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Never simply copy your introduction. Restate your main argument, synthesize major points, explain the broader significance, and leave the reader with a final, memorable insight.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Draft Your Complete Conclusion:</label>
              <textarea
                placeholder="Synthesize, establish importance, leave final insights, and add recommendations if appropriate..."
                value={document.conclusion}
                onChange={(e) => setDocument({ ...document, conclusion: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs h-36 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* STEP 8: REFERENCES */}
        {step === 8 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800 text-sm">Step 8: Referencing & Sources</h4>
                <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                  Add bibliographic details for sources cited in your paper to compose an APA 7th edition reference list.
                </p>
              </div>
              <button
                onClick={addSource}
                className="text-[10px] font-bold px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-all"
              >
                + Add Source
              </button>
            </div>

            <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
              {document.sources.map((src, index) => (
                <div key={src.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl relative space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700">Source #{index + 1}</span>
                    {document.sources.length > 1 && (
                      <button
                        onClick={() => removeBodyParagraph(index)}
                        className="text-rose-500 hover:text-rose-700 text-xs flex items-center gap-1"
                      >
                        <Trash className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Author (e.g., Smith, J.)</label>
                      <input
                        type="text"
                        value={src.author}
                        onChange={(e) => updateSource(index, "author", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-[11px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Year (e.g., 2023)</label>
                      <input
                        type="text"
                        value={src.year}
                        onChange={(e) => updateSource(index, "year", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-[11px] outline-none"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Title of Article/Book</label>
                      <input
                        type="text"
                        value={src.title}
                        onChange={(e) => updateSource(index, "title", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-[11px] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">Journal or Publication / Website</label>
                      <input
                        type="text"
                        value={src.publication}
                        onChange={(e) => updateSource(index, "publication", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-[11px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-500 uppercase">DOI or Web Link URL</label>
                      <input
                        type="text"
                        value={src.url}
                        onChange={(e) => updateSource(index, "url", e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-[11px] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: WHOLE-PAPER COHERENCE */}
        {step === 9 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 9: Whole-Paper Coherence Check</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Run a logical alignment audit across your complete draft. The AI will evaluate flow and consistency, and provide targeted reflective questions.
              </p>
            </div>

            <button
              onClick={handleCoherenceCheck}
              disabled={auditing}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all shadow-xs disabled:opacity-50"
            >
              {auditing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Auditing Paper Coherence...
                </>
              ) : (
                "🔍 Generate Whole-Paper Coherence Report"
              )}
            </button>

            {coherenceReport && (
              <div className="space-y-4 mt-3">
                {/* Score Indicator */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-4 rounded-xl">
                  <div className="w-14 h-14 rounded-full border-4 border-indigo-600 flex items-center justify-center font-black text-indigo-700 text-sm shrink-0 bg-white shadow-xs">
                    {coherenceReport.overallScore}%
                  </div>
                  <div>
                    <h5 className="font-bold text-slate-800 text-xs">Logical Coherence Score</h5>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-normal">{coherenceReport.feedback}</p>
                  </div>
                </div>

                {/* Audit Areas */}
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {coherenceReport.coherenceAreas.map((area, idx) => {
                    const statusBg = 
                      area.status === "Pass" ? "bg-emerald-50 border-emerald-200 text-emerald-800" :
                      area.status === "Action Required" ? "bg-amber-50 border-amber-200 text-amber-800" :
                      "bg-sky-50 border-sky-200 text-sky-800";

                    return (
                      <div key={idx} className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${statusBg}`}>
                        <div className="flex items-center justify-between font-bold">
                          <span>{area.area}</span>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 bg-white border rounded-full">
                            {area.status}
                          </span>
                        </div>
                        <p className="leading-relaxed opacity-95">{area.observations}</p>
                        {area.guidingQuestions && area.guidingQuestions.length > 0 && (
                          <div className="pt-1 border-t border-slate-300/30 mt-1">
                            <span className="font-bold text-[10px] block uppercase text-slate-500 tracking-wider">Reflective Questions:</span>
                            <ul className="list-disc pl-4 space-y-0.5 text-[11px] mt-1 leading-normal opacity-90 italic">
                              {area.guidingQuestions.map((q, qidx) => (
                                <li key={qidx}>{q}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 10: REVISION CENTER */}
        {step === 10 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 10: Revision Center</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Self-evaluate and refine your paper across Content, Organization, and Language. Log your revision progress notes below.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">🟢 Content Checklist</span>
                <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                  <li>☐ Is my main idea/thesis clear?</li>
                  <li>☐ Are my supportive arguments strong?</li>
                  <li>☐ Is my evidence sufficiently scholarly?</li>
                  <li>☐ Is my explanation logically sound?</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">🔵 Organization Checklist</span>
                <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                  <li>☐ Does each paragraph have a purpose?</li>
                  <li>☐ Are my ideas in a logical order?</li>
                  <li>☐ Do paragraphs connect seamlessly?</li>
                  <li>☐ Is there a transition sentence?</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <span className="font-bold text-[10px] uppercase text-indigo-700 tracking-wider">🔴 Language Checklist</span>
                <ul className="text-[11px] text-slate-600 space-y-1 leading-relaxed">
                  <li>☐ Is subject-verb agreement correct?</li>
                  <li>☐ Are there any fragment errors?</li>
                  <li>☐ Is my vocabulary scholarly and academic?</li>
                  <li>☐ Is punctuation correctly placed?</li>
                </ul>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Progress Notes (What did you change or improve?):</label>
              <textarea
                placeholder="Log your revisions here. e.g., 'Revised body paragraph 1 to improve topic-thesis transition, and reformatted in-text citations according to APA 7th edition.'"
                value={document.revisionNotes}
                onChange={(e) => setDocument({ ...document, revisionNotes: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs h-20 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 11: REFLECTION JOURNAL */}
        {step === 11 && (
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h4 className="font-bold text-slate-800 text-sm">Step 11: AI-Use Reflection Journal</h4>
              <p className="text-[11px] text-slate-500 mt-1 leading-normal">
                Reflect honestly on how you utilized AI during your writing process. Explain what you evaluated, why you changed parts, and how you ensured your own academic authorship.
              </p>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-[11px] font-bold text-amber-900 uppercase">Responsible AI Usage</h5>
                <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                  AI is a tutor that helps you learn and correct mistakes. You should never copy and paste essay text. Reflecting on your AI assistance helps solidify academic integrity.
                </p>
              </div>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Draft your AI-use Reflection:</label>
                <textarea
                  placeholder="Explain how AI assisted you in developing ideas or identifying structure, and what thoughts you changed on your own..."
                  value={document.reflectionText}
                  onChange={(e) => setDocument({ ...document, reflectionText: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-2xl p-4 text-xs h-28 focus:ring-1 focus:ring-indigo-500 outline-none leading-relaxed"
                />
              </div>

              <button
                onClick={handleSubmitPortfolio}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-xs"
              >
                <Save className="w-4 h-4" />
                {saving ? "Publishing submission..." : "Submit Complete Paper and Reflections to Portfolio"}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Workspace Footer Navigation */}
      <div className="bg-slate-100 border-t border-slate-200 px-6 py-4 flex justify-between items-center text-xs">
        <button
          onClick={() => setStep(prev => Math.max(1, prev - 1))}
          disabled={step === 1}
          className="flex items-center gap-1 font-semibold text-slate-600 hover:text-slate-800 disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" /> Previous Step
        </button>

        <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          Step {step} of 11
        </span>

        <button
          onClick={() => setStep(prev => Math.min(11, prev + 1))}
          disabled={step === 11}
          className="flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
        >
          Next Step <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
