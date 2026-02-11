const { exec } = require('child_process');
const fs = require('fs');

const file = process.argv[2];

if (!file) {
  console.error('⚠️  Usage: npm run db:restore -- backups/backup.sql');
  process.exit(1);
}

if (!fs.existsSync(file)) {
  console.error(`❌ Fichier non trouvé: ${file}`);
  process.exit(1);
}

console.log('📥 Restauration de la base de données...');

exec(
  `type ${file} | docker-compose exec -T postgres psql -U raguser -d ragdb`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
      return;
    }
    console.log('✅ Base de données restaurée');
  }
);