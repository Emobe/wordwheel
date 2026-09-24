import { createContext, useContext } from "react";
import en, { type TranslationKey } from "./en";

export type { TranslationKey };

/** UI language -> strings. Only "en" exists (Plan.md section 5: "English only at launch"). */
const translations = { en };

export type UiLanguage = keyof typeof translations;

export const DEFAULT_UI_LANGUAGE: UiLanguage = "en";

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => (key in vars ? String(vars[key]) : match));
}

export function translate(
  uiLanguage: UiLanguage,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const table = translations[uiLanguage] ?? translations[DEFAULT_UI_LANGUAGE];
  const template = table[key] ?? translations[DEFAULT_UI_LANGUAGE][key] ?? key;
  return interpolate(template, vars);
}

export const I18nContext = createContext<UiLanguage>(DEFAULT_UI_LANGUAGE);

/** `t("some.key")` or `t("some.key", { count: 3 })` — the hook screens are meant to use instead of hardcoded strings. */
export function useTranslation() {
  const uiLanguage = useContext(I18nContext);
  return (key: TranslationKey, vars?: Record<string, string | number>) => translate(uiLanguage, key, vars);
}
