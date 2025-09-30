import * as StoreReview from 'expo-store-review';
import AsyncStorage from '@react-native-async-storage/async-storage';

const REVIEW_STORAGE_KEY = '@review_prompt';
const MIN_ACTIONS_BEFORE_REVIEW = 3; // Número mínimo de acciones antes de pedir review
const DAYS_BETWEEN_PROMPTS = 30; // Días entre solicitudes de review
const DAYS_AFTER_FIRST_LAUNCH = 3; // Días después del primer uso

interface ReviewData {
  actionCount: number;
  lastPromptDate: string | null;
  firstLaunchDate: string | null;
  hasReviewed: boolean;
}

export class ReviewHelper {
  
  /**
   * Inicializa el sistema de reviews (llamar al inicio de la app)
   */
  static async initialize() {
    const data = await this.getReviewData();
    
    // Si es la primera vez, guardar la fecha de primer lanzamiento
    if (!data.firstLaunchDate) {
      await this.updateReviewData({
        ...data,
        firstLaunchDate: new Date().toISOString(),
      });
    }
  }

  /**
   * Registra una acción completada (reserva, match, etc.)
   */
  static async recordAction() {
    const data = await this.getReviewData();
    await this.updateReviewData({
      ...data,
      actionCount: data.actionCount + 1,
    });
  }

  /**
   * Intenta mostrar el diálogo de review si se cumplen las condiciones
   * @returns true si se intentó mostrar el diálogo, false si no
   */
  static async requestReviewIfAppropriate(): Promise<boolean> {
    // Verificar si la funcionalidad está disponible
    const isAvailable = await StoreReview.isAvailableAsync();
    if (!isAvailable) {
      console.log('📱 [Review] Store review no disponible en este dispositivo');
      return false;
    }

    const data = await this.getReviewData();

    // Si ya revisó, no molestar más
    if (data.hasReviewed) {
      console.log('⭐ [Review] Usuario ya ha dejado review');
      return false;
    }

    // Verificar si han pasado suficientes días desde el primer lanzamiento
    if (data.firstLaunchDate) {
      const daysSinceFirstLaunch = this.getDaysSince(data.firstLaunchDate);
      if (daysSinceFirstLaunch < DAYS_AFTER_FIRST_LAUNCH) {
        console.log(`📅 [Review] Solo han pasado ${daysSinceFirstLaunch} días desde el primer uso`);
        return false;
      }
    }

    // Verificar que el usuario haya hecho suficientes acciones
    if (data.actionCount < MIN_ACTIONS_BEFORE_REVIEW) {
      console.log(`📊 [Review] Solo ${data.actionCount} acciones, se necesitan ${MIN_ACTIONS_BEFORE_REVIEW}`);
      return false;
    }

    // Verificar que hayan pasado suficientes días desde el último prompt
    if (data.lastPromptDate) {
      const daysSinceLastPrompt = this.getDaysSince(data.lastPromptDate);
      if (daysSinceLastPrompt < DAYS_BETWEEN_PROMPTS) {
        console.log(`⏳ [Review] Solo han pasado ${daysSinceLastPrompt} días desde el último prompt`);
        return false;
      }
    }

    // ¡Todas las condiciones se cumplen! Intentar mostrar el diálogo
    console.log('✨ [Review] Mostrando diálogo de review...');
    await StoreReview.requestReview();
    
    // Actualizar la fecha del último prompt
    await this.updateReviewData({
      ...data,
      lastPromptDate: new Date().toISOString(),
    });

    return true;
  }

  /**
   * Marca que el usuario ya dejó una review (llamar si detectas que revisó)
   */
  static async markAsReviewed() {
    const data = await this.getReviewData();
    await this.updateReviewData({
      ...data,
      hasReviewed: true,
    });
  }

  /**
   * Abre directamente la página de la app en la App Store para dejar review
   * Útil para un botón "Valora la app" en el perfil
   */
  static async openAppStoreForReview() {
    const hasAction = await StoreReview.hasAction();
    if (hasAction) {
      await StoreReview.requestReview();
    } else {
      console.log('No hay acción de review disponible');
    }
  }

  /**
   * Reset del sistema (útil para testing)
   */
  static async reset() {
    await AsyncStorage.removeItem(REVIEW_STORAGE_KEY);
    console.log('🔄 [Review] Sistema de reviews reseteado');
  }

  // ===== Métodos privados =====

  private static async getReviewData(): Promise<ReviewData> {
    try {
      const data = await AsyncStorage.getItem(REVIEW_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading review data:', error);
    }

    // Datos por defecto
    return {
      actionCount: 0,
      lastPromptDate: null,
      firstLaunchDate: null,
      hasReviewed: false,
    };
  }

  private static async updateReviewData(data: ReviewData) {
    try {
      await AsyncStorage.setItem(REVIEW_STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving review data:', error);
    }
  }

  private static getDaysSince(dateString: string): number {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }
}