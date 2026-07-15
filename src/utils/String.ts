export const Regexes = {
  PASSWORD: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,64}$/,
  NAME: /^.{3,}$/u,
};

export const escapeSpecialChars = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
