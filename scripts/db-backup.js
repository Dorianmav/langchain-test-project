const { exec } = require('child_process');
const fs = require('fs');

const backupDir = './backups';
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir);
}

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
const filename = `backup_${timestamp}.sql`;

console.log('💾 Backup de la base de données...');

exec(
  `docker-compose exec -T postgres pg_dump -U raguser ragdb > ${backupDir}/${filename}`,
  (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Erreur: ${error.message}`);
      return;
    }
    console.log(`✅ Backup créé: ${backupDir}/${filename}`);
  }
);