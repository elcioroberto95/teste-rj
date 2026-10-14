import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist/**", "node_modules/**", "src/generated/**"] },
  ...tseslint.configs.recommended,
];
