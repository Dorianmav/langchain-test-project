# 📚 Documentation Technique

> **Guides spécialisés** pour la sécurité, les opérations et les tests

---

## 📂 Structure

```
docs/
├── security/           # 🔒 Guides de sécurité
│   ├── JWT_GUIDE.md
│   ├── SECURITY_GUIDE.md
│   └── SECURITY_TESTING.md
│
├── operations/         # 🔧 Guides opérationnels
│   ├── AUDIT_GUIDE.md
│   └── DOCKER_GUIDE.md
│
└── testing/            # 🧪 Tests
    └── (voir test-scripts/ à la racine)
```

---

## 🔒 Sécurité

### [JWT_GUIDE.md](security/JWT_GUIDE.md)
Authentification JWT complète
- Obtenir et utiliser un token
- Protection des routes
- Configuration et best practices

### [SECURITY_GUIDE.md](security/SECURITY_GUIDE.md)
Guide de sécurité pour production
- Bonnes pratiques
- Checklist de déploiement
- Protection Swagger

### [SECURITY_TESTING.md](security/SECURITY_TESTING.md)
Tests de sécurité
- Tester l'authentification
- Validation des credentials

---

## 🔧 Opérations

### [AUDIT_GUIDE.md](operations/AUDIT_GUIDE.md)
Système d'audit et traçabilité
- Architecture de l'audit
- Cas d'usage (RGPD, SOC2, ISO 27001)
- API d'audit

### [DOCKER_GUIDE.md](operations/DOCKER_GUIDE.md)
Docker et workflow de développement
- Comprendre Docker
- Commandes npm et Makefile
- Structure des conteneurs

---

## 🧪 Tests

Les scripts de test se trouvent dans `/test-scripts/` à la racine du projet.

Voir [test-scripts/README.md](../test-scripts/README.md)

---

## 🔙 Retour

- 📖 [README principal](../README.md)
- ⚡ [Quick Start](../QUICK_START.md)
- 📝 [CHANGELOG](../CHANGELOG.md)
- 🤝 [CONTRIBUTING](../CONTRIBUTING.md)
