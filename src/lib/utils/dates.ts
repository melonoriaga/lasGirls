import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const formatDate = (value: string, pattern = "d MMM yyyy") => {
  try {
    return format(parseISO(value), pattern, { locale: es });
  } catch {
    return value;
  }
};
