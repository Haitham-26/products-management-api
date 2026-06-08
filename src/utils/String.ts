export const Regexes = {
  PASSWORD: /^[A-Za-z0-9!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]*$/,
  NAME: /^.{3,}$/u,
};

export const escapeSpecialChars = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
