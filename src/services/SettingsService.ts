import { injectable } from 'inversify';
import User from '../models/User';

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
  };
  dashboard: {
    defaultPeriod: 'today' | 'week' | 'month' | 'quarter' | 'year';
    refreshInterval: number;
    widgets: string[];
  };
  alerts: {
    enabled: boolean;
    thresholds: {
      sentiment: number;
      nps: number;
      complaint: number;
    };
  };
  export: {
    defaultFormat: 'pdf' | 'excel';
    includeCharts: boolean;
  };
}

@injectable()
export class SettingsService {
  private getDefaultSettings(): UserSettings {
    return {
      theme: 'light',
      language: 'tr',
      dateFormat: 'dd.MM.yyyy',
      timeFormat: '24h',
      notifications: {
        email: true,
        push: false,
        inApp: true,
      },
      dashboard: {
        defaultPeriod: 'month',
        refreshInterval: 300000, // 5 minutes
        widgets: ['sentiment', 'nps', 'alerts', 'recent-feedback'],
      },
      alerts: {
        enabled: true,
        thresholds: {
          sentiment: -0.7,
          nps: 30,
          complaint: 10,
        },
      },
      export: {
        defaultFormat: 'pdf',
        includeCharts: true,
      },
    };
  }

  async getUserSettings(userId: number): Promise<UserSettings> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get settings from user preferences (stored as JSON in a settings column)
    // For now, return defaults. You can add a settings column to User model later
    const settingsJson = (user as any).settings;
    if (settingsJson) {
      try {
        const parsed = typeof settingsJson === 'string' ? JSON.parse(settingsJson) : settingsJson;
        return { ...this.getDefaultSettings(), ...parsed };
      } catch (e) {
        return this.getDefaultSettings();
      }
    }

    return this.getDefaultSettings();
  }

  async updateUserSettings(userId: number, settings: Partial<UserSettings>): Promise<UserSettings> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const currentSettings = await this.getUserSettings(userId);
    const updatedSettings = { ...currentSettings, ...settings };

    // Save to user settings (you can add a settings JSON column to User model)
    // For now, we'll store in a JSON field if it exists
    if ((user as any).settings !== undefined) {
      await user.update({ settings: JSON.stringify(updatedSettings) } as any);
    }

    return updatedSettings;
  }

  async resetUserSettings(userId: number): Promise<void> {
    const defaults = this.getDefaultSettings();
    await this.updateUserSettings(userId, defaults);
  }
}
