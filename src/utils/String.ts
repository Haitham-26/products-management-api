export const Regexes = {
  PASSWORD: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,64}$/,
  NAME: /^[\p{L}]+(?:[ '-][\p{L}]+)*$/u,
};

export const escapeSpecialChars = (text: string) => {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
