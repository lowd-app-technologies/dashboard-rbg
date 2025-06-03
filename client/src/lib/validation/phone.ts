import { z } from "zod";

export const phoneSchema = z.string()
  .transform((val) => val ? val.trim() : '')
  .refine(
    (val) => {
      if (!val || val === '') return true; // Campo opcional
      // Remove formatação e verifica se tem entre 9 e 15 dígitos
      const numbers = val.replace(/\D/g, '');
      // Aceita números portugueses (9 dígitos começando com 9, 2 ou 3)
      // ou números internacionais (até 15 dígitos incluindo código do país)
      const isValidPortuguese = /^[923]\d{8}$/.test(numbers);
      const isValidInternational = /^\d{9,15}$/.test(numbers);
      return isValidPortuguese || isValidInternational;
    },
    { 
      message: "Número de telefone inválido. Use o formato 912 345 678 (nacional) ou +351 912 345 678 (internacional)" 
    }
  )
  .optional()
  .or(z.literal(''))
  .transform(val => val === '' ? undefined : val);

export const formatPhone = (value: string): string => {
  if (!value) return '';
  
  // Remove tudo que não for dígito
  const numbers = value.replace(/\D/g, '');
  
  // Se não houver dígitos, retorna vazio
  if (numbers.length === 0) return '';
  
  // Se começar com 9, 2 ou 3, assume que é um número português sem código do país
  if (/^[923]/.test(numbers)) {
    const limited = numbers.slice(0, 9); // Limita a 9 dígitos para números portugueses
    // Formata como 912 345 678
    if (limited.length <= 3) return limited;
    if (limited.length <= 6) return `${limited.slice(0, 3)} ${limited.slice(3)}`;
    return `${limited.slice(0, 3)} ${limited.slice(3, 6)} ${limited.slice(6, 9)}`;
  }
  
  // Se começar com 351 (código de Portugal), formata como +351 912 345 678
  if (numbers.startsWith('351')) {
    const limited = numbers.slice(0, 12); // 351 + 9 dígitos
    if (limited.length <= 3) return `+${limited}`;
    const rest = limited.slice(3);
    if (rest.length <= 3) return `+${limited.slice(0, 3)} ${rest}`;
    if (rest.length <= 6) return `+${limited.slice(0, 3)} ${rest.slice(0, 3)} ${rest.slice(3)}`;
    return `+${limited.slice(0, 3)} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`;
  }
  
  // Para outros números internacionais, limita a 15 dígitos (incluindo o +)
  const limited = numbers.slice(0, 15);
  
  // Se for muito curto, retorna apenas o sinal de + e os dígitos
  if (limited.length <= 3) return `+${limited}`;
  
  // Formato: +XXX XX XXX XXX XXX
  let formatted = `+${limited.slice(0, 3)}`;
  let remaining = limited.slice(3);
  
  // Adiciona os próximos 2 dígitos
  if (remaining.length > 0) {
    formatted += ` ${remaining.slice(0, 2)}`;
    remaining = remaining.slice(2);
  }
  
  // Adiciona blocos de 3 dígitos
  while (remaining.length > 0) {
    formatted += ` ${remaining.slice(0, 3)}`;
    remaining = remaining.slice(3);
  }
  
  return formatted;
};
