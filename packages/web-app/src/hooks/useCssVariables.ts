export const useSetCSSVariable = (name: string, val: string): void => {
  document.documentElement.style.setProperty(name, val);
};

export const useGetCSSVariable = (name: string): string => getComputedStyle(
  document.documentElement,
).getPropertyValue(name);
