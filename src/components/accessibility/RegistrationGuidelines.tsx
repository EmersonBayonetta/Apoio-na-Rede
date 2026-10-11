import { useEffect, useRef, useState } from 'react';
import sections from '../../data/registrationGuidelines.json';

const PDF_URL = '/documents/diretrizes-de-cadastro-apoio-na-rede.pdf';

export function RegistrationGuidelines({ accepted, onChange }: { accepted: boolean; onChange: (accepted: boolean) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const link = useRef<HTMLAnchorElement>(null);
  const [attemptedCheck, setAttemptedCheck] = useState(false);
  const showAcceptanceHint = attemptedCheck && !accepted;
  useEffect(() => {
    const modal = dialog.current;
    const restoreFocus = () => { document.body.style.overflow = previousOverflow; link.current?.focus(); };
    const previousOverflow = document.body.style.overflow;
    modal?.addEventListener('close', restoreFocus);
    return () => { modal?.removeEventListener('close', restoreFocus); document.body.style.overflow = previousOverflow; };
  }, []);
  return <>
    <div className="rounded-2xl border border-slate-200 p-4 text-sm">
      <div className="flex items-start gap-3">
        <input id="registration-guidelines" type="checkbox" required checked={accepted} aria-readonly="true" aria-invalid={showAcceptanceHint || undefined} aria-describedby="registration-guidelines-hint" onClick={event => { event.preventDefault(); if (!accepted) setAttemptedCheck(true); }} onChange={() => {}} className="mt-1 h-5 w-5 shrink-0 accent-[var(--ds-accent)]" />
        <div>
          <label htmlFor="registration-guidelines">Atesto a conformidade do cadastro com as </label>
          <a ref={link} href={PDF_URL} className="font-semibold text-blue-700 underline" aria-haspopup="dialog" onClick={event => { event.preventDefault(); dialog.current?.showModal(); document.body.style.overflow = 'hidden'; }}>Diretrizes da comunidade do Apoio na Rede</a>.
          <p id="registration-guidelines-hint" className={`mt-2 text-xs ${showAcceptanceHint ? 'text-rose-600 font-semibold' : 'text-slate-600'}`}>Abra as diretrizes e clique em “Li e aceito” para marcar este campo obrigatório.</p>
        </div>
      </div>
    </div>
    <dialog ref={dialog} aria-labelledby="guidelines-title" className="registration-guidelines-dialog" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
        <h2 id="guidelines-title" className="text-lg font-bold">Diretrizes de Cadastro – Apoio na Rede</h2>
        <button type="button" autoFocus aria-label="Fechar diretrizes" className="rounded-lg border px-3 py-2" onClick={() => dialog.current?.close()}>Fechar</button>
      </div>
      <div className="p-5">
        <object data={PDF_URL} type="application/pdf" aria-label="PDF das Diretrizes de Cadastro" className="h-[60vh] w-full rounded-xl bg-white">
          <p className="p-4">Seu navegador não exibe o PDF. <a href={PDF_URL} target="_blank" rel="noopener noreferrer" className="underline">Abrir PDF em outra aba</a> ou leia o texto abaixo.</p>
        </object>
        <a href={PDF_URL} download className="mt-3 inline-block text-sm text-blue-700 underline">Baixar PDF</a>
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold">Ler diretrizes em texto</summary>
          <div className="mt-4 space-y-5">{sections.map(section => <section key={section.heading}><h3 className="mb-3 font-bold">{section.heading}</h3><div className="space-y-3 text-sm leading-relaxed">{section.paragraphs.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div>
        </details>
        <div className="mt-6 flex justify-end border-t border-slate-200 pt-5">
          <button type="button" className="rounded-xl bg-blue-700 px-5 py-3 font-bold text-white" onClick={() => { onChange(true); dialog.current?.close(); }}>Li e aceito</button>
        </div>
      </div>
    </dialog>
  </>;
}
