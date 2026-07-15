import { AppLangs } from "../../settings/types/AppLangs.enum";

export interface SignUpEmailDto {
  email: string;
  password: string;
  name: string;
  company?: string;
  lang: AppLangs;
  dir: "rtl" | "ltr";
}
