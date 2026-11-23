export const METRIKA_COUNTER_ID = 99999999;

export type MortgageStep = 0 | 1 | 2 | 3 | 'success';

type GoalParams = {
  step: MortgageStep;
  from?: MortgageStep;
  to?: MortgageStep;
  [key: string]: string | number | boolean | undefined;
};

declare global {
  interface Window {
    ym?: (counterId: number, method: 'reachGoal', goal: string, params: GoalParams) => void;
  }
}

/**
 * Точка подключения Яндекс Метрики. Скрипт счётчика намеренно не добавлен:
 * замените заглушку ID при подключении проекта к настоящему счётчику.
 */
export function reachMortgageGoal(goal: string, params: GoalParams) {
  window.ym?.(METRIKA_COUNTER_ID, 'reachGoal', goal, params);
}
