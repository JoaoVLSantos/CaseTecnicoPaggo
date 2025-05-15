export interface HFChoice {
    generated_text: string;
  }
  
  export type HFResponse = 
    | { error: string }
    | { generated_text: string }
    | HFChoice[];