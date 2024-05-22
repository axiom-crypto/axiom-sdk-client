# Axiom class tree

Inheritance tree:

```bash
AxiomCore
├── AxiomSinglechainBase
│   ├── Axiom (JS)
│   └── Axiom (Web)
└── AxiomCrosschainBase
    ├── AxiomCrosschain (JS)
    └── AxiomCrosschain (Web)
```

Please note that `src/axiom/web` is **NOT** exported through the main export flow and must be kept separate. This is by design and required for the Axiom SDK's `react` package.
