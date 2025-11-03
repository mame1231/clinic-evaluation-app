import { Op } from 'sequelize';
import { Like, PointTransaction } from '../models';
import { GoogleSheetsService } from './googleSheetsService';

export class CleanupService {
  private static instance: CleanupService;

  private constructor() {}

  public static getInstance(): CleanupService {
    if (!CleanupService.instance) {
      CleanupService.instance = new CleanupService();
    }
    return CleanupService.instance;
  }

  public async cleanupOldData(): Promise<void> {
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      console.log(`Cleaning up data older than ${oneYearAgo.toISOString()}`);

      // Delete old likes
      const deletedLikes = await Like.destroy({
        where: {
          createdAt: {
            [Op.lt]: oneYearAgo,
          },
        },
      });

      console.log(`Deleted ${deletedLikes} old likes`);

      // Delete old point transactions
      const deletedTransactions = await PointTransaction.destroy({
        where: {
          createdAt: {
            [Op.lt]: oneYearAgo,
          },
        },
      });

      console.log(`Deleted ${deletedTransactions} old point transactions`);

      // Clean up Google Sheets
      try {
        const googleSheets = new GoogleSheetsService();
        await googleSheets.deleteOldRecords(oneYearAgo);
        console.log('Cleaned up old Google Sheets records');
      } catch (error) {
        console.error('Failed to clean up Google Sheets:', error);
        // Continue even if Google Sheets cleanup fails
      }

    } catch (error) {
      console.error('Cleanup error:', error);
    }
  }

  public startScheduledCleanup(): void {
    // Run cleanup every day at 2 AM
    const scheduledHour = 2;
    
    const scheduleNextCleanup = () => {
      const now = new Date();
      const nextRun = new Date();
      nextRun.setHours(scheduledHour, 0, 0, 0);
      
      // If we've already passed today's scheduled time, schedule for tomorrow
      if (now.getHours() >= scheduledHour) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      
      const delay = nextRun.getTime() - now.getTime();
      
      console.log(`Next cleanup scheduled for ${nextRun.toISOString()}`);
      
      setTimeout(() => {
        this.cleanupOldData();
        scheduleNextCleanup(); // Schedule next cleanup
      }, delay);
    };
    
    scheduleNextCleanup();
    
    // Also run cleanup immediately on startup
    this.cleanupOldData();
  }
}