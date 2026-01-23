function cartesian<T>(arrays: T[][]): T[][] {
  return arrays.reduce(
    (acc, curr) => acc.flatMap((a) => curr.map((b) => [...a, b])),
    [[]] as T[][],
  );
}
export const ProductCreateUtils = {
  cartesian,
};
