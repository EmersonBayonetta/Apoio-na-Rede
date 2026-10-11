export interface AddressParts { endereco: string; bairro?: string; cidade?: string; estado?: string; cep?: string }

// Splits Google's "Rua X, 120 - Bairro, Cidade - UF, 00000-000, Brasil" so the form does not repeat city, UF and CEP.
export function splitBrazilianAddress(formatted: string): AddressParts {
  const text = formatted.trim().replace(/,\s*(Brasil|Brazil)$/i, '');
  const cep = text.match(/\b\d{5}-?\d{3}\b/)?.[0];
  const withoutCep = cep ? text.replace(new RegExp(`,?\\s*${cep}`), '') : text;
  const city = withoutCep.match(/^(.*?),?\s*([^,]+?)\s+-\s+([A-Z]{2})$/);
  if (!city) return { endereco: formatted.trim(), cep };
  const [, street, cidade, estado] = city;
  const separator = street.lastIndexOf(' - ');
  const endereco = (separator > 0 ? street.slice(0, separator) : street).trim();
  const bairro = separator > 0 ? street.slice(separator + 3).trim() : undefined;
  return { endereco, bairro: bairro || undefined, cidade: cidade.trim(), estado, cep: cep?.replace(/^(\d{5})(\d{3})$/, '$1-$2') };
}
