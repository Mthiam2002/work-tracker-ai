"use client";

import { useState, useTransition } from "react";
import { uploadPayslip } from "@/app/(protected)/payslips/payslips-actions";

const inputClass =
  "w-full rounded-2xl border border-border bg-card px-4 py-3 text-[15px] text-card-foreground outline-none transition focus:border-accent focus:bg-card focus:ring-4 focus:ring-accent/20 dark:border-white/10 dark:text-card-foreground dark:focus:bg-card";

export function PayslipUploadForm() {
  const currentYear = new Date().getFullYear();
  const [file, setFile] = useState<File | null>(null);
  const [year, setYear] = useState(String(currentYear));
  const [month, setMonth] = useState("");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setIsError(false);

    if (!file) {
      setIsError(true);
      setMessage("Merci de choisir un fichier PDF.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("year", year);
    if (month) formData.append("month", month);

    startTransition(async () => {
      try {
        await uploadPayslip(formData);
        setIsError(false);
        setMessage("Bulletin téléversé avec succès !");
        setFile(null);
        const input = document.getElementById("payslip-file") as HTMLInputElement | null;
        if (input) input.value = "";
      } catch (error) {
        console.error("Erreur upload bulletin :", error);
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Échec du téléversement.");
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="payslip-file" className="mb-1.5 block text-sm font-medium text-card-foreground">
          Fichier PDF (max 10 Mo)
        </label>
        <input
          id="payslip-file"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="w-full rounded-2xl border border-dashed border-border bg-muted/60 px-4 py-6 text-sm text-muted-foreground file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-accent/90 dark:border-white/15 dark:text-muted-foreground"
        />
        {file && (
          <p className="mt-1.5 text-xs text-muted-foreground">
            {file.name} · {(file.size / 1024 / 1024).toFixed(2)} Mo
          </p>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="payslip-year" className="mb-1.5 block text-sm font-medium text-card-foreground">
            Année
          </label>
          <input
            id="payslip-year"
            type="number"
            min={2000}
            max={2100}
            value={year}
            onChange={(e) => setYear(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="payslip-month" className="mb-1.5 block text-sm font-medium text-card-foreground">
            Mois (optionnel)
          </label>
          <select id="payslip-month" value={month} onChange={(e) => setMonth(e.target.value)} className={inputClass}>
            <option value="">—</option>
            {["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"].map(
              (m, i) => (
                <option key={m} value={i + 1}>
                  {m}
                </option>
              )
            )}
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex h-12 w-full items-center justify-center rounded-full bg-accent px-7 text-[15px] font-medium text-white transition hover:bg-accent/90 disabled:opacity-50"
      >
        {isPending ? "Téléversement..." : "Téléverser le bulletin"}
      </button>

      {message && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm ${
            isError
              ? "bg-loss/12 text-loss dark:bg-loss/20 dark:text-loss"
              : "bg-profit/12 text-profit dark:bg-profit/20 dark:text-profit"
          }`}
        >
          {message}
        </p>
      )}
    </form>
  );
}
