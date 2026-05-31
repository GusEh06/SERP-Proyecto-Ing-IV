import type { ListasData } from "../types";

export function validateStep3(data: ListasData): string[] {
  const errors: string[] = [];
  const values = Object.values(data);

  if (values.some((value) => value !== "si" && value !== "no")) {
    errors.push("Debe registrar el resultado para todas las listas restrictivas");
  }

  return errors;
}
