#!/usr/bin/env node

const { exec } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Fonction pour exécuter une commande et attendre la fin
function execCommand(command, description) {
  return new Promise((resolve, reject) => {
    console.log(`${colors.cyan}⏳ ${description}...${colors.reset}`);
    
    const child = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`${colors.yellow}⚠️  Erreur: ${error.message}${colors.reset}`);
        reject(error);
        return;
      }
      if (stderr && !stderr.includes('pulling')) {
        console.error(`${colors.yellow}${stderr}${colors.reset}`);
      }
      resolve(stdout);
    });

    // Afficher la progression en temps réel
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });

    child.stderr.on('data', (data) => {
      process.stdout.write(data);
    });
  });
}

// Fonction pour poser une question oui/non
function askYesNo(question) {
  return new Promise((resolve) => {
    rl.question(`${question} (o/n) [o]: `, (answer) => {
      resolve(!answer || answer.toLowerCase() === 'o' || answer.toLowerCase() === 'y');
    });
  });
}

// Vérifier si Ollama est en cours d'exécution
async function checkOllamaRunning() {
  try {
    const output = await execCommand(
      'docker compose -f docker-compose.dev.yml ps ollama',
      'Vérification du service Ollama'
    );
    // Vérifier si le conteneur est "Up" (running)
    return output.includes('Up') || output.includes('running');
  } catch (error) {
    return false;
  }
}

// Configuration principale
async function main() {
  console.log(`${colors.bold}${colors.blue}`);
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║         🤖 Configuration d\'Ollama - Projet RAG           ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log(colors.reset);

  // Étape 1: Vérifier si Ollama est en cours d'exécution
  console.log(`${colors.bold}${colors.green}Étape 1: Vérification du service Ollama${colors.reset}`);
  
  const isRunning = await checkOllamaRunning();
  
  if (!isRunning) {
    console.log(`${colors.yellow}⚠️  Le service Ollama n'est pas démarré${colors.reset}`);
    const shouldStart = await askYesNo('Voulez-vous démarrer Ollama maintenant?');
    
    if (shouldStart) {
      try {
        await execCommand('docker compose -f docker-compose.dev.yml up -d ollama', 'Démarrage d\'Ollama');
        console.log(`${colors.green}✅ Ollama démarré avec succès${colors.reset}`);
        
        // Attendre que le service soit prêt
        console.log(`${colors.cyan}⏳ Attente du démarrage complet (10 secondes)...${colors.reset}`);
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error(`${colors.yellow}❌ Impossible de démarrer Ollama${colors.reset}`);
        console.log(`${colors.yellow}Veuillez exécuter manuellement: docker compose -f docker-compose.dev.yml up -d ollama${colors.reset}`);
        rl.close();
        process.exit(1);
      }
    } else {
      console.log(`${colors.yellow}❌ Ollama doit être démarré pour continuer${colors.reset}`);
      console.log(`${colors.yellow}Exécutez: docker compose -f docker-compose.dev.yml up -d ollama${colors.reset}`);
      rl.close();
      process.exit(1);
    }
  } else {
    console.log(`${colors.green}✅ Ollama est en cours d'exécution${colors.reset}`);
  }

  console.log('');

  // Étape 2: Vérifier les modèles existants
  console.log(`${colors.bold}${colors.green}Étape 2: Vérification des modèles installés${colors.reset}`);
  
  let existingModels = '';
  try {
    existingModels = await execCommand(
      'docker compose -f docker-compose.dev.yml exec ollama ollama list',
      'Liste des modèles'
    );
    // Le résultat est déjà affiché par execCommand via stdout.on('data')
  } catch (error) {
    console.log(`${colors.yellow}Aucun modèle installé${colors.reset}`);
  }

  console.log('');

  // Étape 3: Télécharger le modèle LLM
  console.log(`${colors.bold}${colors.green}Étape 3: Modèle de langage (LLM)${colors.reset}`);
  console.log(`${colors.cyan}Modèle recommandé: llama3.2 (2GB)${colors.reset}`);
  console.log(`${colors.yellow}Autres options: llama3.2:1b (plus léger), mistral, phi3${colors.reset}`);
  
  const hasLlama = existingModels.includes('llama3.2');
  
  if (hasLlama) {
    console.log(`${colors.green}✅ llama3.2 est déjà installé${colors.reset}`);
    const shouldReinstall = await askYesNo('Voulez-vous le retélécharger?');
    
    if (shouldReinstall) {
      try {
        await execCommand(
          'docker compose -f docker-compose.dev.yml exec ollama ollama pull llama3.2',
          'Téléchargement de llama3.2'
        );
        console.log(`${colors.green}✅ llama3.2 téléchargé${colors.reset}`);
      } catch (error) {
        console.error(`${colors.yellow}❌ Échec du téléchargement${colors.reset}`);
      }
    }
  } else {
    const shouldInstallLlama = await askYesNo('Voulez-vous télécharger llama3.2?');
    
    if (shouldInstallLlama) {
      try {
        await execCommand(
          'docker compose -f docker-compose.dev.yml exec ollama ollama pull llama3.2',
          'Téléchargement de llama3.2 (peut prendre plusieurs minutes)'
        );
        console.log(`${colors.green}✅ llama3.2 téléchargé avec succès${colors.reset}`);
      } catch (error) {
        console.error(`${colors.yellow}❌ Échec du téléchargement${colors.reset}`);
      }
    }
  }

  console.log('');

  // Étape 4: Télécharger le modèle d'embeddings
  console.log(`${colors.bold}${colors.green}Étape 4: Modèle d'embeddings${colors.reset}`);
  console.log(`${colors.cyan}Modèle recommandé: nomic-embed-text (274MB)${colors.reset}`);
  console.log(`${colors.yellow}Nécessaire pour la recherche vectorielle (RAG)${colors.reset}`);
  
  const hasEmbeddings = existingModels.includes('nomic-embed-text');
  
  if (hasEmbeddings) {
    console.log(`${colors.green}✅ nomic-embed-text est déjà installé${colors.reset}`);
    const shouldReinstall = await askYesNo('Voulez-vous le retélécharger?');
    
    if (shouldReinstall) {
      try {
        await execCommand(
          'docker compose -f docker-compose.dev.yml exec ollama ollama pull nomic-embed-text',
          'Téléchargement de nomic-embed-text'
        );
        console.log(`${colors.green}✅ nomic-embed-text téléchargé${colors.reset}`);
      } catch (error) {
        console.error(`${colors.yellow}❌ Échec du téléchargement${colors.reset}`);
      }
    }
  } else {
    const shouldInstallEmbeddings = await askYesNo('Voulez-vous télécharger nomic-embed-text?');
    
    if (shouldInstallEmbeddings) {
      try {
        await execCommand(
          'docker compose -f docker-compose.dev.yml exec ollama ollama pull nomic-embed-text',
          'Téléchargement de nomic-embed-text'
        );
        console.log(`${colors.green}✅ nomic-embed-text téléchargé avec succès${colors.reset}`);
      } catch (error) {
        console.error(`${colors.yellow}❌ Échec du téléchargement${colors.reset}`);
      }
    }
  }

  console.log('');

  // Étape 5: Tester l'installation
  console.log(`${colors.bold}${colors.green}Étape 5: Test de l'installation${colors.reset}`);
  const shouldTest = await askYesNo('Voulez-vous tester Ollama avec une question?');
  
  if (shouldTest) {
    try {
      console.log(`${colors.cyan}Question test: "Quelle est la capitale de la France?"${colors.reset}`);
      const response = await execCommand(
        'docker compose -f docker-compose.dev.yml exec ollama ollama run llama3.2 "Quelle est la capitale de la France? Réponds en une phrase."',
        'Test d\'Ollama'
      );
      // La réponse est déjà affichée en temps réel par execCommand
      console.log(`${colors.green}✅ Test terminé${colors.reset}`);
    } catch (error) {
      console.error(`${colors.yellow}❌ Échec du test${colors.reset}`);
    }
  }

  console.log('');
  console.log(`${colors.bold}${colors.green}╔════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.bold}${colors.green}║              ✅ Configuration terminée!                    ║${colors.reset}`);
  console.log(`${colors.bold}${colors.green}╚════════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log('');
  console.log(`${colors.bold}📋 Résumé:${colors.reset}`);
  
  try {
    const finalList = await execCommand(
      'docker compose -f docker-compose.dev.yml exec ollama ollama list',
      'Modèles installés'
    );
    // Le résultat est déjà affiché par execCommand via stdout.on('data')
  } catch (error) {
    console.log(`${colors.yellow}Impossible de lister les modèles${colors.reset}`);
  }

  console.log('');
  console.log(`${colors.bold}${colors.blue}💡 Commandes utiles:${colors.reset}`);
  console.log(`  • Liste des modèles:     ${colors.cyan}npm run ollama:list${colors.reset}`);
  console.log(`  • Tester Ollama:         ${colors.cyan}npm run ollama:test${colors.reset}`);
  console.log(`  • Shell Ollama:          ${colors.cyan}npm run ollama:shell${colors.reset}`);
  console.log(`  • Démarrer l'API:        ${colors.cyan}npm run docker:up${colors.reset}`);
  console.log('');
  console.log(`${colors.green}🚀 Votre environnement RAG est prêt!${colors.reset}`);
  
  rl.close();
}

// Gestion des erreurs
process.on('unhandledRejection', (error) => {
  console.error(`${colors.yellow}❌ Erreur non gérée:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});

// Exécution
main().catch((error) => {
  console.error(`${colors.yellow}❌ Erreur:${colors.reset}`, error);
  rl.close();
  process.exit(1);
});