import { useReducer, useCallback } from 'react';

export type OperatorType = '+' | '-' | '×' | '÷' | null;

interface CalcState {
  displayValue: string;
  prevValue: number | null;
  operator: OperatorType;
  waitingForOperand: boolean;
  isResult: boolean;
  expression: string;
}

type Action =
  | { type: 'DIGIT'; digit: string }
  | { type: 'DECIMAL' }
  | { type: 'OPERATOR'; op: OperatorType }
  | { type: 'EQUALS' }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_SIGN' }
  | { type: 'PERCENTAGE' }
  | { type: 'BACKSPACE' };

const initial: CalcState = {
  displayValue: '0',
  prevValue: null,
  operator: null,
  waitingForOperand: false,
  isResult: false,
  expression: '',
};

function compute(a: number, b: number, op: OperatorType): number {
  switch (op) {
    case '+': return a + b;
    case '-': return a - b;
    case '×': return a * b;
    case '÷': return b !== 0 ? a / b : NaN;
    default: return b;
  }
}

function fmt(n: number): string {
  if (isNaN(n)) return 'Oops! 🙈';
  if (!isFinite(n)) return 'WOW! 🤯';
  if (Number.isInteger(n)) return String(n);
  return parseFloat(n.toFixed(6)).toString();
}

function reducer(state: CalcState, action: Action): CalcState {
  switch (action.type) {
    case 'DIGIT': {
      const { digit } = action;
      if (state.waitingForOperand || state.isResult) {
        return { ...state, displayValue: digit, waitingForOperand: false, isResult: false };
      }
      if (state.displayValue === '0') return { ...state, displayValue: digit };
      if (state.displayValue.replace('-', '').length >= 9) return state;
      return { ...state, displayValue: state.displayValue + digit };
    }
    case 'DECIMAL': {
      if (state.waitingForOperand || state.isResult) {
        return { ...state, displayValue: '0.', waitingForOperand: false, isResult: false };
      }
      if (state.displayValue.includes('.')) return state;
      return { ...state, displayValue: state.displayValue + '.' };
    }
    case 'OPERATOR': {
      const op = action.op;
      const current = parseFloat(state.displayValue);
      if (state.prevValue !== null && !state.waitingForOperand) {
        const result = compute(state.prevValue, current, state.operator);
        const rs = fmt(result);
        return {
          ...state,
          displayValue: rs,
          prevValue: result,
          operator: op,
          waitingForOperand: true,
          expression: `${rs} ${op}`,
          isResult: false,
        };
      }
      return {
        ...state,
        prevValue: current,
        operator: op,
        waitingForOperand: true,
        expression: `${state.displayValue} ${op}`,
        isResult: false,
      };
    }
    case 'EQUALS': {
      if (state.prevValue === null || state.operator === null) {
        return { ...state, isResult: true };
      }
      const current = parseFloat(state.displayValue);
      const result = compute(state.prevValue, current, state.operator);
      return {
        displayValue: fmt(result),
        prevValue: null,
        operator: null,
        waitingForOperand: false,
        isResult: true,
        expression: '',
      };
    }
    case 'CLEAR':
      return initial;
    case 'TOGGLE_SIGN': {
      const n = parseFloat(state.displayValue);
      if (isNaN(n)) return initial;
      return { ...state, displayValue: String(-n), isResult: false };
    }
    case 'PERCENTAGE': {
      const n = parseFloat(state.displayValue);
      return { ...state, displayValue: fmt(n / 100), isResult: false };
    }
    case 'BACKSPACE': {
      if (state.isResult || state.displayValue.length <= 1) {
        return { ...state, displayValue: '0', isResult: false };
      }
      const next = state.displayValue.slice(0, -1);
      return { ...state, displayValue: next === '-' ? '0' : next, isResult: false };
    }
    default:
      return state;
  }
}

export function useCalculator() {
  const [state, dispatch] = useReducer(reducer, initial);

  return {
    displayValue: state.displayValue,
    expression: state.expression,
    activeOperator: state.operator,
    isResult: state.isResult,
    inputDigit: useCallback((d: string) => dispatch({ type: 'DIGIT', digit: d }), []),
    inputDecimal: useCallback(() => dispatch({ type: 'DECIMAL' }), []),
    setOperator: useCallback((op: OperatorType) => dispatch({ type: 'OPERATOR', op }), []),
    calculate: useCallback(() => dispatch({ type: 'EQUALS' }), []),
    clear: useCallback(() => dispatch({ type: 'CLEAR' }), []),
    toggleSign: useCallback(() => dispatch({ type: 'TOGGLE_SIGN' }), []),
    percentage: useCallback(() => dispatch({ type: 'PERCENTAGE' }), []),
    backspace: useCallback(() => dispatch({ type: 'BACKSPACE' }), []),
  };
}
