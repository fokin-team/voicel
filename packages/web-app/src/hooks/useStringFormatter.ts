/**
 Get first (max) 3 letters of title.
 If letters > 3, then return first letter of first and last words.
 */
export const useFirstLetters = (name: string, isOnlyFirstSymbol = false) => {
  let sValue = name.split(' ').map((x) => x[0]);
  if (sValue.length > 1 && !isOnlyFirstSymbol) {
    sValue = [sValue[0], sValue[1]];
  } else {
    sValue = [sValue[0]];
  }
  return sValue.join('');
};
