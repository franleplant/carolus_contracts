// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Fn = (...args: Array<any>) => any;

export function fnSignatureToString<F extends Fn>(
  fn: F,
  args: Parameters<F>
): string {
  const argsString = args
    .map((a) => {
      if (typeof a === "object") {
        return `{${Object.keys(a).join(", ")}}`;
      }

      return a?.toString();
    })
    .join(", ");
  return `${fn.name}(${argsString})`;
}

export default async function retry<F extends Fn>(
  fn: F,
  args: Parameters<F>,
  triesLeft = 10
): Promise<ReturnType<F>> {
  try {
    return await fn(...args);
  } catch (err) {
    console.log(
      `>>> Retring ${fnSignatureToString(fn, args)}. Tries left ${triesLeft}`
    );
    console.log(err);
    if (triesLeft > 0) {
      return retry(fn, args, triesLeft - 1);
    } else {
      throw new Error(`no more tries for ${fnSignatureToString(fn, args)}`);
    }
  }
}
