export const guid = (): string => {
  function s4(): string {
    return ((1 + Math.random()) * 0x10000 | 0).toString(16).substring(1);
  }

  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}
