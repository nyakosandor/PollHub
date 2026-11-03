"use client";

import { useState, useTransition, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { createPoll, PollActionError } from "@/actions/poll";
import { defaultClosingTime, toDateTimeInputValue } from "@/lib/closingTime";
import { useTimeout } from "@/lib/useTimeout";
import { MIN_POLL_OPTIONS, normalizeNewPoll, validatePoll } from "@/lib/validation";
import { BUTTON_GHOST, BUTTON_PRIMARY, CARD, ICON_BUTTON, INPUT, LABEL } from "@/lib/ui";
import { AlertCircle, CheckCircle2, Plus, PlusCircle, Trash2 } from "lucide-react";

const SUCCESS_MESSAGE_MS = 2500;

interface DraftOption {
  id: string;
  text: string;
}

const createDraftOption = (): DraftOption => ({ id: crypto.randomUUID(), text: "" });
const createEmptyDraftOptions = () =>
  Array.from({ length: MIN_POLL_OPTIONS }, createDraftOption);

const createDefaultClosingInput = () =>
  toDateTimeInputValue(defaultClosingTime(Date.now()));

export default function CreatePollForm() {
  const t = useTranslations("form");
  const scheduleTimeout = useTimeout();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<DraftOption[]>(createEmptyDraftOptions);
  const [closingInput, setClosingInput] = useState(createDefaultClosingInput);
  const [error, setError] = useState<PollActionError | null>(null);
  const [isPending, startTransition] = useTransition();
  const [showSuccess, setShowSuccess] = useState(false);

  const updateOption = (id: string, text: string) => {
    setOptions((prev) =>
      prev.map((option) => (option.id === id ? { ...option, text } : option))
    );
  };

  const addOption = () => setOptions((prev) => [...prev, createDraftOption()]);

  const removeOption = (id: string) => {
    setOptions((prev) => prev.filter((option) => option.id !== id));
  };

  const resetForm = () => {
    setTitle("");
    setQuestion("");
    setOptions(createEmptyDraftOptions());
    setClosingInput(createDefaultClosingInput());
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setShowSuccess(false);

    const newPoll = normalizeNewPoll({
      title,
      questionText: question,
      optionTexts: options.map((option) => option.text),
      // The input holds local time, so the browser converts it to UTC.
      closesAt: new Date(closingInput).getTime(),
    });

    // Instant feedback here; the Server Action validates again.
    const validationError = validatePoll(newPoll, Date.now());
    setError(validationError);
    if (validationError) return;

    startTransition(async () => {
      const result = await createPoll(newPoll);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      resetForm();
      setShowSuccess(true);
      scheduleTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`${CARD} flex flex-col gap-6 p-6 sm:p-8`}
    >
      <div>
        <label htmlFor="poll-title" className={LABEL}>
          {t("title")}
        </label>
        <input
          id="poll-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className={INPUT}
        />
      </div>

      <div>
        <label htmlFor="poll-question" className={LABEL}>
          {t("question")}
        </label>
        <input
          id="poll-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("questionPlaceholder")}
          className={INPUT}
        />
      </div>

      <fieldset>
        <legend className={LABEL}>{t("options")}</legend>
        <div className="flex flex-col gap-2.5">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-semibold text-slate-600 tabular-nums dark:bg-slate-800 dark:text-slate-400"
              >
                {index + 1}
              </span>
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={t("optionPlaceholder", { number: index + 1 })}
                className={INPUT}
              />
              {options.length > MIN_POLL_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className={ICON_BUTTON}
                  aria-label={t("removeOption", { number: index + 1 })}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className={`${BUTTON_GHOST} mt-3 ml-6`}
        >
          <PlusCircle aria-hidden="true" className="h-4 w-4" />
          {t("addOption")}
        </button>
      </fieldset>

      <div className="sm:max-w-xs">
        <label htmlFor="poll-closes-at" className={LABEL}>
          {t("closingTime")}
        </label>
        <input
          id="poll-closes-at"
          type="datetime-local"
          value={closingInput}
          onChange={(e) => setClosingInput(e.target.value)}
          className={INPUT}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 ring-1 ring-red-600/15 ring-inset dark:bg-red-500/10 dark:ring-red-400/25">
          <AlertCircle
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-red-600 dark:text-red-400"
          />
          <p
            role="alert"
            data-testid="form-error"
            data-error={error}
            className="text-sm font-medium text-red-700 dark:text-red-300"
          >
            {t(`errors.${error}`)}
          </p>
        </div>
      )}
      {showSuccess && (
        <div className="flex items-start gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 ring-1 ring-emerald-600/15 ring-inset dark:bg-emerald-500/10 dark:ring-emerald-400/25">
          <CheckCircle2
            aria-hidden="true"
            className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
          />
          <p
            data-testid="form-success"
            className="text-sm font-medium text-emerald-700 dark:text-emerald-300"
          >
            {t("success")}
          </p>
        </div>
      )}

      <div className="flex border-t border-slate-100 pt-6 dark:border-slate-800">
        <button
          type="submit"
          data-testid="create-poll-submit"
          disabled={isPending}
          className={`${BUTTON_PRIMARY} w-full py-3 sm:ml-auto sm:w-auto`}
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
          {t("submit")}
        </button>
      </div>
    </form>
  );
}
