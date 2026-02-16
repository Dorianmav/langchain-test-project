import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Structure des données de quota persistées
 */
interface QuotaData {
  /**
   * Nombre de requêtes utilisées ce mois
   */
  usedQuota: number;

  /**
   * Limite mensuelle de quota
   */
  quotaLimit: number;

  /**
   * Date du dernier reset (ISO string)
   */
  lastResetDate: string;

  /**
   * Mois actuel (YYYY-MM)
   */
  currentMonth: string;

  /**
   * Historique d'utilisation (30 derniers jours)
   */
  history: Array<{
    date: string;
    count: number;
  }>;
}

/**
 * Service de gestion du quota Tavily avec persistance
 * 
 * Persiste l'utilisation du quota dans un fichier JSON
 * Reset automatique mensuel
 */
@Injectable()
export class QuotaManagerService {
  private readonly logger = new Logger(QuotaManagerService.name);
  private readonly quotaFilePath: string;
  private quotaData: QuotaData;

  constructor(private readonly configService: ConfigService) {
    // Chemin du fichier de persistance
    this.quotaFilePath = path.join(process.cwd(), 'data', 'cache', 'tavily-quota.json');
    
    // Charger ou initialiser les données
    this.quotaData = this.loadQuotaData();
    
    // Vérifier si un reset est nécessaire
    this.checkAndResetIfNeeded();
  }

  /**
   * Charge les données de quota depuis le fichier
   */
  private loadQuotaData(): QuotaData {
    try {
      // Créer le répertoire si nécessaire
      const dir = path.dirname(this.quotaFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Charger le fichier s'il existe
      if (fs.existsSync(this.quotaFilePath)) {
        const rawData = fs.readFileSync(this.quotaFilePath, 'utf-8');
        const data = JSON.parse(rawData) as QuotaData;
        
        this.logger.log(`✅ Quota data loaded: ${data.usedQuota}/${data.quotaLimit} used`);
        return data;
      }
    } catch (error) {
      this.logger.warn(`⚠️  Failed to load quota data: ${error.message}`);
    }

    // Initialiser avec les valeurs par défaut
    return this.initializeQuotaData();
  }

  /**
   * Initialise les données de quota
   */
  private initializeQuotaData(): QuotaData {
    const quotaLimit = this.configService.get<number>('TAVILY_QUOTA_LIMIT', 1000);
    const now = new Date();
    
    const data: QuotaData = {
      usedQuota: 0,
      quotaLimit,
      lastResetDate: now.toISOString(),
      currentMonth: this.getCurrentMonth(),
      history: [],
    };

    this.saveQuotaData(data);
    this.logger.log(`✅ Quota data initialized: 0/${quotaLimit}`);
    
    return data;
  }

  /**
   * Sauvegarde les données de quota dans le fichier
   */
  private saveQuotaData(data: QuotaData): void {
    try {
      const dir = path.dirname(this.quotaFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.quotaFilePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
    } catch (error) {
      this.logger.error(`❌ Failed to save quota data: ${error.message}`);
    }
  }

  /**
   * Retourne le mois actuel au format YYYY-MM
   */
  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  /**
   * Vérifie si le quota doit être reset (nouveau mois)
   */
  private checkAndResetIfNeeded(): void {
    const currentMonth = this.getCurrentMonth();
    
    if (this.quotaData.currentMonth !== currentMonth) {
      this.logger.log(`🔄 New month detected, resetting quota (${this.quotaData.currentMonth} → ${currentMonth})`);
      this.resetQuota();
    }
  }

  /**
   * Reset le quota (nouveau mois)
   */
  private resetQuota(): void {
    const now = new Date();
    
    this.quotaData = {
      ...this.quotaData,
      usedQuota: 0,
      lastResetDate: now.toISOString(),
      currentMonth: this.getCurrentMonth(),
    };

    this.saveQuotaData(this.quotaData);
    this.logger.log(`✅ Quota reset: 0/${this.quotaData.quotaLimit}`);
  }

  /**
   * Incrémente le compteur de quota
   */
  incrementUsage(): void {
    this.checkAndResetIfNeeded();

    this.quotaData.usedQuota++;

    // Ajouter à l'historique
    const today = new Date().toISOString().split('T')[0];
    const existingEntry = this.quotaData.history.find(h => h.date === today);

    if (existingEntry) {
      existingEntry.count++;
    } else {
      this.quotaData.history.push({ date: today, count: 1 });
    }

    // Garder seulement les 30 derniers jours
    if (this.quotaData.history.length > 30) {
      this.quotaData.history = this.quotaData.history.slice(-30);
    }

    this.saveQuotaData(this.quotaData);

    this.logger.debug(`📊 Quota used: ${this.quotaData.usedQuota}/${this.quotaData.quotaLimit}`);
  }

  /**
   * Vérifie si le quota est dépassé
   */
  isQuotaExceeded(): boolean {
    this.checkAndResetIfNeeded();
    return this.quotaData.usedQuota >= this.quotaData.quotaLimit;
  }

  /**
   * Retourne le quota restant
   */
  getRemainingQuota(): number {
    this.checkAndResetIfNeeded();
    return Math.max(0, this.quotaData.quotaLimit - this.quotaData.usedQuota);
  }

  /**
   * Retourne les statistiques d'utilisation
   */
  getUsageStats(): {
    usedQuota: number;
    quotaLimit: number;
    remainingQuota: number;
    usagePercentage: number;
    currentMonth: string;
    lastResetDate: string;
    history: Array<{ date: string; count: number }>;
  } {
    this.checkAndResetIfNeeded();

    const remainingQuota = this.getRemainingQuota();
    const usagePercentage = (this.quotaData.usedQuota / this.quotaData.quotaLimit) * 100;

    return {
      usedQuota: this.quotaData.usedQuota,
      quotaLimit: this.quotaData.quotaLimit,
      remainingQuota,
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      currentMonth: this.quotaData.currentMonth,
      lastResetDate: this.quotaData.lastResetDate,
      history: this.quotaData.history,
    };
  }

  /**
   * Force un reset manuel du quota
   */
  forceReset(): void {
    this.logger.warn('⚠️  Manual quota reset triggered');
    this.resetQuota();
  }

  /**
   * Met à jour la limite de quota
   */
  updateQuotaLimit(newLimit: number): void {
    this.quotaData.quotaLimit = newLimit;
    this.saveQuotaData(this.quotaData);
    this.logger.log(`✅ Quota limit updated: ${newLimit}`);
  }
}
