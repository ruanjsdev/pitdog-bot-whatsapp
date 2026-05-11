function unique(values) {
  return [...new Set(values)];
}

function buildBrazilCandidates(nationalNumber, countryCode) {
  const candidates = [`${countryCode}${nationalNumber}`];

  if (nationalNumber.length === 10) {
    const areaCode = nationalNumber.slice(0, 2);
    const localNumber = nationalNumber.slice(2);
    candidates.push(`${countryCode}${areaCode}9${localNumber}`);
  }

  if (nationalNumber.length === 11 && nationalNumber[2] === '9') {
    const areaCode = nationalNumber.slice(0, 2);
    const localNumberWithoutNine = nationalNumber.slice(3);
    const withoutNinthDigit = `${countryCode}${areaCode}${localNumberWithoutNine}`;

    if (areaCode === '91') {
      return [withoutNinthDigit, `${countryCode}${nationalNumber}`];
    }

    candidates.push(withoutNinthDigit);
  }

  return candidates;
}

export function normalizePhoneCandidates(phone, defaultCountryCode = '55') {
  if (!phone) {
    throw new Error('Telefone do cliente nao informado.');
  }

  let digits = String(phone).replace(/\D/g, '').replace(/^0+/, '');
  const countryCode = String(defaultCountryCode).replace(/\D/g, '');
  let nationalNumber = digits;

  if (digits.startsWith(countryCode)) {
    nationalNumber = digits.slice(countryCode.length);
  }

  if (![10, 11].includes(nationalNumber.length)) {
    throw new Error(`Telefone invalido: ${phone}`);
  }

  const candidates =
    countryCode === '55'
      ? buildBrazilCandidates(nationalNumber, countryCode)
      : [`${countryCode}${nationalNumber}`];

  return unique(candidates).map((candidate) => `${candidate}@s.whatsapp.net`);
}

export function normalizePhoneToJid(phone, defaultCountryCode = '55') {
  return normalizePhoneCandidates(phone, defaultCountryCode)[0];
}
