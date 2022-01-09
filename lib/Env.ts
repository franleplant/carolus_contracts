export function get(key: string, kind: "string"): string;
export function get(key: string, kind: "number"): number;
export function get(key: string, kind: "boolean"): boolean;
export function get(key: string): string;
export function get(key: string, kind: unknown = "string"): unknown {
  const value = process.env[key];
  if (!value) {
    throw new Error(`missing process.env.${key}`);
  }

  switch (kind) {
    case "string": {
      return value;
    }
    case "number": {
      return Number(value);
    }
    case "boolean": {
      return value === "true";
    }
  }

  throw new Error("getEnv: Bad arguments");
}

export default { get };
