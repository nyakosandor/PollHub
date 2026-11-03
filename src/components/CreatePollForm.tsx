"use client";

import { useState, FormEvent } from "react";
import { useTranslations } from "next-intl";
import { usePolls } from "@/context/PollContext";
import { NewPoll } from "@/types";
import {
  defaultClosingTime,
  isClosed,
  toDateTimeInputValue,
} from "@/lib/closingTime";
import { createId } from "@/lib/ids";
import { useTimeout } from "@/lib/useTimeout";
import { Plus, Trash2, PlusCircle } from "lucide-react";

const MIN_OPTIONS = 2;
const SUCCESS_MESSAGE_MS = 2500;
const INPUT_CLASS =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

interface DraftOption {
  id: string;
  text: string;
}

const createDraftOption = (): DraftOption => ({ id: createId("draft"), text: "" });
const createEmptyDraftOptions = () =>
  Array.from({ length: MIN_OPTIONS }, createDraftOption);

const createDefaultClosingInput = () =>
  toDateTimeInputValue(defaultClosingTime(Date.now()));

type ValidationError =
  | "titleRequired"
  | "questionRequired"
  | "optionsRequired"
  | "closingTimeRequired"
  | "closingTimeInPast";

function validatePoll({
  title,
  questionText,
  optionTexts,
  closesAt,
}: NewPoll): ValidationError | null {
  if (!title) return "titleRequired";
  if (!questionText) return "questionRequired";
  if (optionTexts.length < MIN_OPTIONS) {
    return "optionsRequired";
  }
  if (Number.isNaN(closesAt)) return "closingTimeRequired";
  if (isClosed(closesAt, Date.now())) {
    return "closingTimeInPast";
  }
  return null;
}

export default function CreatePollForm() {
  const t = useTranslations("form");
  const { createPoll } = usePolls();
  const scheduleTimeout = useTimeout();
  const [title, setTitle] = useState("");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState<DraftOption[]>(createEmptyDraftOptions);
  const [closingInput, setClosingInput] = useState(createDefaultClosingInput);
  const [error, setError] = useState<ValidationError | null>(null);
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

    const newPoll: NewPoll = {
      title: title.trim(),
      questionText: question.trim(),
      optionTexts: options.map((option) => option.text.trim()).filter(Boolean),
      closesAt: new Date(closingInput).getTime(),
    };

    const validationError = validatePoll(newPoll);
    setError(validationError);
    if (validationError) return;

    createPoll(newPoll);
    resetForm();
    setShowSuccess(true);
    scheduleTimeout(() => setShowSuccess(false), SUCCESS_MESSAGE_MS);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5"
    >
      <div>
        <label
          htmlFor="poll-title"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {t("title")}
        </label>
        <input
          id="poll-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t("titlePlaceholder")}
          className={INPUT_CLASS}
        />
      </div>

      <div>
        <label
          htmlFor="poll-question"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {t("question")}
        </label>
        <input
          id="poll-question"
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("questionPlaceholder")}
          className={INPUT_CLASS}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 block text-sm font-medium text-slate-700">
          {t("options")}
        </legend>
        <div className="flex flex-col gap-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <input
                type="text"
                value={option.text}
                onChange={(e) => updateOption(option.id, e.target.value)}
                placeholder={t("optionPlaceholder", { number: index + 1 })}
                className={INPUT_CLASS}
              />
              {options.length > MIN_OPTIONS && (
                <button
                  type="button"
                  onClick={() => removeOption(option.id)}
                  className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                  aria-label={t("removeOption", { number: index + 1 })}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addOption}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          <PlusCircle className="h-4 w-4" />
          {t("addOption")}
        </button>
      </fieldset>

      <div>
        <label
          htmlFor="poll-closes-at"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          {t("closingTime")}
        </label>
        <input
          id="poll-closes-at"
          type="datetime-local"
          value={closingInput}
          onChange={(e) => setClosingInput(e.target.value)}
          className={INPUT_CLASS}
        />
      </div>

      {error && (
        <p role="alert" data-testid="form-error" data-error={error} className="text-sm text-red-600">
          {t(`errors.${error}`)}
        </p>
      )}
      {showSuccess && (
        <p data-testid="form-success" className="text-sm font-medium text-emerald-600">
          {t("success")}
        </p>
      )}

      <button
        type="submit"
        data-testid="create-poll-submit"
        className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
      >
        <Plus className="h-4 w-4" />
        {t("submit")}
      </button>
    </form>
  );
}
