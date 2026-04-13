export function whatsappLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  const number = clean.startsWith("55") ? clean : "55" + clean;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
