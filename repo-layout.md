# Repository layout (monorepo recommended)
/
├─ infra/                      # k8s manifests, terraform, helm charts
├─ services/
│  ├─ auth-service/
│  ├─ products-service/
│  ├─ reviews-service/
│  ├─ ingestion-service/
│  ├─ ml-services/
│  │  ├─ sentiment-service/
│  │  ├─ summarizer-service/
│  │  ├─ recommender-service/
│  └─ admin-dashboard/
├─ ml/
│  ├─ notebooks/
│  ├─ experiments/
│  ├─ training_scripts/
│  └─ model_registry/
├─ infra-as-code/              # terraform / cloudformation
├─ scripts/                    # dev helpers, data loaders
├─ docs/
└─ .github/
   └─ workflows/               # CI pipelines