export type RegistrationTextField = 'nome' | 'descricao' | 'endereco' | 'cidade';
export const registrationTextSchema: Readonly<Record<RegistrationTextField, Readonly<{label:string;min:number;max:number}>>>;
export function registrationTextError(field: RegistrationTextField, value: unknown): string | null;
export function validPhotoUrl(value: string): boolean;
export function validCoordinates(latitude: number, longitude: number): boolean;
export function validUf(value: string): boolean;
export function validateRegistration(data: {nome:string;descricao:string;endereco:string;cidade:string;estado:string;latitude:number;longitude:number;fotos:string[]}): void;
