import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default [
  {
    ignores: [".next/**", "coverage/**", "dist/**", "uploads/**"],
  },
  ...nextVitals,
  ...nextTypescript,
  {
    files: [
      "src/components/ui/sortable.tsx",
      "src/lib/compose-refs.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/use-memo": "off",
    },
  },
];
