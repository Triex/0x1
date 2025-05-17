declare module 'prompts' {
  export interface PromptObject<T extends string = string> {
    type: string;
    name: T;
    message: string | ((prev: any, values: any) => string);
    initial?: any | ((prev: any) => any);
    choices?: Array<{ title: string; value: any }>;
    validate?: (value: any) => boolean | string | Promise<boolean | string>;
    format?: (value: any) => any;
    onRender?: (kleur: any) => void;
    onState?: (state: any) => void;
    min?: number;
    max?: number;
    hint?: string;
    style?: 'default' | 'password' | 'invisible' | 'emoji';
    instructions?: string | boolean;
    active?: string;
    inactive?: string;
    separator?: string;
  }
  
  export default function prompts<T extends string = string>(
    questions: PromptObject<T> | Array<PromptObject<T>>,
    options?: {
      onSubmit?: (prompt: PromptObject, answer: any, answers: any) => boolean | Promise<boolean>;
      onCancel?: (prompt: PromptObject, answers: any) => boolean | Promise<boolean>;
    }
  ): Promise<Record<T, any>>;
}
